import logging

from apps.audit.services.audit_service import AuditService
from apps.records.services.record_service import RecordService
from apps.xai.models.prescription import FirstAidPrescription

logger = logging.getLogger(__name__)


class PrescriptionService:
    """
    Generates first-aid OTC drug recommendations based on symptoms,
    patient medical records, and known contraindications.

    ALL recommendations are temporary symptom relief only.
    """

    # ------------------------------------------------------------------ #
    # OTC drug knowledge base — safe, common, non-prescription drugs     #
    # ------------------------------------------------------------------ #

    OTC_DRUGS = {
        "pain": [
            {
                "name": "Paracetamol (Acetaminophen)",
                "dosage": "500mg–1000mg every 4–6 hours",
                "max_daily": "4000mg (4g) per day",
                "purpose": "Pain relief and fever reduction",
                "warnings": ["Do not exceed recommended dose", "Avoid with liver disease"],
                "contraindicated_allergies": ["acetaminophen", "paracetamol"],
                "contraindicated_conditions": ["liver disease", "hepatitis", "liver failure"],
            },
            {
                "name": "Ibuprofen",
                "dosage": "200mg–400mg every 4–6 hours",
                "max_daily": "1200mg per day (OTC dose)",
                "purpose": "Pain, inflammation, and fever relief",
                "warnings": ["Take with food", "Avoid if pregnant", "Not for stomach ulcers"],
                "contraindicated_allergies": ["ibuprofen", "nsaid", "aspirin"],
                "contraindicated_conditions": ["stomach ulcer", "kidney disease", "asthma"],
            },
        ],
        "fever": [
            {
                "name": "Paracetamol (Acetaminophen)",
                "dosage": "500mg–1000mg every 4–6 hours",
                "max_daily": "4000mg (4g) per day",
                "purpose": "Fever reduction",
                "warnings": ["Stay hydrated", "Do not exceed dose"],
                "contraindicated_allergies": ["acetaminophen", "paracetamol"],
                "contraindicated_conditions": ["liver disease"],
            },
        ],
        "headache": [
            {
                "name": "Paracetamol (Acetaminophen)",
                "dosage": "500mg–1000mg",
                "max_daily": "4000mg per day",
                "purpose": "Headache relief",
                "warnings": ["Avoid alcohol"],
                "contraindicated_allergies": ["acetaminophen", "paracetamol"],
                "contraindicated_conditions": ["liver disease"],
            },
            {
                "name": "Aspirin",
                "dosage": "300mg–600mg every 4–6 hours",
                "max_daily": "4000mg per day",
                "purpose": "Pain and headache relief",
                "warnings": ["Not for under 16", "Take with food", "Avoid if asthmatic"],
                "contraindicated_allergies": ["aspirin", "nsaid"],
                "contraindicated_conditions": ["stomach ulcer", "asthma", "bleeding disorder"],
            },
        ],
        "cough": [
            {
                "name": "Dextromethorphan (DM) Cough Syrup",
                "dosage": "10–20mg every 4–6 hours",
                "max_daily": "120mg per day",
                "purpose": "Dry cough suppression",
                "warnings": ["Drowsiness possible", "Do not combine with other cough meds"],
                "contraindicated_allergies": ["dextromethorphan"],
                "contraindicated_conditions": [],
            },
            {
                "name": "Honey + Warm Water",
                "dosage": "1–2 teaspoons in warm water",
                "max_daily": "As needed",
                "purpose": "Soothe throat and reduce cough",
                "warnings": ["Not for children under 1 year"],
                "contraindicated_allergies": ["honey"],
                "contraindicated_conditions": [],
            },
        ],
        "nausea": [
            {
                "name": "Oral Rehydration Salts (ORS)",
                "dosage": "1 sachet in 1 litre of clean water, sip frequently",
                "max_daily": "As needed to prevent dehydration",
                "purpose": "Prevent dehydration from nausea/vomiting",
                "warnings": ["Do not add sugar or salt beyond the sachet"],
                "contraindicated_allergies": [],
                "contraindicated_conditions": [],
            },
            {
                "name": "Dimenhydrinate",
                "dosage": "50mg every 4–6 hours",
                "max_daily": "300mg per day",
                "purpose": "Anti-nausea and motion sickness",
                "warnings": ["Causes drowsiness", "Do not drive"],
                "contraindicated_allergies": ["dimenhydrinate"],
                "contraindicated_conditions": ["glaucoma"],
            },
        ],
        "diarrhea": [
            {
                "name": "Oral Rehydration Salts (ORS)",
                "dosage": "1 sachet in 1 litre of clean water",
                "max_daily": "As needed",
                "purpose": "Prevent dehydration",
                "warnings": [],
                "contraindicated_allergies": [],
                "contraindicated_conditions": [],
            },
            {
                "name": "Loperamide",
                "dosage": "4mg initially, then 2mg after each loose stool",
                "max_daily": "16mg per day",
                "purpose": "Reduce diarrhea frequency",
                "warnings": ["Not for bloody diarrhea", "Not for children under 12"],
                "contraindicated_allergies": ["loperamide"],
                "contraindicated_conditions": ["bloody stool", "dysentery"],
            },
        ],
        "allergy": [
            {
                "name": "Cetirizine",
                "dosage": "10mg once daily",
                "max_daily": "10mg per day",
                "purpose": "Allergy symptom relief (sneezing, itching, rash)",
                "warnings": ["May cause mild drowsiness"],
                "contraindicated_allergies": ["cetirizine"],
                "contraindicated_conditions": ["severe kidney disease"],
            },
            {
                "name": "Loratadine",
                "dosage": "10mg once daily",
                "max_daily": "10mg per day",
                "purpose": "Non-drowsy allergy relief",
                "warnings": [],
                "contraindicated_allergies": ["loratadine"],
                "contraindicated_conditions": [],
            },
        ],
        "stomach": [
            {
                "name": "Antacid (Aluminium/Magnesium Hydroxide)",
                "dosage": "10–20ml after meals",
                "max_daily": "4 doses per day",
                "purpose": "Relieve heartburn, indigestion, acid reflux",
                "warnings": ["Do not take with other medicines within 2 hours"],
                "contraindicated_allergies": [],
                "contraindicated_conditions": ["kidney disease"],
            },
        ],
        "sore throat": [
            {
                "name": "Throat Lozenges (Benzocaine/Menthol)",
                "dosage": "1 lozenge every 2–3 hours",
                "max_daily": "8 per day",
                "purpose": "Soothe throat pain",
                "warnings": ["Not for children under 6"],
                "contraindicated_allergies": ["benzocaine"],
                "contraindicated_conditions": [],
            },
        ],
        "congestion": [
            {
                "name": "Pseudoephedrine",
                "dosage": "60mg every 4–6 hours",
                "max_daily": "240mg per day",
                "purpose": "Nasal congestion relief",
                "warnings": ["May increase blood pressure", "Not for heart conditions"],
                "contraindicated_allergies": ["pseudoephedrine"],
                "contraindicated_conditions": ["hypertension", "high blood pressure", "heart disease"],
            },
            {
                "name": "Saline Nasal Spray",
                "dosage": "2–3 sprays per nostril as needed",
                "max_daily": "As needed",
                "purpose": "Moisturize and clear nasal passages",
                "warnings": [],
                "contraindicated_allergies": [],
                "contraindicated_conditions": [],
            },
        ],
    }

    SYMPTOM_KEYWORDS = {
        "pain": ["pain", "ache", "hurt", "sore", "cramp", "throbbing"],
        "fever": ["fever", "temperature", "hot", "chills", "sweating"],
        "headache": ["headache", "head pain", "migraine"],
        "cough": ["cough", "coughing"],
        "nausea": ["nausea", "vomit", "throwing up", "sick to stomach", "queasy"],
        "diarrhea": ["diarrhea", "loose stool", "watery stool", "runs"],
        "allergy": ["allergy", "allergic", "hives", "rash", "itching", "itchy", "sneezing"],
        "stomach": ["stomach", "heartburn", "indigestion", "acid", "bloating", "gas"],
        "sore throat": ["sore throat", "throat pain", "scratchy throat"],
        "congestion": ["congestion", "stuffy nose", "blocked nose", "runny nose", "nasal"],
    }

    # ------------------------------------------------------------------ #
    # Public API                                                          #
    # ------------------------------------------------------------------ #

    @staticmethod
    def generate_prescription(
        user,
        symptoms_text: str,
        triage_session=None,
        ip_address: str = None,
        user_agent: str = "",
    ) -> FirstAidPrescription:
        """
        Generate first-aid OTC drug recommendations based on symptoms
        and patient medical history.
        """
        symptoms_lower = symptoms_text.lower()

        # 1. Fetch patient medical context for allergy/contraindication checks
        medical_context = RecordService.get_patient_medical_context(user)
        patient_allergies = PrescriptionService._extract_allergies(user)
        patient_conditions = PrescriptionService._extract_conditions(user)

        # 2. Match symptoms to drug categories
        matched_categories = PrescriptionService._match_symptoms(symptoms_lower)

        # 3. Build drug recommendations, filtering out contraindicated ones
        drugs = []
        warnings = []
        seen_drugs = set()

        for category in matched_categories:
            category_drugs = PrescriptionService.OTC_DRUGS.get(category, [])
            for drug in category_drugs:
                if drug["name"] in seen_drugs:
                    continue

                # Check allergies
                is_contraindicated = False
                for allergy in patient_allergies:
                    for contra in drug.get("contraindicated_allergies", []):
                        if contra.lower() in allergy.lower() or allergy.lower() in contra.lower():
                            warnings.append(
                                f"⚠️ {drug['name']} was EXCLUDED because you have "
                                f"a recorded allergy to {allergy}."
                            )
                            is_contraindicated = True
                            break
                    if is_contraindicated:
                        break

                # Check conditions
                if not is_contraindicated:
                    for condition in patient_conditions:
                        for contra in drug.get("contraindicated_conditions", []):
                            if contra.lower() in condition.lower() or condition.lower() in contra.lower():
                                warnings.append(
                                    f"⚠️ {drug['name']} was EXCLUDED due to your "
                                    f"existing condition: {condition}."
                                )
                                is_contraindicated = True
                                break
                        if is_contraindicated:
                            break

                if not is_contraindicated:
                    drugs.append({
                        "name": drug["name"],
                        "dosage": drug["dosage"],
                        "max_daily": drug["max_daily"],
                        "purpose": drug["purpose"],
                        "warnings": drug["warnings"],
                        "category": category,
                    })
                    seen_drugs.add(drug["name"])

        # 4. Determine urgency
        urgency = PrescriptionService._assess_urgency(symptoms_lower, matched_categories)

        # 5. Persist
        prescription = FirstAidPrescription.objects.create(
            user=user,
            triage_session=triage_session,
            symptoms_text=symptoms_text,
            urgency=urgency,
            drugs=drugs,
            warnings=warnings,
            medical_context_used=bool(medical_context),
            created_by=user,
        )

        AuditService.log_action(
            user_id=str(user.id),
            action="CREATE",
            resource_type="FirstAidPrescription",
            resource_id=str(prescription.id),
            ip_address=ip_address,
            user_agent=user_agent,
            changes={
                "drugs_count": len(drugs),
                "warnings_count": len(warnings),
                "urgency": urgency,
                "categories_matched": matched_categories,
            },
        )

        return prescription

    @staticmethod
    def get_user_prescriptions(user, limit: int = 10):
        return FirstAidPrescription.objects.filter(
            user=user, is_deleted=False,
        ).order_by("-created_at")[:limit]

    # ------------------------------------------------------------------ #
    # Helpers                                                              #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _match_symptoms(symptoms_lower: str) -> list[str]:
        matched = []
        for category, keywords in PrescriptionService.SYMPTOM_KEYWORDS.items():
            for keyword in keywords:
                if keyword in symptoms_lower:
                    matched.append(category)
                    break
        # Always include "pain" if nothing matched but user described discomfort
        if not matched:
            matched = ["pain"]
        return matched

    @staticmethod
    def _extract_allergies(user) -> list[str]:
        from apps.records.models.medical_record import MedicalRecord
        records = MedicalRecord.objects.filter(
            user=user, record_type="ALLERGY", is_deleted=False,
        ).values_list("title", flat=True)
        return list(records)

    @staticmethod
    def _extract_conditions(user) -> list[str]:
        from apps.records.models.medical_record import MedicalRecord
        records = MedicalRecord.objects.filter(
            user=user,
            record_type="CONDITION",
            status__in=["ACTIVE", "CHRONIC"],
            is_deleted=False,
        ).values_list("title", flat=True)
        return list(records)

    @staticmethod
    def _assess_urgency(symptoms_lower: str, categories: list[str]) -> str:
        high_urgency_keywords = [
            "severe", "intense", "unbearable", "emergency", "blood",
            "chest pain", "can't breathe", "collapse", "faint",
        ]
        for kw in high_urgency_keywords:
            if kw in symptoms_lower:
                return "HIGH"

        moderate_keywords = [
            "moderate", "persistent", "constant", "worsening", "recurring",
        ]
        for kw in moderate_keywords:
            if kw in symptoms_lower:
                return "MODERATE"

        if len(categories) >= 3:
            return "MODERATE"

        return "LOW"
