# app/services/pdf_service.py
# Generates professional PDF from Annex IV document content
# Uses ReportLab — works on Mac M3 without system dependencies

import uuid
from datetime import datetime
from typing import Optional, Any
from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    HRFlowable,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from fastapi.responses import Response

from app.models.document import AnnexIVDocument
from app.models.ai_system import AISystem
from app.models.organisation import Organisation
from app.services.audit_service import write_audit_log


# ── Colour palette ──────────────────────────────────────────
BLUE        = colors.HexColor("#1a56db")
DARK        = colors.HexColor("#111827")
GREY        = colors.HexColor("#6b7280")
LIGHT_BLUE  = colors.HexColor("#eff6ff")
RED         = colors.HexColor("#e02424")
GREEN       = colors.HexColor("#16a34a")
LIGHT_GREEN = colors.HexColor("#f0fdf4")
ORANGE_BG   = colors.HexColor("#fff7ed")
ORANGE      = colors.HexColor("#ea580c")
ROW_ALT     = colors.HexColor("#f9fafb")
WHITE       = colors.white


def _build_styles() -> dict:
    """Build all paragraph styles used in the document."""
    base = getSampleStyleSheet()

    styles = {
        "cover_logo": ParagraphStyle(
            "cover_logo",
            fontSize=32,
            fontName="Helvetica-Bold",
            textColor=BLUE,
            alignment=TA_CENTER,
            spaceAfter=4,
        ),
        "cover_title": ParagraphStyle(
            "cover_title",
            fontSize=20,
            fontName="Helvetica-Bold",
            textColor=DARK,
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "cover_subtitle": ParagraphStyle(
            "cover_subtitle",
            fontSize=11,
            fontName="Helvetica",
            textColor=GREY,
            alignment=TA_CENTER,
            spaceAfter=20,
        ),
        "h1": ParagraphStyle(
            "h1",
            fontSize=14,
            fontName="Helvetica-Bold",
            textColor=BLUE,
            spaceBefore=16,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2",
            fontSize=11,
            fontName="Helvetica-Bold",
            textColor=DARK,
            spaceBefore=10,
            spaceAfter=4,
            leftIndent=8,
        ),
        "body": ParagraphStyle(
            "body",
            fontSize=9,
            fontName="Helvetica",
            textColor=DARK,
            alignment=TA_JUSTIFY,
            spaceAfter=6,
            leading=14,
        ),
        "info_box": ParagraphStyle(
            "info_box",
            fontSize=9,
            fontName="Helvetica",
            textColor=colors.HexColor("#1e40af"),
            spaceAfter=4,
            leading=13,
        ),
        "warning_box": ParagraphStyle(
            "warning_box",
            fontSize=9,
            fontName="Helvetica",
            textColor=colors.HexColor("#9a3412"),
            spaceAfter=4,
            leading=13,
        ),
        "small": ParagraphStyle(
            "small",
            fontSize=7,
            fontName="Helvetica",
            textColor=GREY,
            alignment=TA_CENTER,
            spaceAfter=4,
        ),
        "compliance": ParagraphStyle(
            "compliance",
            fontSize=9,
            fontName="Helvetica",
            textColor=colors.HexColor("#166534"),
            alignment=TA_CENTER,
            spaceAfter=4,
        ),
    }
    return styles


def _info_box(text: str, styles: dict) -> Table:
    """Blue info box."""
    p = Paragraph(f"<b>ℹ</b> {text}", styles["info_box"])
    t = Table([[p]], colWidths=[16 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BLUE),
        ("LEFTPADDING",  (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING",   (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 8),
        ("LINEBEFORE",   (0, 0), (0, -1), 4, BLUE),
        ("ROUNDEDCORNERS", [4]),
    ]))
    return t


def _warning_box(text: str, styles: dict) -> Table:
    """Orange warning box."""
    p = Paragraph(f"⚠ {text}", styles["warning_box"])
    t = Table([[p]], colWidths=[16 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ORANGE_BG),
        ("LEFTPADDING",  (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING",   (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 8),
        ("LINEBEFORE",   (0, 0), (0, -1), 4, ORANGE),
    ]))
    return t


def _meta_table(rows: list, styles: dict) -> Table:
    """Two-column metadata table."""
    data = [[Paragraph(f"<b>{k}</b>", styles["body"]),
             Paragraph(str(v), styles["body"])]
            for k, v in rows]

    t = Table(data, colWidths=[5 * cm, 11 * cm])
    ts = TableStyle([
        ("GRID",        (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
        ("TOPPADDING",  (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0),(-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",(0, 0), (-1, -1), 8),
    ])
    # Alternating row background
    for i in range(len(data)):
        if i % 2 == 0:
            ts.add("BACKGROUND", (0, i), (-1, i), ROW_ALT)

    t.setStyle(ts)
    return t


def _section_header(title: str, styles: dict) -> list:
    """Returns [HRFlowable, Paragraph] for a section header."""
    return [
        HRFlowable(width="100%", thickness=2, color=BLUE, spaceAfter=4),
        Paragraph(title, styles["h1"]),
    ]


def _cover_page(
    system_name: str,
    organisation_name: str,
    risk_tier: str,
    annex_iii_article: Optional[str],
    version_number: int,
    document_status: str,
    generated_date: str,
    regulation_version: str,
    document_id: str,
    styles: dict,
) -> list:
    """Build the cover page elements."""
    elements = []

    elements.append(Spacer(1, 2 * cm))
    elements.append(Paragraph("AIGuard", styles["cover_logo"]))
    elements.append(Paragraph(
        "EU AI Act Compliance Platform",
        ParagraphStyle("tag", fontSize=9, textColor=GREY, alignment=TA_CENTER),
    ))
    elements.append(Spacer(1, 1.5 * cm))
    elements.append(Paragraph("Annex IV Technical Documentation", styles["cover_title"]))
    elements.append(Paragraph(
        "As required under Article 11 of the EU AI Act 2024/1689",
        styles["cover_subtitle"],
    ))
    elements.append(Spacer(1, 0.5 * cm))

    # System details box
    box_data = [
        ["System Name", system_name],
        ["Organisation", organisation_name],
        ["Risk Classification", f"{risk_tier} RISK"],
        ["Annex III Reference", annex_iii_article or "N/A"],
        ["Document Version", f"v{version_number}"],
        ["Status", document_status.upper()],
        ["Generated", generated_date],
        ["Regulation", regulation_version],
    ]

    cover_style = ParagraphStyle(
        "cover_cell", fontSize=9, fontName="Helvetica", textColor=DARK
    )
    cover_bold = ParagraphStyle(
        "cover_bold", fontSize=9, fontName="Helvetica-Bold", textColor=GREY
    )

    data = [[Paragraph(k, cover_bold), Paragraph(v, cover_style)]
            for k, v in box_data]

    t = Table(data, colWidths=[4.5 * cm, 10 * cm])
    t.setStyle(TableStyle([
        ("BOX",         (0, 0), (-1, -1), 2, BLUE),
        ("GRID",        (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
        ("TOPPADDING",  (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",(0,0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",(0, 0), (-1, -1), 10),
        ("BACKGROUND",  (0, 0), (0, -1), colors.HexColor("#f8faff")),
    ]))

    elements.append(t)
    elements.append(Spacer(1, 1 * cm))
    elements.append(Paragraph(
        f"Document ID: {document_id}",
        styles["small"],
    ))
    elements.append(PageBreak())
    return elements


def generate_pdf_bytes(
    document: Any,
    system: Any,
    organisation: Any,
) -> bytes:
    """
    Generate PDF bytes from document content using ReportLab.
    Returns PDF as bytes ready for HTTP response.
    """
    buffer = BytesIO()
    styles = _build_styles()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2.5 * cm,
        bottomMargin=2.5 * cm,
        title=f"Annex IV — {system.name}",
        author="AIGuard Compliance Platform",
    )

    content = document.content or {}
    generated_date = datetime.now().strftime("%d %B %Y")
    risk_tier = str(system.risk_tier).replace("RiskTier.", "").upper()

    elements = []

    # ── Cover page ────────────────────────────────────────────
    elements += _cover_page(
        system_name=str(system.name),
        organisation_name=str(organisation.name),
        risk_tier=risk_tier,
        annex_iii_article=str(system.annex_iii_article) if system.annex_iii_article else None,
        version_number=document.version_number,
        document_status=str(document.status),
        generated_date=generated_date,
        regulation_version=str(document.regulation_version) if document.regulation_version else "EU AI Act 2024/1689",
        document_id=str(document.id),
        styles=styles,
    )

    # ── Regulatory notice ─────────────────────────────────────
    elements.append(_info_box(
        "Regulatory Notice: This document constitutes the Annex IV Technical "
        "Documentation required under Article 11 of Regulation (EU) 2024/1689 "
        "(EU AI Act) for high-risk AI systems. This documentation must be "
        "maintained and updated throughout the AI system's lifecycle.",
        styles,
    ))
    elements.append(Spacer(1, 0.4 * cm))

    # ── Document metadata table ───────────────────────────────
    elements += _section_header("Document Information", styles)
    elements.append(_meta_table([
        ("Document Title",    f"Annex IV Technical Documentation — {system.name}"),
        ("Organisation",      str(organisation.name)),
        ("Document ID",       str(document.id)),
        ("Version",           f"v{document.version_number}"),
        ("Status",            str(document.status).upper()),
        ("Date Generated",    generated_date),
        ("Regulation",        str(document.regulation_version) if document.regulation_version else "EU AI Act 2024/1689"),
        ("Annex III Ref",     str(system.annex_iii_article) if system.annex_iii_article else "N/A"),
    ], styles))

    # ── Helper to add a content section ───────────────────────
    def add_section(elems: list, section_key: str, fields: list) -> None:
        """Add one content section to elems list."""
        section = content.get(section_key, {})
        if not section:
            return

        elems.append(PageBreak())
        elems += _section_header(
            section.get("title", section_key.replace("_", " ").title()),
            styles,
        )

        for subtitle, key in fields:
            value = section.get(key, "")
            if not value:
                continue
            elems.append(Paragraph(subtitle, styles["h2"]))
            elems.append(Paragraph(str(value), styles["body"]))
            elems.append(Spacer(1, 0.2 * cm))

    # ── Section 1 — General ───────────────────────────────────
    # Section 1
    add_section(elements, "section_1_general", [
        ("Intended Purpose",    "intended_purpose"),
        ("Intended Users",      "intended_users"),
        ("Affected Persons",    "affected_persons"),
        ("Geographic Scope",    "geographic_scope"),
        ("Version Information", "version_info"),
    ])

    # Section 2
    add_section(elements, "section_2_architecture", [
        ("System Type and Approach",  "system_type"),
        ("Architecture Description",  "architecture_description"),
        ("Hardware Requirements",     "hardware_requirements"),
        ("Third-Party Components",    "third_party_components"),
        ("System Integrations",       "system_integrations"),
    ])

    # Section 3
    add_section(elements, "section_3_data", [
        ("Training Data Description", "training_data_description"),
        ("Data Volume",               "data_volume"),
        ("Bias Testing Measures",     "bias_testing_measures"),
        ("Data Quality Measures",     "data_quality_measures"),
        ("Personal Data Categories",  "personal_data_categories"),
    ])

    # ── Section 4 — Performance ───────────────────────────────
    section4 = content.get("section_4_performance", {})
    if section4:
        elements.append(PageBreak())
        elements += _section_header(
            section4.get("title", "4. Performance Metrics and Testing"),
            styles,
        )
        for subtitle, key in [
            ("Accuracy Metrics",      "accuracy_metrics"),
            ("Testing Methodology",   "testing_methodology"),
            ("Performance Monitoring","performance_monitoring"),
        ]:
            val = section4.get(key, "")
            if val:
                elements.append(Paragraph(subtitle, styles["h2"]))
                elements.append(Paragraph(str(val), styles["body"]))

        # Known limitations in warning box
        limitations = section4.get("known_limitations", "")
        if limitations:
            elements.append(Paragraph("Known Limitations", styles["h2"]))
            elements.append(_warning_box(str(limitations), styles))

    # ── Section 5 — Oversight ─────────────────────────────────
    # Section 5
    add_section(elements, "section_5_oversight", [
        ("Human Review Process",      "human_review_process"),
        ("Override Authority",        "override_authority"),
        ("Stop Mechanism",            "stop_mechanism"),
        ("User Training Requirements","user_training_requirements"),
    ])

    # ── Section 6 — Logging ───────────────────────────────────
    # Section 6
    add_section(elements, "section_6_logging", [
        ("Logging Capabilities",     "logging_capabilities"),
        ("Log Retention Policy",     "log_retention_policy"),
        ("Change Management Process","change_management_process"),
    ])

    # ── Section 7 — Compliance Declaration ───────────────────
    section7 = content.get("section_7_compliance", {})
    if section7:
        elements.append(PageBreak())
        elements += _section_header(
            section7.get("title", "7. Compliance Declaration"),
            styles,
        )

        # Compliance statement box
        stmt = section7.get("compliance_statement", "")
        if stmt:
            comp_table = Table(
                [[Paragraph(f"✓  Compliance Declaration\n\n{stmt}", styles["compliance"])]],
                colWidths=[16 * cm],
            )
            comp_table.setStyle(TableStyle([
                ("BACKGROUND",   (0, 0), (-1, -1), LIGHT_GREEN),
                ("BOX",          (0, 0), (-1, -1), 2, GREEN),
                ("TOPPADDING",   (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING",(0, 0), (-1, -1), 12),
                ("LEFTPADDING",  (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("ROUNDEDCORNERS", [6]),
            ]))
            elements.append(comp_table)
            elements.append(Spacer(1, 0.5 * cm))

        elements.append(_meta_table([
            ("Regulation Reference", section7.get("regulation_reference", "EU AI Act 2024/1689")),
            ("Annex III Reference",  section7.get("annex_iii_reference", "N/A")),
            ("Date of Documentation",section7.get("date_of_documentation", generated_date)),
        ], styles))

        # Signature block
        elements.append(Spacer(1, 1.5 * cm))
        sig_data = [[
            Paragraph("_______________________\nCompliance Officer", styles["small"]),
            Paragraph("_______________________\nDate", styles["small"]),
            Paragraph("_______________________\nDocument Reference", styles["small"]),
        ]]
        sig_table = Table(sig_data, colWidths=[5.5 * cm, 5.5 * cm, 5.5 * cm])
        sig_table.setStyle(TableStyle([
            ("ALIGN",    (0, 0), (-1, -1), "CENTER"),
            ("TOPPADDING",(0, 0),(-1, -1), 20),
        ]))
        elements.append(sig_table)

        elements.append(Spacer(1, 1 * cm))
        elements.append(Paragraph(
            f"Generated by AIGuard EU AI Act Compliance Platform | "
            f"Document ID: {document.id} | {generated_date}",
            styles["small"],
        ))

    # ── Build PDF ─────────────────────────────────────────────
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def export_document_as_pdf(
    db: Session,
    org_id: uuid.UUID,
    system_id: uuid.UUID,
    document_id: uuid.UUID,
    user_id: Optional[uuid.UUID] = None,
) -> Response:
    """
    Export an Annex IV document as a downloadable PDF.
    Loads document, system, and organisation.
    Generates PDF and returns as HTTP download response.
    """

    # Load document
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

    # Load AI system
    system = db.query(AISystem).filter(
        AISystem.id == system_id,
        AISystem.organisation_id == org_id,
    ).first()

    if not system:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI system not found",
        )

    # Load organisation
    organisation = db.query(Organisation).filter(
        Organisation.id == org_id,
    ).first()

    if not organisation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found",
        )

    # Check document has content
    if document.content is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document has no content. Generate the document first.",
        )

    # Generate PDF
    pdf_bytes = generate_pdf_bytes(
        document=document,
        system=system,
        organisation=organisation,
    )

    # Safe filename
    system_name_safe = str(system.name).replace(" ", "_").replace("/", "-")
    filename = f"AIGuard_AnnexIV_{system_name_safe}_v{document.version_number}.pdf"

    # Audit log
    write_audit_log(
        db=db,
        action="document.pdf_exported",
        organisation_id=str(org_id),
        user_id=str(user_id) if user_id else None,
        entity_type="document",
        entity_id=str(document_id),
        details={
            "ai_system_id": str(system_id),
            "ai_system_name": str(system.name),
            "version_number": document.version_number,
            "filename": filename,
        },
    )

    db.commit()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )