import io
import logging

from django.db import transaction

from apps.audit.services.audit_service import AuditService
from apps.records.models.medical_record import MedicalDocument, MedicalRecord

logger = logging.getLogger(__name__)


class RecordService:
    """Business logic for medical records and documents."""

    # ---------------------------------------------------------------
    # Medical Records CRUD
    # ---------------------------------------------------------------

    @staticmethod
    def create_record(
        user,
        record_type: str,
        title: str,
        description: str = "",
        date_recorded=None,
        provider: str = "",
        status: str = "ACTIVE",
        severity: str = "",
        data: dict = None,
        ip_address: str = None,
        user_agent: str = "",
    ) -> MedicalRecord:
        record = MedicalRecord.objects.create(
            user=user,
            record_type=record_type,
            title=title,
            description=description,
            date_recorded=date_recorded,
            provider=provider,
            status=status,
            severity=severity,
            data=data or {},
            created_by=user,
        )

        AuditService.log_action(
            user_id=str(user.id),
            action="CREATE",
            resource_type="MedicalRecord",
            resource_id=str(record.id),
            ip_address=ip_address,
            user_agent=user_agent,
            changes={"record_type": record_type, "title": title},
        )

        return record

    @staticmethod
    def update_record(
        record: MedicalRecord,
        user,
        updates: dict,
        ip_address: str = None,
        user_agent: str = "",
    ) -> MedicalRecord:
        allowed_fields = [
            "title", "description", "record_type", "date_recorded",
            "provider", "status", "severity", "data",
        ]
        changed = {}
        for field in allowed_fields:
            if field in updates:
                setattr(record, field, updates[field])
                changed[field] = str(updates[field])

        record.updated_by = user
        record.save()

        AuditService.log_action(
            user_id=str(user.id),
            action="UPDATE",
            resource_type="MedicalRecord",
            resource_id=str(record.id),
            ip_address=ip_address,
            user_agent=user_agent,
            changes=changed,
        )

        return record

    @staticmethod
    def soft_delete_record(
        record: MedicalRecord,
        user,
        ip_address: str = None,
        user_agent: str = "",
    ) -> None:
        record.is_deleted = True
        record.save(update_fields=["is_deleted", "updated_at"])

        AuditService.log_action(
            user_id=str(user.id),
            action="DELETE",
            resource_type="MedicalRecord",
            resource_id=str(record.id),
            ip_address=ip_address,
            user_agent=user_agent,
        )

    @staticmethod
    def get_user_records(user, record_type: str = None):
        qs = MedicalRecord.objects.filter(user=user, is_deleted=False)
        if record_type:
            qs = qs.filter(record_type=record_type)
        return qs.order_by("-date_recorded", "-created_at")

    @staticmethod
    def get_record_detail(record_id: str, user):
        return (
            MedicalRecord.objects.filter(
                id=record_id, user=user, is_deleted=False,
            )
            .prefetch_related("documents")
            .first()
        )

    # ---------------------------------------------------------------
    # Document Upload + PDF Extraction
    # ---------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def upload_document(
        user,
        file,
        document_type: str = "OTHER",
        record=None,
        ip_address: str = None,
        user_agent: str = "",
    ) -> MedicalDocument:
        extracted_text = ""
        if file.name.lower().endswith(".pdf"):
            extracted_text = RecordService._extract_pdf_text(file)

        doc = MedicalDocument.objects.create(
            user=user,
            record=record,
            file=file,
            original_filename=file.name,
            document_type=document_type,
            extracted_text=extracted_text,
            file_size=file.size,
            created_by=user,
        )

        AuditService.log_action(
            user_id=str(user.id),
            action="CREATE",
            resource_type="MedicalDocument",
            resource_id=str(doc.id),
            ip_address=ip_address,
            user_agent=user_agent,
            changes={
                "filename": file.name,
                "document_type": document_type,
                "extracted_length": len(extracted_text),
            },
        )

        return doc

    @staticmethod
    def _extract_pdf_text(file) -> str:
        """Extract text from a PDF file using PyPDF2."""
        try:
            from PyPDF2 import PdfReader

            file.seek(0)
            reader = PdfReader(io.BytesIO(file.read()))
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text.strip())
            file.seek(0)
            return "\n\n".join(text_parts)[:50000]  # Cap at 50k chars
        except Exception as e:
            logger.warning("PDF extraction failed: %s", e)
            return ""

    @staticmethod
    def get_user_documents(user):
        return MedicalDocument.objects.filter(
            user=user, is_deleted=False,
        ).select_related("record").order_by("-created_at")

    # ---------------------------------------------------------------
    # AI Context Assembly
    # ---------------------------------------------------------------

    @staticmethod
    def get_patient_medical_context(user) -> str:
        """
        Assemble a text summary of the patient's medical records
        for injection into the AI triage prompt.
        """
        records = MedicalRecord.objects.filter(
            user=user, is_deleted=False,
        ).order_by("record_type", "-date_recorded")

        if not records.exists():
            return ""

        sections = []
        current_type = None

        for r in records:
            if r.record_type != current_type:
                current_type = r.record_type
                sections.append(f"\n## {r.get_record_type_display()}")

            line = f"- {r.title}"
            if r.status:
                line += f" (Status: {r.status})"
            if r.severity:
                line += f" [Severity: {r.severity}]"
            if r.date_recorded:
                line += f" — {r.date_recorded}"
            sections.append(line)

            if r.description:
                sections.append(f"  Details: {r.description[:500]}")

            if r.data:
                for key, val in r.data.items():
                    sections.append(f"  {key}: {val}")

        # Include extracted text from documents (truncated)
        documents = MedicalDocument.objects.filter(
            user=user, is_deleted=False,
        ).exclude(extracted_text="")[:5]

        if documents.exists():
            sections.append("\n## Uploaded Medical Documents")
            for doc in documents:
                sections.append(f"\n### {doc.original_filename} ({doc.get_document_type_display()})")
                sections.append(doc.extracted_text[:2000])

        context = "\n".join(sections)
        return context[:10000]  # Cap total context
