"""
Gemini AI Inference Service

Calls Google's Gemini API (MedGemma) for clinical triage.
Returns structured diagnosis, severity, recommendations, and explainability.
"""

import json
import logging

from decouple import config
from google import genai

logger = logging.getLogger(__name__)

GEMINI_API_KEY = config("GEMINI_API_KEY", default="")

MEDICAL_SYSTEM_PROMPT = """You are MedGemma, a clinical-grade AI triage assistant. Analyze the patient's symptoms and provide a structured medical assessment.

IMPORTANT: You are NOT a replacement for professional medical advice. Always recommend consulting a healthcare professional.

If patient medical history is provided, consider it carefully — look for relevant interactions, contraindications, and how existing conditions may influence the current symptoms.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences, just raw JSON):
{
  "diagnosis": "Brief primary assessment summary",
  "severity": "LOW" or "MEDIUM" or "HIGH" or "CRITICAL",
  "confidence_score": 0.0 to 1.0,
  "recommendations": ["action 1", "action 2", "action 3"],
  "differential_diagnoses": [
    {"condition": "name", "confidence": 0.0 to 1.0}
  ],
  "explainability": {
    "contributing_factors": ["factor 1", "factor 2"],
    "reasoning": "brief clinical reasoning"
  }
}"""


class GeminiService:
    """Calls Google Gemini API for medical triage inference."""

    @staticmethod
    def run_inference(
        symptoms_text: str,
        medical_context: str = "",
    ) -> dict:
        """
        Call Gemini API with patient symptoms and optional medical history.
        Returns parsed structured response.
        """
        api_key = GEMINI_API_KEY
        if not api_key:
            logger.warning("GEMINI_API_KEY not set — returning fallback response")
            return GeminiService._fallback_response(symptoms_text)

        try:
            client = genai.Client(api_key=api_key)

            # Build user prompt
            user_prompt = f"Patient symptoms: {symptoms_text}"
            if medical_context:
                user_prompt += f"\n\n--- Patient Medical History ---\n{medical_context}"
            user_prompt += "\n\nProvide your clinical assessment as JSON."

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    {"role": "user", "parts": [{"text": MEDICAL_SYSTEM_PROMPT + "\n\n" + user_prompt}]}
                ],
                config={
                    "temperature": 0.3,
                    "max_output_tokens": 1024,
                    "response_mime_type": "application/json",
                    "thinking_config": {"thinking_budget": 0},
                },
            )

            raw_text = response.text or ""
            return GeminiService._parse_response(raw_text, symptoms_text)

        except Exception as e:
            logger.error("Gemini API call failed: %s", str(e))
            return GeminiService._fallback_response(symptoms_text)

    @staticmethod
    def _parse_response(raw: str, symptoms_text: str) -> dict:
        """Parse JSON from Gemini response with fallback."""
        try:
            # Strip markdown code fences if present
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                # Remove opening fence (```json or ```)
                first_newline = cleaned.index("\n")
                cleaned = cleaned[first_newline + 1:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            parsed = json.loads(cleaned)

            # Validate and normalize
            severity = (parsed.get("severity", "MEDIUM") or "MEDIUM").upper()
            if severity not in ("LOW", "MEDIUM", "HIGH", "CRITICAL"):
                severity = "MEDIUM"

            confidence = parsed.get("confidence_score", 0.5)
            confidence = max(0.0, min(1.0, float(confidence)))

            return {
                "diagnosis": parsed.get("diagnosis", "Assessment pending"),
                "severity": severity,
                "confidence_score": confidence,
                "recommendations": parsed.get("recommendations", []),
                "differential_diagnoses": parsed.get("differential_diagnoses", []),
                "explainability": parsed.get("explainability", {}),
                "raw_model_output": raw[:2000],
            }
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning("Failed to parse Gemini response: %s", str(e))
            return {
                "diagnosis": raw[:500] if raw else "AI analysis completed.",
                "severity": "MEDIUM",
                "confidence_score": 0.5,
                "recommendations": [
                    "Consult a healthcare professional for evaluation"
                ],
                "differential_diagnoses": [],
                "explainability": {
                    "raw_response": raw[:1000],
                    "parse_error": str(e),
                },
                "raw_model_output": raw[:2000],
            }

    @staticmethod
    def _fallback_response(symptoms_text: str) -> dict:
        """Return a sensible fallback when API is unavailable."""
        return {
            "diagnosis": (
                f"Based on your reported symptoms ({symptoms_text[:200]}...), "
                "we recommend consulting a healthcare professional for proper "
                "evaluation. This is a fallback response as the AI service "
                "is temporarily unavailable."
            ),
            "severity": "MEDIUM",
            "confidence_score": 0.3,
            "recommendations": [
                "Schedule an appointment with your primary care physician",
                "Monitor symptoms and note any changes",
                "Stay hydrated and get adequate rest",
                "Seek emergency care if symptoms worsen significantly",
            ],
            "differential_diagnoses": [],
            "explainability": {
                "contributing_factors": ["AI service fallback mode"],
                "reasoning": (
                    "The AI inference service is temporarily unavailable. "
                    "This is a general recommendation. Please set GEMINI_API_KEY "
                    "in your environment variables for AI-powered diagnosis."
                ),
            },
            "raw_model_output": "",
        }
