# app/services/classification_service.py
# Orchestrates the full classification flow:
# 1. Run rule engine (free)
# 2. If needed — call Claude API
# 3. Store result with full audit trail

import uuid
from typing import Optional, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.ai_system import AISystem, RiskTier, SystemStatus
from app.models.classification import Classification
from app.services.rule_engine import run_rule_engine
from app.services.claude_service import classify_with_claude
from app.services.audit_service import write_audit_log
from app.core.regulation import REGULATION_VERSION
from app.schemas.classification import ClassificationResponse


async def classify_ai_system(
    db: Session,
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    questionnaire_answers: Optional[dict] = None,
    user_id: Optional[uuid.UUID] = None,
) -> ClassificationResponse:
    """
    Full classification flow for one AI system.

    Step 1: Load system from database
    Step 2: Run rule engine (instant, free)
    Step 3: If rule engine uncertain → call Claude API
    Step 4: Store classification result
    Step 5: Update AI system status and risk tier
    Step 6: Write audit log
    Step 7: Return result
    """

    # Step 1 — Load system
    system: Any = db.query(AISystem).filter(
        AISystem.id == system_id,
        AISystem.organisation_id == org_id,
    ).first()

    if not system:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI system not found",
        )

    # Step 2 — Update status to in progress
    # Cast to str to satisfy Pylance — SQLAlchemy handles the enum at runtime
    system.status = SystemStatus.CLASSIFICATION_IN_PROGRESS.value
    db.flush()

    # Step 3 — Run rule engine with explicit str conversion
    rule_result = run_rule_engine(
        name=str(system.name),
        purpose=str(system.purpose),
        sector=str(system.sector) if system.sector else None,
        affected_persons=str(system.affected_persons) if system.affected_persons else None,
        questionnaire_answers=questionnaire_answers,
    )

    # Step 4 — Call Claude if rule engine uncertain
    classification_method = "rule_engine"
    claude_model = None

    if rule_result.needs_claude:
        claude_result = await classify_with_claude(
            name=str(system.name),
            purpose=str(system.purpose),
            sector=str(system.sector) if system.sector else None,
            affected_persons=str(system.affected_persons) if system.affected_persons else None,
            questionnaire_answers=questionnaire_answers,
        )

        # Use Claude result
        risk_tier = claude_result.risk_tier
        confidence = claude_result.confidence
        reasoning = claude_result.reasoning
        annex_iii_article = claude_result.annex_iii_article
        human_review_required = claude_result.human_review_required
        claude_model = claude_result.claude_model
        classification_method = "claude_api"

    else:
        # Use rule engine result
        risk_tier = rule_result.risk_tier
        confidence = rule_result.confidence
        reasoning = rule_result.reasoning
        annex_iii_article = rule_result.annex_iii_article
        human_review_required = rule_result.human_review_required

    # Step 5 — Store classification record
    classification: Any = Classification(
        ai_system_id=system_id,
        organisation_id=org_id,
        triggered_by_user_id=user_id,
        questionnaire_answers=questionnaire_answers,
        risk_tier=risk_tier,
        annex_iii_article=annex_iii_article,
        reasoning=reasoning,
        confidence_score=confidence,
        human_review_required=human_review_required,
        classification_method=classification_method,
        regulation_version=REGULATION_VERSION,
        claude_model_version=claude_model,
    )

    db.add(classification)
    db.flush()

    # Step 6 — Update AI system with classification result
    # Use .value to convert enum to string — avoids Pylance Column[str] warning
    system.risk_tier = RiskTier(risk_tier).value
    system.annex_iii_article = annex_iii_article
    system.classification_reasoning = reasoning
    system.regulation_version = REGULATION_VERSION
    system.human_review_required = human_review_required
    system.status = (
        SystemStatus.NEEDS_REVIEW.value
        if human_review_required
        else SystemStatus.CLASSIFIED.value
    )

    # Step 7 — Write audit log
    write_audit_log(
        db=db,
        action="classification.completed",
        organisation_id=str(org_id),
        user_id=str(user_id) if user_id else None,
        entity_type="classification",
        entity_id=str(classification.id),
        details={
            "ai_system_id": str(system_id),
            "ai_system_name": str(system.name),
            "risk_tier": risk_tier,
            "annex_iii_article": annex_iii_article,
            "confidence": confidence,
            "method": classification_method,
            "human_review_required": human_review_required,
            "regulation_version": REGULATION_VERSION,
        },
    )

    db.commit()
    db.refresh(classification)

    # Step 8 — Return result
    return ClassificationResponse(
        id=classification.id,
        ai_system_id=system_id,
        risk_tier=risk_tier,
        annex_iii_article=annex_iii_article,
        reasoning=reasoning,
        confidence_score=confidence,
        human_review_required=human_review_required,
        classification_method=classification_method,
        regulation_version=REGULATION_VERSION,
        claude_model_version=claude_model,
    )