/**
 * Inference Engine
 *
 * Orchestrates text and image inference — tries client-side (WebLLM)
 * first, falls back to backend API if WebGPU is unavailable.
 */

import { modelManager } from "@/lib/ai/modelManager";
import api from "@/services/api";

export interface TriageInput {
    symptomsText?: string;
    image?: File | null;
    source: "TEXT" | "IMAGE" | "MULTIMODAL";
}

export interface TriageResultData {
    sessionId: string;
    diagnosis: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    confidenceScore: number;
    recommendations: string[];
    differentialDiagnoses: { condition: string; confidence: number }[];
    explainability: Record<string, unknown>;
    inferenceMode: "CLIENT" | "SERVER";
}

const MEDICAL_SYSTEM_PROMPT = `You are MedGemma, a clinical-grade AI triage assistant. Analyze the patient's symptoms and provide a structured medical assessment.

IMPORTANT: You are NOT a replacement for professional medical advice. Always recommend consulting a healthcare professional.

If patient medical history is provided, consider it carefully in your assessment — look for relevant interactions, contraindications, and how existing conditions may influence the current symptoms.

Respond ONLY with valid JSON in this exact format:
{
  "diagnosis": "Brief primary assessment summary",
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "confidence_score": 0.0 to 1.0,
  "recommendations": ["action 1", "action 2", "action 3"],
  "differential_diagnoses": [
    {"condition": "name", "confidence": 0.0 to 1.0}
  ],
  "explainability": {
    "contributing_factors": ["factor 1", "factor 2"],
    "reasoning": "brief clinical reasoning"
  }
}`;

/**
 * Fetch patient medical context from backend.
 */
async function fetchMedicalContext(): Promise<string> {
    try {
        const res = await api.get<{ context: string }>("/records/context/");
        return res.data.context || "";
    } catch {
        return "";
    }
}

/**
 * Run text-based triage — client-side first, then server fallback.
 */
export async function runTextInference(
    symptoms: string
): Promise<TriageResultData> {
    // Fetch patient medical context to enrich inference
    const medicalContext = await fetchMedicalContext();
    const enrichedSymptoms = medicalContext
        ? `Patient symptoms: ${symptoms}\n\n--- Patient Medical History ---\n${medicalContext}`
        : symptoms;

    // Try client-side inference first
    if (modelManager.isModelReady()) {
        return runClientInference(enrichedSymptoms, "TEXT");
    }

    // Fall back to server
    return runServerInference(symptoms, "TEXT");
}

/**
 * Run image-based triage (server-only for MVP, as WebLLM vision
 * support for MedSigLIP requires additional setup).
 */
export async function runImageInference(
    symptoms: string,
    image: File
): Promise<TriageResultData> {
    // Image analysis currently goes through server
    return runServerInference(symptoms, "IMAGE", image);
}

/**
 * Run multimodal triage (text + image).
 */
export async function runMultimodalInference(
    symptoms: string,
    image: File
): Promise<TriageResultData> {
    return runServerInference(symptoms, "MULTIMODAL", image);
}

/**
 * Client-side inference via WebLLM.
 */
async function runClientInference(
    symptoms: string,
    source: "TEXT" | "IMAGE" | "MULTIMODAL"
): Promise<TriageResultData> {
    // 1. Create session on backend
    const sessionRes = await api.post("/triage/sessions/", {
        symptoms_text: symptoms,
        source,
        inference_mode: "CLIENT",
        model_version: "medgemma-4b-webllm",
        device_info: {
            webgpu: true,
            userAgent: navigator.userAgent,
        },
    });

    const sessionId = sessionRes.data.id;

    try {
        // 2. Run local inference
        const rawResponse = await modelManager.generateResponse(
            MEDICAL_SYSTEM_PROMPT,
            `Patient symptoms: ${symptoms}\n\nProvide your clinical assessment as JSON.`
        );

        // 3. Parse response
        const parsed = parseModelResponse(rawResponse);

        // 4. Save result to backend
        await api.post("/triage/results/", {
            session_id: sessionId,
            ...parsed,
        });

        return {
            sessionId,
            diagnosis: parsed.diagnosis,
            severity: parsed.severity,
            confidenceScore: parsed.confidence_score,
            recommendations: parsed.recommendations,
            differentialDiagnoses: parsed.differential_diagnoses,
            explainability: parsed.explainability,
            inferenceMode: "CLIENT",
        };
    } catch (error) {
        // If client inference fails, fall back to server
        console.warn("Client inference failed, falling back to server:", error);
        return runServerInference(symptoms, source);
    }
}

/**
 * Server-side fallback inference.
 */
async function runServerInference(
    symptoms: string,
    source: "TEXT" | "IMAGE" | "MULTIMODAL",
    image?: File
): Promise<TriageResultData> {
    // If there's an image, upload it alongside inference
    if (image && (source === "IMAGE" || source === "MULTIMODAL")) {
        const formData = new FormData();
        formData.append("symptoms_text", symptoms);
        formData.append("source", source);

        const res = await api.post("/triage/inference/", {
            symptoms_text: symptoms,
            source,
        });

        const session = res.data;

        // Upload image to the session
        const imgForm = new FormData();
        imgForm.append("session_id", session.id);
        imgForm.append("image", image);
        await api.post("/triage/images/", imgForm, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        return mapSessionToResult(session, "SERVER");
    }

    const res = await api.post("/triage/inference/", {
        symptoms_text: symptoms,
        source,
    });

    return mapSessionToResult(res.data, "SERVER");
}

/**
 * Parse raw model JSON output with fallback handling.
 */
function parseModelResponse(raw: string): {
    diagnosis: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    confidence_score: number;
    recommendations: string[];
    differential_diagnoses: { condition: string; confidence: number }[];
    explainability: Record<string, unknown>;
} {
    try {
        // Try to extract JSON from the response
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                diagnosis: parsed.diagnosis || "Unable to parse diagnosis",
                severity: validateSeverity(parsed.severity),
                confidence_score: Math.min(1, Math.max(0, parsed.confidence_score || 0.5)),
                recommendations: parsed.recommendations || [],
                differential_diagnoses: parsed.differential_diagnoses || [],
                explainability: parsed.explainability || {},
            };
        }
    } catch {
        // Fall through to default
    }

    return {
        diagnosis: raw || "AI analysis completed. Please consult a healthcare professional.",
        severity: "MEDIUM",
        confidence_score: 0.5,
        recommendations: ["Consult a healthcare professional for evaluation"],
        differential_diagnoses: [],
        explainability: { raw_response: raw },
    };
}

function validateSeverity(
    s: string
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    const valid = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    return valid.includes(s?.toUpperCase()) ? (s.toUpperCase() as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") : "MEDIUM";
}

function mapSessionToResult(
    session: Record<string, unknown>,
    mode: "CLIENT" | "SERVER"
): TriageResultData {
    const result = session.result as Record<string, unknown> | null;
    return {
        sessionId: session.id as string,
        diagnosis: (result?.diagnosis as string) || "Pending analysis",
        severity: (result?.severity as TriageResultData["severity"]) || "MEDIUM",
        confidenceScore: (result?.confidence_score as number) || 0,
        recommendations: (result?.recommendations as string[]) || [],
        differentialDiagnoses:
            (result?.differential_diagnoses as { condition: string; confidence: number }[]) || [],
        explainability: (result?.explainability as Record<string, unknown>) || {},
        inferenceMode: mode,
    };
}
