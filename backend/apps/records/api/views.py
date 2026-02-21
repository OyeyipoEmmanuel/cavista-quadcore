from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.records.api.serializers import (
    CreateRecordSerializer,
    MedicalDocumentSerializer,
    MedicalRecordSerializer,
    UpdateRecordSerializer,
    UploadDocumentSerializer,
)
from apps.records.models.medical_record import MedicalRecord
from apps.records.services.record_service import RecordService


class MedicalRecordListCreateView(generics.ListCreateAPIView):
    """
    GET  — list the patient's medical records.
    POST — create a new record.
    """

    serializer_class = MedicalRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        record_type = self.request.query_params.get("type")
        return RecordService.get_user_records(self.request.user, record_type)

    def create(self, request, *args, **kwargs):
        serializer = CreateRecordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        record = RecordService.create_record(
            user=request.user,
            record_type=data["record_type"],
            title=data["title"],
            description=data["description"],
            date_recorded=data.get("date_recorded"),
            provider=data.get("provider", ""),
            status=data.get("status", "ACTIVE"),
            severity=data.get("severity", ""),
            data=data.get("data", {}),
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        return Response(
            MedicalRecordSerializer(record).data,
            status=status.HTTP_201_CREATED,
        )


class MedicalRecordDetailView(APIView):
    """
    GET    — retrieve a single record.
    PATCH  — update a record.
    DELETE — soft-delete a record.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, record_id):
        record = RecordService.get_record_detail(str(record_id), request.user)
        if not record:
            return Response({"error": "Record not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(MedicalRecordSerializer(record).data)

    def patch(self, request, record_id):
        record = RecordService.get_record_detail(str(record_id), request.user)
        if not record:
            return Response({"error": "Record not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateRecordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = RecordService.update_record(
            record=record,
            user=request.user,
            updates=serializer.validated_data,
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )
        return Response(MedicalRecordSerializer(updated).data)

    def delete(self, request, record_id):
        record = RecordService.get_record_detail(str(record_id), request.user)
        if not record:
            return Response({"error": "Record not found."}, status=status.HTTP_404_NOT_FOUND)

        RecordService.soft_delete_record(
            record=record,
            user=request.user,
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class MedicalDocumentUploadView(APIView):
    """POST — upload a medical document (PDF)."""

    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response(
                {"error": "File is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if file.size > 20 * 1024 * 1024:
            return Response(
                {"error": "File must be smaller than 20MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = UploadDocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        record = None
        if data.get("record_id"):
            record = MedicalRecord.objects.filter(
                id=data["record_id"], user=request.user, is_deleted=False,
            ).first()

        doc = RecordService.upload_document(
            user=request.user,
            file=file,
            document_type=data.get("document_type", "OTHER"),
            record=record,
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        return Response(
            MedicalDocumentSerializer(doc).data,
            status=status.HTTP_201_CREATED,
        )


class MedicalDocumentListView(generics.ListAPIView):
    """GET — list patient's uploaded documents."""

    serializer_class = MedicalDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RecordService.get_user_documents(self.request.user)


class MedicalContextView(APIView):
    """GET — return assembled medical context for AI prompt."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        context = RecordService.get_patient_medical_context(request.user)
        return Response({"context": context})
