import React from "react";
import type { ModelProgress, ModelStatus } from "@/lib/ai/modelManager";
import type { InferenceMode } from "@/hooks/useAIEngine";

interface ModelStatusProps {
    inferenceMode: InferenceMode;
    modelStatus: ModelStatus;
    progress: ModelProgress;
    isOffline: boolean;
    onEnableOffline: () => void;
    onSwitchToCloud: () => void;
}

export function ModelStatusComponent({
    inferenceMode,
    modelStatus,
    progress,
    isOffline,
    onEnableOffline,
    onSwitchToCloud,
}: ModelStatusProps): React.ReactNode {
    const isDownloading = modelStatus === "downloading" || modelStatus === "loading" || modelStatus === "checking";
    const isOfflineReady = inferenceMode === "offline" && modelStatus === "ready";

    return (
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-white">
            <div className="flex items-center justify-between">
                {/* Mode Badge */}
                <div className="flex items-center gap-3">
                    {isOfflineReady ? (
                        <>
                            <span className="text-lg">🟢</span>
                            <div>
                                <p className="text-sm font-medium text-emerald-600">
                                    Running in Secure Offline Mode
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                    AI runs entirely on your device — no data leaves your browser
                                </p>
                            </div>
                        </>
                    ) : isDownloading ? (
                        <>
                            <span className="text-lg">⬇️</span>
                            <div>
                                <p className="text-sm font-medium text-blue-600">
                                    Downloading Offline AI Model…
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                    {progress.text || "This may take a few minutes on first setup"}
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="text-lg">☁️</span>
                            <div>
                                <p className="text-sm font-medium text-blue-600">
                                    Running in Secure Cloud Mode
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                    Fast AI responses from our secure servers
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {isOffline && (
                        <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700 font-medium">
                            No Internet
                        </span>
                    )}

                    {/* Show "Enable Offline" button only in cloud mode */}
                    {inferenceMode === "cloud" && !isDownloading && (
                        <div className="relative group">
                            <button
                                onClick={onEnableOffline}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                🔒 Enable Offline Mode
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                Offline mode runs AI fully on your device.
                                Initial setup downloads ~1.4GB model. Once cached,
                                it loads instantly on future visits.
                            </div>
                        </div>
                    )}

                    {/* Show "Switch to Cloud" when offline model is ready */}
                    {isOfflineReady && (
                        <button
                            onClick={onSwitchToCloud}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            ☁️ Switch to Cloud
                        </button>
                    )}

                    {/* Cancel during download */}
                    {isDownloading && (
                        <button
                            onClick={onSwitchToCloud}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* Progress bar for download */}
            {isDownloading && (
                <div className="mt-3">
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
                            style={{ width: `${progress.progress * 100}%` }}
                        />
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1 text-right">
                        {Math.round(progress.progress * 100)}%
                    </p>
                </div>
            )}

            {/* Error state */}
            {modelStatus === "error" && (
                <div className="mt-3 p-2 rounded-lg bg-red-50 border border-red-100">
                    <p className="text-xs text-red-600">
                        {progress.text || "Failed to load offline model. Using cloud mode instead."}
                    </p>
                </div>
            )}

            {/* Unsupported state */}
            {modelStatus === "unsupported" && (
                <div className="mt-3 p-2 rounded-lg bg-amber-50 border border-amber-100">
                    <p className="text-xs text-amber-700">
                        Your browser doesn't support WebGPU. Cloud mode provides the same functionality.
                    </p>
                </div>
            )}
        </div>
    );
}
