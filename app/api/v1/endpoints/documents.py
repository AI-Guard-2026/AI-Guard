# app/api/v1/endpoints/documents.py
# Annex IV document generation and management endpoints

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from fastapi.responses import Response
from app.services import pdf_service

from app.db.session import get_db
from app.schemas.document import (
    DocumentGenerateRequest,
    DocumentResponse,
    DocumentUpdateRequest,
    DocumentListResponse,
)
from app.services import document_service

router = APIRouter()


@router.get("/documents/interview-questions")
def get_interview_questions(
    sector: Optional[str] = Query(default=None),
):
    """
    Get the interview questions for Annex IV generation.
    Frontend renders these as a guided questionnaire.
    Pass sector param to get sector-specific questions.
    e.g. ?sector=fintech or ?sector=healthcare
    """
    return document_service.get_interview_questions(sector)


@router.post(
    "/{system_id}/documents/generate",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def generate_document(
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    payload: DocumentGenerateRequest,
    db: Session = Depends(get_db),
):
    """
    Generate Annex IV technical documentation for a HIGH RISK AI system.

    Requires:
    - System must be classified as HIGH RISK first
    - interview_answers must contain responses to the questionnaire

    Returns the generated document with full structured content.
    Claude API generates professional legal language from your answers.
    """
    document = await document_service.generate_document(
        db=db,
        org_id=org_id,
        system_id=system_id,
        interview_answers=payload.interview_answers,
    )
    return document


@router.get(
    "/{system_id}/documents",
    response_model=DocumentListResponse,
)
def list_documents(
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    List all document versions for an AI system.
    Most recent version is always first.
    """
    items = document_service.list_document_versions(db, org_id, system_id)
    return DocumentListResponse(items=items, total=len(items))


@router.get(
    "/{system_id}/documents/current",
    response_model=DocumentResponse,
)
def get_current_document(
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Get the current (latest approved) document version."""
    return document_service.get_current_document(db, org_id, system_id)


@router.get(
    "/{system_id}/documents/{document_id}",
    response_model=DocumentResponse,
)
def get_document(
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Get one specific document version by ID."""
    return document_service.get_document(db, org_id, system_id, document_id)


@router.patch(
    "/{system_id}/documents/{document_id}",
    response_model=DocumentResponse,
)
def update_document(
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    document_id: uuid.UUID,
    payload: DocumentUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Update document content after user review and edits.
    Called when compliance officer modifies generated text.
    """
    return document_service.update_document_content(
        db=db,
        org_id=org_id,
        system_id=system_id,
        document_id=document_id,
        content=payload.content,
    )


@router.post(
    "/{system_id}/documents/{document_id}/approve",
    response_model=DocumentResponse,
)
def approve_document(
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Approve a document as final.
    Sets system status to COMPLIANT.
    Marks this as the approved version for regulatory submission.
    """
    return document_service.approve_document(
        db=db,
        org_id=org_id,
        system_id=system_id,
        document_id=document_id,
    )


@router.get(
    "/{system_id}/documents/{document_id}/export-pdf",
    response_class=Response,
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "Annex IV document as downloadable PDF",
        }
    },
)
def export_pdf(
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Export Annex IV document as a professional PDF.

    Returns a downloadable PDF file.
    Filename format: AIGuard_AnnexIV_{SystemName}_v{version}.pdf

    The PDF includes:
    - Professional cover page with system details
    - All 7 Annex IV sections
    - Compliance declaration
    - Signature block for regulatory submission
    """
    return pdf_service.export_document_as_pdf(
        db=db,
        org_id=org_id,
        system_id=system_id,
        document_id=document_id,
    )