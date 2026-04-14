# app/services/rule_engine.py
# Pre-classification rule engine
# Handles obvious cases WITHOUT calling Claude API
# Saves cost — only ambiguous cases go to Claude

from typing import Optional, Tuple
from app.core.regulation import (
    ANNEX_III_CATEGORIES,
    PROHIBITED_SYSTEMS,
    MINIMAL_RISK_KEYWORDS,
    LIMITED_RISK_KEYWORDS,
    REGULATION_VERSION,
)


class RuleEngineResult:
    """Result from rule engine pre-check."""

    def __init__(
        self,
        risk_tier: str,
        confidence: float,
        reasoning: str,
        annex_iii_article: Optional[str] = None,
        human_review_required: bool = False,
        needs_claude: bool = False,
    ):
        self.risk_tier = risk_tier
        self.confidence = confidence
        self.reasoning = reasoning
        self.annex_iii_article = annex_iii_article
        self.human_review_required = human_review_required
        # If True — send to Claude API for deeper analysis
        self.needs_claude = needs_claude


def _text_contains_keywords(text: str, keywords: list) -> Tuple[bool, str]:
    """
    Check if text contains any keywords from list.
    Returns (found, matched_keyword).
    Case insensitive.
    """
    text_lower = text.lower()
    for keyword in keywords:
        if keyword.lower() in text_lower:
            return True, keyword
    return False, ""


def run_rule_engine(
    name: str,
    purpose: str,
    sector: Optional[str] = None,
    affected_persons: Optional[str] = None,
    questionnaire_answers: Optional[dict] = None,
) -> RuleEngineResult:
    """
    Run pre-classification rules on an AI system.

    Logic:
    1. Check if system matches PROHIBITED patterns → unacceptable
    2. Check if system matches MINIMAL RISK patterns → minimal
    3. Check if system matches LIMITED RISK patterns → limited
    4. Check if system matches any Annex III category → high risk
    5. Nothing matched → send to Claude for deeper analysis

    Returns RuleEngineResult with needs_claude=True if Claude needed.
    """

    # Combine all text for keyword matching
    combined_text = f"{name} {purpose} {sector or ''} {affected_persons or ''}"

    # ----------------------------------------------------------------
    # Rule 1 — Check for PROHIBITED systems (Article 5)
    # ----------------------------------------------------------------
    found, keyword = _text_contains_keywords(combined_text, PROHIBITED_SYSTEMS)
    if found:
        return RuleEngineResult(
            risk_tier="unacceptable",
            confidence=0.95,
            reasoning=(
                f"System matches prohibited AI practice under Article 5 "
                f"of the EU AI Act (matched: '{keyword}'). "
                f"This system cannot be deployed in the EU."
            ),
            human_review_required=True,
            needs_claude=False,
        )

    # ----------------------------------------------------------------
    # Rule 2 — Check for MINIMAL RISK systems
    # ----------------------------------------------------------------
    found, keyword = _text_contains_keywords(combined_text, MINIMAL_RISK_KEYWORDS)
    if found:
        return RuleEngineResult(
            risk_tier="minimal",
            confidence=0.85,
            reasoning=(
                f"System appears to be minimal risk based on its purpose "
                f"(matched: '{keyword}'). No mandatory obligations apply "
                f"under the EU AI Act. Voluntary codes of conduct recommended."
            ),
            needs_claude=False,
        )

    # ----------------------------------------------------------------
    # Rule 3 — Check for LIMITED RISK systems
    # ----------------------------------------------------------------
    found, keyword = _text_contains_keywords(combined_text, LIMITED_RISK_KEYWORDS)
    if found:
        return RuleEngineResult(
            risk_tier="limited",
            confidence=0.85,
            reasoning=(
                f"System appears to be limited risk (matched: '{keyword}'). "
                f"Transparency obligations apply — users must be informed "
                f"they are interacting with an AI system."
            ),
            needs_claude=False,
        )

    # ----------------------------------------------------------------
    # Rule 4 — Check for HIGH RISK Annex III categories
    # ----------------------------------------------------------------
    for category_key, category_data in ANNEX_III_CATEGORIES.items():
        found, keyword = _text_contains_keywords(
            combined_text,
            category_data["keywords"]
        )
        if found:
            # Extra confidence boost for sector match
            confidence = 0.88
            if sector and category_key in sector.lower():
                confidence = 0.93

            return RuleEngineResult(
                risk_tier="high",
                confidence=confidence,
                reasoning=(
                    f"System matches High Risk category: "
                    f"'{category_data['description']}' "
                    f"({category_data['article']}) — "
                    f"matched keyword: '{keyword}'. "
                    f"Full Annex IV documentation required."
                ),
                annex_iii_article=category_data["article"],
                human_review_required=confidence < 0.90,
                needs_claude=False,
            )

    # ----------------------------------------------------------------
    # Rule 5 — Nothing matched clearly — send to Claude
    # ----------------------------------------------------------------
    return RuleEngineResult(
        risk_tier="unclassified",
        confidence=0.0,
        reasoning="System purpose requires deeper analysis.",
        needs_claude=True,
    )