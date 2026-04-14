# app/services/document_service.py
# Generates Annex IV technical documentation
# Uses Claude API to produce structured, regulation-compliant content

import uuid
import json
from typing import Optional, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.ai_system import AISystem, SystemStatus
from app.models.document import AnnexIVDocument
from app.models.classification import Classification
from app.services.audit_service import write_audit_log
from app.core.regulation import REGULATION_VERSION
from app.core.interview_questions import get_questions_for_system
from app.core.config import settings
import anthropic


def get_system_or_404(
    db: Session,
    org_id: uuid.UUID,
    system_id: uuid.UUID,
) -> Any:
    """Load AI system or raise 404."""
    system = db.query(AISystem).filter(
        AISystem.id == system_id,
        AISystem.organisation_id == org_id,
    ).first()

    if not system:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI system not found",
        )
    return system


def get_latest_classification(
    db: Session,
    system_id: uuid.UUID,
) -> Optional[Any]:
    """Get most recent classification for a system."""
    return (
        db.query(Classification)
        .filter(Classification.ai_system_id == system_id)
        .order_by(Classification.created_at.desc())
        .first()
    )


def build_generation_prompt(
    system_name: str,
    system_purpose: str,
    sector: Optional[str],
    risk_tier: str,
    annex_iii_article: Optional[str],
    interview_answers: dict,
) -> str:
    """
    Build the Claude prompt for Annex IV document generation.
    Includes all interview answers and regulatory context.
    """

    answers_formatted = "\n".join([
        f"- {key}: {value}"
        for key, value in interview_answers.items()
    ])

    return f"""You are an expert EU AI Act compliance specialist.

Generate a complete Annex IV Technical Documentation package for this AI system.

AI SYSTEM DETAILS:
- Name: {system_name}
- Purpose: {system_purpose}
- Sector: {sector or 'General'}
- Risk Classification: {risk_tier.upper()}
- Annex III Reference: {annex_iii_article or 'N/A'}
- Regulation: EU AI Act 2024/1689

INTERVIEW ANSWERS PROVIDED:
{answers_formatted}

Generate a complete, professional Annex IV document. The document must comply with
Article 11 and Annex IV of the EU AI Act 2024/1689.

Respond ONLY with valid JSON in this exact structure:
{{
  "section_1_general": {{
    "title": "1. General Description of the AI System",
    "intended_purpose": "...",
    "intended_users": "...",
    "affected_persons": "...",
    "geographic_scope": "...",
    "version_info": "..."
  }},
  "section_2_architecture": {{
    "title": "2. Description of System Elements and Development Process",
    "system_type": "...",
    "architecture_description": "...",
    "hardware_requirements": "...",
    "third_party_components": "...",
    "system_integrations": "..."
  }},
  "section_3_data": {{
    "title": "3. Training Data and Data Governance",
    "training_data_description": "...",
    "data_volume": "...",
    "bias_testing_measures": "...",
    "data_quality_measures": "...",
    "personal_data_categories": "..."
  }},
  "section_4_performance": {{
    "title": "4. Performance Metrics and Testing",
    "accuracy_metrics": "...",
    "testing_methodology": "...",
    "known_limitations": "...",
    "performance_monitoring": "..."
  }},
  "section_5_oversight": {{
    "title": "5. Human Oversight Mechanisms",
    "human_review_process": "...",
    "override_authority": "...",
    "stop_mechanism": "...",
    "user_training_requirements": "..."
  }},
  "section_6_logging": {{
    "title": "6. Logging, Monitoring and Change Management",
    "logging_capabilities": "...",
    "log_retention_policy": "...",
    "change_management_process": "..."
  }},
  "section_7_compliance": {{
    "title": "7. Compliance Declaration",
    "regulation_reference": "EU AI Act 2024/1689",
    "annex_iii_reference": "{annex_iii_article or 'N/A'}",
    "compliance_statement": "...",
    "date_of_documentation": "April 2026"
  }}
}}

Write each section in professional legal language suitable for regulatory submission.
Be specific and detailed — vague statements will fail regulatory review.
Do not include any text outside the JSON."""


async def generate_document(
    db: Session,
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    interview_answers: dict,
    user_id: Optional[uuid.UUID] = None,
) -> AnnexIVDocument:
    """
    Generate Annex IV document for a classified AI system.

    Only works for HIGH RISK systems — others don't need Annex IV.
    Creates a new version if document already exists.
    """

    # Load system
    system = get_system_or_404(db, org_id, system_id)

    # Must be classified first
    # Must be classified first
    # Handle both "high" and "RiskTier.HIGH" string representations
    risk_tier_str = str(system.risk_tier).upper()
    if "HIGH" not in risk_tier_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Annex IV documentation is only required for HIGH RISK systems. "
                f"This system is classified as: {system.risk_tier}. "
                f"Classify the system first."
            ),
        )

    # Get latest classification for context
    classification = get_latest_classification(db, system_id)

    # Update system status
    system.status = SystemStatus.DOCUMENTATION_IN_PROGRESS.value
    db.flush()

    # Get next version number
    existing_count = (
        db.query(AnnexIVDocument)
        .filter(AnnexIVDocument.ai_system_id == system_id)
        .count()
    )
    version_number = existing_count + 1

    # Mark previous versions as not current
    if existing_count > 0:
        db.query(AnnexIVDocument).filter(
            AnnexIVDocument.ai_system_id == system_id,
            AnnexIVDocument.is_current_version == True,
        ).update({"is_current_version": False})

    # Generate content via Claude API
    content = await _generate_with_claude(
        system_name=str(system.name),
        system_purpose=str(system.purpose),
        sector=str(system.sector) if system.sector else None,
        risk_tier=str(system.risk_tier),
        annex_iii_article=str(classification.annex_iii_article) if classification and classification.annex_iii_article else None,
        interview_answers=interview_answers,
    )

    # Create document record
    document: Any = AnnexIVDocument(
        ai_system_id=system_id,
        organisation_id=org_id,
        interview_answers=interview_answers,
        content=content,
        status="review",
        version_number=version_number,
        is_current_version=True,
        regulation_version=REGULATION_VERSION,
    )

    db.add(document)
    db.flush()

    # Update system status to classified (doc generated)
    system.status = SystemStatus.CLASSIFIED.value

    # Audit log
    write_audit_log(
        db=db,
        action="document.generated",
        organisation_id=str(org_id),
        user_id=str(user_id) if user_id else None,
        entity_type="document",
        entity_id=str(document.id),
        details={
            "ai_system_id": str(system_id),
            "ai_system_name": str(system.name),
            "version_number": version_number,
            "regulation_version": REGULATION_VERSION,
        },
    )

    db.commit()
    db.refresh(document)
    return document


async def _generate_with_claude(
    system_name: str,
    system_purpose: str,
    sector: Optional[str],
    risk_tier: str,
    annex_iii_article: Optional[str],
    interview_answers: dict,
) -> dict:
    """
    Call Claude API to generate document content.
    Returns structured JSON content for the document.
    Falls back to template if API key not configured.
    """

    if not settings.ANTHROPIC_API_KEY:
        # Return template content if no API key
        return _generate_template_content(
            system_name, system_purpose, interview_answers
        )

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    prompt = build_generation_prompt(
        system_name=system_name,
        system_purpose=system_purpose,
        sector=sector,
        risk_tier=risk_tier,
        annex_iii_article=annex_iii_article,
        interview_answers=interview_answers,
    )

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}],
        )

        # Extract text from response
        from anthropic.types import TextBlock
        response_text = ""
        for block in message.content:
            if isinstance(block, TextBlock):
                response_text = block.text.strip()
                break

        # Clean JSON if wrapped in markdown
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()

        return json.loads(response_text)

    except Exception as e:
        # Fall back to template on any error
        return _generate_template_content(
            system_name, system_purpose, interview_answers
        )


def _generate_template_content(
    system_name: str,
    system_purpose: str,
    interview_answers: dict,
) -> dict:
    """
    Fallback template when Claude API is unavailable.
    Produces a basic but valid document structure.
    """
    return {
        "section_1_general": {
            "title": "1. General Description of the AI System",
            "intended_purpose": interview_answers.get("q1_intended_purpose", system_purpose),
            "intended_users": interview_answers.get("q2_intended_users", "To be completed"),
            "affected_persons": interview_answers.get("q3_affected_persons", "To be completed"),
            "geographic_scope": interview_answers.get("q4_geographic_scope", "To be completed"),
            "version_info": interview_answers.get("q5_version", "1.0.0"),
        },
        "section_2_architecture": {
            "title": "2. Description of System Elements and Development Process",
            "system_type": interview_answers.get("q6_system_type", "To be completed"),
            "architecture_description": "To be completed by technical team",
            "hardware_requirements": interview_answers.get("q7_hardware", "To be completed"),
            "third_party_components": interview_answers.get("q8_third_party", "None"),
            "system_integrations": interview_answers.get("q9_integration", "To be completed"),
        },
        "section_3_data": {
            "title": "3. Training Data and Data Governance",
            "training_data_description": interview_answers.get("q10_training_data", "To be completed"),
            "data_volume": interview_answers.get("q11_data_volume", "To be completed"),
            "bias_testing_measures": interview_answers.get("q12_bias_testing", "To be completed"),
            "data_quality_measures": interview_answers.get("q13_data_quality", "To be completed"),
            "personal_data_categories": interview_answers.get("q14_personal_data", "To be completed"),
        },
        "section_4_performance": {
            "title": "4. Performance Metrics and Testing",
            "accuracy_metrics": interview_answers.get("q15_accuracy", "To be completed"),
            "testing_methodology": interview_answers.get("q16_testing", "To be completed"),
            "known_limitations": interview_answers.get("q17_known_limitations", "To be completed"),
            "performance_monitoring": interview_answers.get("q18_performance_monitoring", "To be completed"),
        },
        "section_5_oversight": {
            "title": "5. Human Oversight Mechanisms",
            "human_review_process": interview_answers.get("q19_human_review", "To be completed"),
            "override_authority": interview_answers.get("q20_override_authority", "To be completed"),
            "stop_mechanism": interview_answers.get("q21_stop_mechanism", "To be completed"),
            "user_training_requirements": interview_answers.get("q22_user_training", "To be completed"),
        },
        "section_6_logging": {
            "title": "6. Logging, Monitoring and Change Management",
            "logging_capabilities": interview_answers.get("q23_logging", "To be completed"),
            "log_retention_policy": interview_answers.get("q24_log_retention", "To be completed"),
            "change_management_process": interview_answers.get("q25_change_process", "To be completed"),
        },
        "section_7_compliance": {
            "title": "7. Compliance Declaration",
            "regulation_reference": "EU AI Act 2024/1689",
            "annex_iii_reference": "To be confirmed",
            "compliance_statement": f"This document serves as the Annex IV Technical Documentation for {system_name} as required under Article 11 of the EU AI Act 2024/1689.",
            "date_of_documentation": "April 2026",
        },
    }


def get_document(
    db: Session,
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    document_id: uuid.UUID,
) -> AnnexIVDocument:
    """Get one document by ID."""
    document = db.query(AnnexIVDocument).filter(
        AnnexIVDocument.id == document_id,
        AnnexIVDocument.ai_system_id == system_id,
        AnnexIVDocument.organisation_id == org_id,
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return document


def get_current_document(
    db: Session,
    org_id: uuid.UUID,
    system_id: uuid.UUID,
) -> AnnexIVDocument:
    """Get the current version document for a system."""
    document = db.query(AnnexIVDocument).filter(
        AnnexIVDocument.ai_system_id == system_id,
        AnnexIVDocument.organisation_id == org_id,
        AnnexIVDocument.is_current_version == True,
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No document found for this system. Generate one first.",
        )
    return document


def update_document_content(
    db: Session,
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    document_id: uuid.UUID,
    content: dict,
    user_id: Optional[uuid.UUID] = None,
) -> AnnexIVDocument:
    """
    Update document content after user edits.
    Tracks the edit in audit log.
    """
    document = get_document(db, org_id, system_id, document_id)

    document.content = content  # type: ignore
    document.status = "review"  # type: ignore

    write_audit_log(
        db=db,
        action="document.updated",
        organisation_id=str(org_id),
        user_id=str(user_id) if user_id else None,
        entity_type="document",
        entity_id=str(document_id),
        details={"ai_system_id": str(system_id)},
    )

    db.commit()
    db.refresh(document)
    return document


def approve_document(
    db: Session,
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    document_id: uuid.UUID,
    user_id: Optional[uuid.UUID] = None,
) -> AnnexIVDocument:
    """
    Approve a document — marks it as final.
    Updates system status to COMPLIANT.
    """
    document = get_document(db, org_id, system_id, document_id)
    system: Any = get_system_or_404(db, org_id, system_id)

    document.status = "approved"  # type: ignore
    system.status = SystemStatus.COMPLIANT.value

    write_audit_log(
        db=db,
        action="document.approved",
        organisation_id=str(org_id),
        user_id=str(user_id) if user_id else None,
        entity_type="document",
        entity_id=str(document_id),
        details={
            "ai_system_id": str(system_id),
            "version_number": document.version_number,
        },
    )

    db.commit()
    db.refresh(document)
    return document


def list_document_versions(
    db: Session,
    org_id: uuid.UUID,
    system_id: uuid.UUID,
) -> list:
    """Get all document versions for a system."""
    return (
        db.query(AnnexIVDocument)
        .filter(
            AnnexIVDocument.ai_system_id == system_id,
            AnnexIVDocument.organisation_id == org_id,
        )
        .order_by(AnnexIVDocument.version_number.desc())
        .all()
    )

def get_interview_questions(sector: Optional[str] = None) -> dict:
    """Return interview questions for the frontend to render."""
    # Pass sector only if it has a value — avoids passing None to str parameter
    return get_questions_for_system(sector=sector if sector else None)