# app/services/claude_service.py
# Calls Claude API for ambiguous classifications
# Only called when rule engine cannot determine risk tier confidently

import json
from typing import Optional
import anthropic
from anthropic.types import TextBlock

from app.core.config import settings
from app.core.regulation import ANNEX_III_CATEGORIES, REGULATION_VERSION


class ClaudeClassificationResult:
    """Result from Claude API classification."""

    def __init__(
        self,
        risk_tier: str,
        confidence: float,
        reasoning: str,
        annex_iii_article: Optional[str] = None,
        human_review_required: bool = False,
        claude_model: str = "",
    ):
        self.risk_tier = risk_tier
        self.confidence = confidence
        self.reasoning = reasoning
        self.annex_iii_article = annex_iii_article
        self.human_review_required = human_review_required
        self.claude_model = claude_model


def build_classification_prompt(
    name: str,
    purpose: str,
    sector: Optional[str],
    affected_persons: Optional[str],
    questionnaire_answers: Optional[dict],
) -> str:
    """
    Build the prompt sent to Claude for classification.
    Includes full Annex III context so Claude reasons legally.
    """

    # Format Annex III categories for prompt
    annex_iii_text = ""
    for key, data in ANNEX_III_CATEGORIES.items():
        annex_iii_text += f"\n- {data['article']}: {data['description']}"
        annex_iii_text += f"\n  Examples: {', '.join(data['examples'][:2])}"

    # Format questionnaire answers if provided
    answers_text = ""
    if questionnaire_answers:
        answers_text = "\n\nQuestionnaire Answers:\n"
        for question, answer in questionnaire_answers.items():
            answers_text += f"- {question}: {answer}\n"

    return f"""You are an expert EU AI Act compliance analyst.

Analyse this AI system and classify it under the EU AI Act 2024/1689.

AI SYSTEM DETAILS:
- Name: {name}
- Purpose: {purpose}
- Sector: {sector or 'Not specified'}
- People affected: {affected_persons or 'Not specified'}
{answers_text}

EU AI ACT RISK TIERS:
1. UNACCEPTABLE - Banned under Article 5 (social scoring, real-time biometric surveillance, subliminal manipulation)
2. HIGH - Requires full Annex IV documentation. Annex III categories:{annex_iii_text}
3. LIMITED - Transparency obligations only (chatbots, deepfakes, AI-generated content)
4. MINIMAL - No mandatory obligations (spam filters, recommendations, inventory management)

INSTRUCTIONS:
- Analyse the system purpose carefully against each Annex III category
- Consider who is affected and what decisions the AI makes
- If the AI makes consequential decisions about people in critical sectors = HIGH RISK
- Be conservative — when in doubt lean toward HIGH RISK

Respond ONLY with valid JSON in this exact format:
{{
  "risk_tier": "high|limited|minimal|unacceptable",
  "annex_iii_article": "Annex III, Point X (or null if not high risk)",
  "confidence": 0.85,
  "reasoning": "Step by step legal reasoning explaining exactly why this classification applies",
  "human_review_required": false
}}

Do not include any text outside the JSON."""


async def classify_with_claude(
    name: str,
    purpose: str,
    sector: Optional[str] = None,
    affected_persons: Optional[str] = None,
    questionnaire_answers: Optional[dict] = None,
) -> ClaudeClassificationResult:
    """
    Send AI system details to Claude for classification.
    Returns structured classification result.
    """

    # Use fallback if no API key configured
    if not settings.ANTHROPIC_API_KEY:
        return ClaudeClassificationResult(
            risk_tier="unclassified",
            confidence=0.0,
            reasoning="Claude API key not configured. Please add ANTHROPIC_API_KEY to .env",
            human_review_required=True,
            claude_model="none",
        )

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    prompt = build_classification_prompt(
        name=name,
        purpose=purpose,
        sector=sector,
        affected_persons=affected_persons,
        questionnaire_answers=questionnaire_answers,
    )

    try:
        # Call Claude API
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=[
                {"role": "user", "content": prompt}
            ],
        )


        # Extract text safely — only TextBlock has .text attribute
        response_text = ""
        for block in message.content:
            if isinstance(block, TextBlock):
                response_text = block.text.strip()
                break

        # Clean JSON if wrapped in markdown code blocks
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()

        result = json.loads(response_text)

        return ClaudeClassificationResult(
            risk_tier=result.get("risk_tier", "unclassified"),
            confidence=float(result.get("confidence", 0.7)),
            reasoning=result.get("reasoning", ""),
            annex_iii_article=result.get("annex_iii_article"),
            human_review_required=result.get("human_review_required", False),
            claude_model=message.model,
        )

    except json.JSONDecodeError as e:
        # Claude returned invalid JSON — flag for human review
        return ClaudeClassificationResult(
            risk_tier="unclassified",
            confidence=0.0,
            reasoning=f"Classification parsing failed — human review required. Error: {str(e)}",
            human_review_required=True,
            claude_model="claude-sonnet-4-20250514",
        )

    except Exception as e:
        # API error — flag for human review
        return ClaudeClassificationResult(
            risk_tier="unclassified",
            confidence=0.0,
            reasoning=f"Classification service error — human review required. Error: {str(e)}",
            human_review_required=True,
            claude_model="claude-sonnet-4-20250514",
        )