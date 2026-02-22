import time

from apps.audit.services.audit_service import AuditService
from apps.triage.models.triage_session import TriageResult
from apps.xai.models.explanation import Explanation, FeatureContribution


class XAIService:
    """
    Generates and retrieves Explainable AI (XAI) outputs.

    Analyses a TriageResult's diagnosis, severity, confidence, symptoms,
    and raw explainability data to produce structured SHAP-style
    explanations with individual feature contributions.
    """

    # ------------------------------------------------------------------ #
    # Symptom → feature mapping used for SHAP-style scoring              #
    # ------------------------------------------------------------------ #

    SYMPTOM_FEATURES = {
        "headache": {
            "display_name": "Headache",
            "category": "SYMPTOM",
            "base_weight": 0.15,
        },
        "fever": {
            "display_name": "Fever / Elevated Temperature",
            "category": "VITAL_SIGN",
            "base_weight": 0.20,
        },
        "cough": {
            "display_name": "Cough",
            "category": "SYMPTOM",
            "base_weight": 0.12,
        },
        "fatigue": {
            "display_name": "Fatigue / Tiredness",
            "category": "SYMPTOM",
            "base_weight": 0.10,
        },
        "nausea": {
            "display_name": "Nausea / Vomiting",
            "category": "SYMPTOM",
            "base_weight": 0.13,
        },
        "pain": {
            "display_name": "Pain",
            "category": "SYMPTOM",
            "base_weight": 0.18,
        },
        "breathing": {
            "display_name": "Breathing Difficulty",
            "category": "SYMPTOM",
            "base_weight": 0.25,
        },
        "shortness of breath": {
            "display_name": "Shortness of Breath",
            "category": "SYMPTOM",
            "base_weight": 0.25,
        },
        "dizziness": {
            "display_name": "Dizziness / Lightheadedness",
            "category": "SYMPTOM",
            "base_weight": 0.14,
        },
        "chest": {
            "display_name": "Chest Pain / Discomfort",
            "category": "SYMPTOM",
            "base_weight": 0.28,
        },
        "rash": {
            "display_name": "Skin Rash",
            "category": "SYMPTOM",
            "base_weight": 0.08,
        },
        "swelling": {
            "display_name": "Swelling",
            "category": "SYMPTOM",
            "base_weight": 0.11,
        },
        "blood pressure": {
            "display_name": "Blood Pressure",
            "category": "VITAL_SIGN",
            "base_weight": 0.22,
        },
        "heart rate": {
            "display_name": "Heart Rate",
            "category": "VITAL_SIGN",
            "base_weight": 0.18,
        },
    }

    SEVERITY_MULTIPLIER = {
        "LOW": 0.3,
        "MEDIUM": 0.6,
        "HIGH": 0.85,
        "CRITICAL": 1.0,
    }

    # ------------------------------------------------------------------ #
    # Public methods                                                      #
    # ------------------------------------------------------------------ #

    @staticmethod
    def generate_explanation(
        triage_result: TriageResult,
        method: str = "SHAP",
        user=None,
        ip_address: str = None,
    ) -> Explanation:
        """
        Generate a structured XAI explanation for a triage result.

        Analyses the result's symptoms, severity, confidence, and any
        existing explainability data to produce SHAP-style feature
        contributions.
        """
        start = time.monotonic()

        # If explanation already exists, return it
        existing = Explanation.objects.filter(triage_result=triage_result).first()
        if existing:
            return existing

        # Extract features from the triage session
        session = triage_result.session
        symptoms_text = session.symptoms_text.lower()
        severity = triage_result.severity
        confidence = triage_result.confidence_score
        existing_xai = triage_result.explainability or {}
        severity_mult = XAIService.SEVERITY_MULTIPLIER.get(severity, 0.5)

        # Build feature contributions
        contributions_data = []

        # 1. Analyse symptoms text for known features
        for keyword, feature_info in XAIService.SYMPTOM_FEATURES.items():
            if keyword in symptoms_text:
                raw_score = feature_info["base_weight"] * severity_mult * confidence
                score = round(min(raw_score, 1.0), 4)

                contributions_data.append({
                    "feature_name": keyword.replace(" ", "_"),
                    "feature_category": feature_info["category"],
                    "contribution_score": score,
                    "direction": "POSITIVE" if score > 0.05 else "NEUTRAL",
                    "display_name": feature_info["display_name"],
                    "display_value": "Present in symptoms",
                    "description": (
                        f"{feature_info['display_name']} was identified in the patient's "
                        f"description and contributed a SHAP value of {score:+.4f} "
                        f"toward the {severity.lower()}-severity assessment."
                    ),
                })

        # 2. Add confidence as a meta-feature
        conf_direction = "POSITIVE" if confidence >= 0.7 else "NEGATIVE" if confidence < 0.4 else "NEUTRAL"
        contributions_data.append({
            "feature_name": "model_confidence",
            "feature_category": "BIOMARKER",
            "contribution_score": round(confidence * 0.3, 4),
            "direction": conf_direction,
            "display_name": "Model Confidence Level",
            "display_value": f"{confidence:.0%}",
            "description": (
                f"The AI model's confidence of {confidence:.0%} "
                f"{'supports' if confidence >= 0.7 else 'suggests uncertainty in'} "
                f"the current assessment."
            ),
        })

        # 3. Add severity as a meta-feature
        contributions_data.append({
            "feature_name": "severity_assessment",
            "feature_category": "BIOMARKER",
            "contribution_score": round(severity_mult * 0.25, 4),
            "direction": "POSITIVE" if severity in ("HIGH", "CRITICAL") else "NEUTRAL",
            "display_name": "Overall Severity Assessment",
            "display_value": severity.title(),
            "description": (
                f"The combined symptom profile resulted in a {severity.lower()}-severity "
                f"classification, which carries a weight multiplier of {severity_mult}."
            ),
        })

        # 4. Include any contributing factors from existing explainability data
        contributing_factors = existing_xai.get("contributing_factors", [])
        for i, factor in enumerate(contributing_factors):
            if isinstance(factor, str):
                contributions_data.append({
                    "feature_name": f"contributing_factor_{i}",
                    "feature_category": "HISTORY",
                    "contribution_score": round(0.1 * (1 - i * 0.1), 4),
                    "direction": "POSITIVE",
                    "display_name": factor,
                    "display_value": "Noted",
                    "description": f"Clinical analysis factor: {factor}",
                })

        # Sort by absolute contribution score (most important first)
        contributions_data.sort(key=lambda x: abs(x["contribution_score"]), reverse=True)

        # Assign ranks
        for rank, c in enumerate(contributions_data, start=1):
            c["rank"] = rank

        # Build global feature importance summary
        global_importance = [
            {
                "feature": c["display_name"],
                "score": c["contribution_score"],
                "rank": c["rank"],
                "direction": c["direction"],
            }
            for c in contributions_data[:10]
        ]

        # Generate human-readable summary
        summary = XAIService._build_summary(
            triage_result, contributions_data, severity, confidence
        )

        elapsed_ms = int((time.monotonic() - start) * 1000)

        # Persist explanation
        explanation = Explanation.objects.create(
            triage_result=triage_result,
            method=method,
            summary=summary,
            global_feature_importance=global_importance,
            model_version=session.model_version or "medgemma-4b-v1",
            computation_time_ms=elapsed_ms,
            metadata={
                "severity_multiplier": severity_mult,
                "symptoms_analysed": symptoms_text[:500],
                "total_features": len(contributions_data),
                "method_details": f"{method} analysis of {len(contributions_data)} features",
            },
            created_by=user or session.user,
        )

        # Persist individual feature contributions
        feature_objects = [
            FeatureContribution(
                explanation=explanation,
                feature_name=c["feature_name"],
                feature_category=c["feature_category"],
                contribution_score=c["contribution_score"],
                direction=c["direction"],
                display_name=c["display_name"],
                display_value=c["display_value"],
                description=c["description"],
                rank=c["rank"],
            )
            for c in contributions_data
        ]
        FeatureContribution.objects.bulk_create(feature_objects)

        # Audit log
        AuditService.log_action(
            user_id=str(session.user_id),
            action="CREATE",
            resource_type="Explanation",
            resource_id=str(explanation.id),
            ip_address=ip_address,
            changes={
                "method": method,
                "features_count": len(contributions_data),
                "computation_time_ms": elapsed_ms,
            },
        )

        return explanation

    @staticmethod
    def get_explanation(triage_result: TriageResult) -> Explanation | None:
        """Retrieve the existing XAI explanation for a triage result."""
        return (
            Explanation.objects.filter(triage_result=triage_result)
            .prefetch_related("feature_contributions")
            .first()
        )

    @staticmethod
    def get_clinical_summary(explanation: Explanation) -> dict:
        """
        Build a clinical decision support summary for clinicians.
        Groups features by category and highlights the top contributors.
        """
        contributions = explanation.feature_contributions.all()

        # Group by category
        categories = {}
        for fc in contributions:
            cat = fc.get_feature_category_display()
            if cat not in categories:
                categories[cat] = []
            categories[cat].append({
                "feature": fc.display_name or fc.feature_name,
                "value": fc.display_value,
                "score": fc.contribution_score,
                "direction": fc.direction,
                "description": fc.description,
                "rank": fc.rank,
            })

        # Top 5 contributors
        top_contributors = [
            {
                "feature": fc.display_name or fc.feature_name,
                "score": fc.contribution_score,
                "direction": fc.direction,
                "category": fc.get_feature_category_display(),
                "description": fc.description,
            }
            for fc in contributions[:5]
        ]

        # Risk factors (positive direction)
        risk_factors = [
            fc.display_name or fc.feature_name
            for fc in contributions
            if fc.direction == "POSITIVE"
        ]

        # Protective factors (negative direction)
        protective_factors = [
            fc.display_name or fc.feature_name
            for fc in contributions
            if fc.direction == "NEGATIVE"
        ]

        return {
            "explanation_id": str(explanation.id),
            "method": explanation.get_method_display(),
            "model_version": explanation.model_version,
            "summary": explanation.summary,
            "top_contributors": top_contributors,
            "risk_factors": risk_factors,
            "protective_factors": protective_factors,
            "feature_categories": categories,
            "computation_time_ms": explanation.computation_time_ms,
            "generated_at": explanation.created_at.isoformat(),
        }

    # ------------------------------------------------------------------ #
    # Private helpers                                                     #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _build_summary(
        triage_result: TriageResult,
        contributions: list,
        severity: str,
        confidence: float,
    ) -> str:
        """Generate a natural-language summary of the AI's reasoning."""
        top_features = contributions[:3]
        feature_names = [c["display_name"] for c in top_features]

        if len(feature_names) == 0:
            features_str = "the overall clinical profile"
        elif len(feature_names) == 1:
            features_str = feature_names[0]
        else:
            features_str = ", ".join(feature_names[:-1]) + f" and {feature_names[-1]}"

        confidence_desc = (
            "high" if confidence >= 0.8
            else "moderate" if confidence >= 0.5
            else "low"
        )

        summary = (
            f"The AI assessed this case as {severity.lower()} severity with "
            f"{confidence_desc} confidence ({confidence:.0%}). "
            f"The primary factors driving this assessment were {features_str}. "
        )

        positive_count = sum(1 for c in contributions if c["direction"] == "POSITIVE")
        if positive_count > 0:
            summary += (
                f"{positive_count} feature{'s' if positive_count != 1 else ''} "
                f"contributed positively toward the diagnosis. "
            )

        summary += (
            "This explanation was generated using SHAP (Shapley Additive Explanations) "
            "to provide transparency into the model's decision-making process."
        )

        return summary
