import React, { useState } from "react";
import { useAIEngine } from "@/hooks/useAIEngine";
import { ModelStatusComponent } from "@/features/triage/components/ModelStatus";
import { SymptomInput } from "@/features/triage/components/SymptomInput";
import { ImageUpload } from "@/features/triage/components/ImageUpload";
import { TriageResults } from "@/features/triage/components/TriageResults";
import { TriageHistory } from "@/features/triage/components/TriageHistory";
import { Button } from "@/shared/ui/Button";
import type { TriageInput } from "@/lib/ai/inferenceEngine";

type Tab = "text" | "image" | "multimodal";

export function TriagePage(): React.ReactNode {
    const {
        inferenceMode,
        modelStatus,
        modelProgress,
        isInferring,
        isOffline,
        lastResult,
        error,
        enableOfflineMode,
        switchToCloud,
        runTriage,
    } = useAIEngine();

    const [activeTab, setActiveTab] = useState<Tab>("text");
    const [symptoms, setSymptoms] = useState("");
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    const handleSubmit = async (): Promise<void> => {
        const input: TriageInput = {
            symptomsText: symptoms,
            image: selectedImage,
            source:
                activeTab === "text"
                    ? "TEXT"
                    : activeTab === "image"
                        ? "IMAGE"
                        : "MULTIMODAL",
        };

        await runTriage(input);
    };

    const canSubmit =
        !isInferring &&
        ((activeTab === "text" && symptoms.trim().length > 10) ||
            (activeTab === "image" && selectedImage !== null) ||
            (activeTab === "multimodal" && symptoms.trim().length > 5 && selectedImage !== null));

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: "text", label: "Text", icon: "💬" },
        { key: "image", label: "Image", icon: "📷" },
        { key: "multimodal", label: "Both", icon: "🔄" },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">
                        AI Triage Assessment
                    </h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">
                        Describe your symptoms or upload a medical image for AI-powered analysis.
                    </p>
                </div>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-gray-50 transition-colors cursor-pointer"
                >
                    {showHistory ? "New Assessment" : "📜 History"}
                </button>
            </div>

            {/* Mode Status — Cloud/Offline indicator */}
            <ModelStatusComponent
                inferenceMode={inferenceMode}
                modelStatus={modelStatus}
                progress={modelProgress}
                isOffline={isOffline}
                onEnableOffline={enableOfflineMode}
                onSwitchToCloud={switchToCloud}
            />

            {showHistory ? (
                <div>
                    <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
                        Triage History
                    </h2>
                    <TriageHistory />
                </div>
            ) : (
                <>
                    {/* Input Tabs */}
                    <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
                        <div className="flex border-b border-[var(--color-border)]">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors cursor-pointer ${activeTab === tab.key
                                        ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] bg-blue-50/50"
                                        : "text-[var(--color-text-secondary)] hover:bg-gray-50"
                                        }`}
                                >
                                    <span>{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-6">
                            {(activeTab === "text" || activeTab === "multimodal") && (
                                <SymptomInput
                                    value={symptoms}
                                    onChange={setSymptoms}
                                    disabled={isInferring}
                                />
                            )}

                            {activeTab === "multimodal" && <div className="mt-6" />}

                            {(activeTab === "image" || activeTab === "multimodal") && (
                                <ImageUpload
                                    onImageSelect={setSelectedImage}
                                    disabled={isInferring}
                                />
                            )}

                            {/* Submit */}
                            <div className="mt-6 flex items-center justify-between">
                                <p className="text-xs text-[var(--color-text-muted)]">
                                    {inferenceMode === "offline" && modelStatus === "ready"
                                        ? "🔒 Analysis runs entirely on your device"
                                        : "☁️ Analysis uses our secure cloud servers"}
                                </p>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={handleSubmit}
                                    isLoading={isInferring}
                                    disabled={!canSubmit}
                                >
                                    {isInferring ? "Analyzing..." : "Run AI Triage"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Results */}
                    {lastResult && <TriageResults result={lastResult} />}
                </>
            )}
        </div>
    );
}
