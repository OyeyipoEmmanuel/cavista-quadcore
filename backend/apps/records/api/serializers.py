from rest_framework import serializers

from apps.records.models.medical_record import MedicalDocument, MedicalRecord


class MedicalRecordSerializer(serializers.ModelSerializer):
    documents = serializers.SerializerMethodField()

    class Meta:
        model = MedicalRecord
        fields = [
            "id",
            "record_type",
            "title",
            "description",
            "date_recorded",
            "provider",
            "status",
            "severity",
            "data",
            "documents",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "documents", "created_at", "updated_at"]

    def get_documents(self, obj):
        docs = getattr(obj, "documents", None)
        if docs is None:
            return []
        return MedicalDocumentSerializer(docs.filter(is_deleted=False), many=True).data


class CreateRecordSerializer(serializers.Serializer):
    record_type = serializers.ChoiceField(choices=MedicalRecord.RecordType.choices)
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    date_recorded = serializers.DateField(required=False, allow_null=True, default=None)
    provider = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    status = serializers.ChoiceField(
        choices=MedicalRecord.Status.choices,
        required=False,
        default="ACTIVE",
    )
    severity = serializers.ChoiceField(
        choices=MedicalRecord.Severity.choices,
        required=False,
        allow_blank=True,
        default="",
    )
    data = serializers.JSONField(required=False, default=dict)


class UpdateRecordSerializer(serializers.Serializer):
    record_type = serializers.ChoiceField(choices=MedicalRecord.RecordType.choices, required=False)
    title = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    date_recorded = serializers.DateField(required=False, allow_null=True)
    provider = serializers.CharField(max_length=255, required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=MedicalRecord.Status.choices, required=False)
    severity = serializers.ChoiceField(
        choices=MedicalRecord.Severity.choices,
        required=False,
        allow_blank=True,
    )
    data = serializers.JSONField(required=False)


class MedicalDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalDocument
        fields = [
            "id",
            "document_type",
            "original_filename",
            "file_size",
            "extracted_text",
            "created_at",
        ]
        read_only_fields = fields


class UploadDocumentSerializer(serializers.Serializer):
    document_type = serializers.ChoiceField(
        choices=MedicalDocument.DocumentType.choices,
        required=False,
        default="OTHER",
    )
    record_id = serializers.UUIDField(required=False, allow_null=True, default=None)
