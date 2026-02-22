/**
 * WebLLM Model Manager
 *
 * Singleton managing MedGemma 4B lifecycle via WebLLM.
 * Handles WebGPU detection, model loading with progress,
 * persistent caching via browser Cache API, and cancellation.
 */

import type { MLCEngine, InitProgressReport } from "@mlc-ai/web-llm";

export type ModelStatus =
    | "idle"
    | "checking"
    | "downloading"
    | "loading"
    | "ready"
    | "error"
    | "unsupported";

export interface ModelProgress {
    status: ModelStatus;
    progress: number;
    text: string;
}

// MedGemma model ID for WebLLM
const PREFERRED_MODEL = "gemma-2-2b-it-q4f16_1-MLC";

class ModelManager {
    private engine: MLCEngine | null = null;
    private status: ModelStatus = "idle";
    private progressCallback: ((progress: ModelProgress) => void) | null = null;
    private cancelRequested = false;
    private loadingPromise: Promise<boolean> | null = null;

    /**
     * Check if the browser supports WebGPU.
     */
    async checkWebGPUSupport(): Promise<boolean> {
        const nav = navigator as unknown as { gpu?: { requestAdapter: () => Promise<unknown | null> } };
        if (!nav.gpu) {
            return false;
        }
        try {
            const adapter = await nav.gpu.requestAdapter();
            return adapter !== null;
        } catch {
            return false;
        }
    }

    /**
     * Initialize and load the model. Supports cancellation via cancelLoad().
     */
    async initModel(
        onProgress?: (progress: ModelProgress) => void
    ): Promise<boolean> {
        // If already loading, return existing promise
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.cancelRequested = false;
        this.progressCallback = onProgress || null;

        this.loadingPromise = this._doInit();
        const result = await this.loadingPromise;
        this.loadingPromise = null;
        return result;
    }

    private async _doInit(): Promise<boolean> {
        this.updateStatus("checking", 0, "Checking WebGPU support...");

        const hasWebGPU = await this.checkWebGPUSupport();
        if (!hasWebGPU) {
            this.updateStatus("unsupported", 0, "WebGPU not supported on this device");
            return false;
        }

        if (this.cancelRequested) {
            this.updateStatus("idle", 0, "Cancelled");
            return false;
        }

        try {
            this.updateStatus("downloading", 0, "Initializing AI engine...");

            const { CreateMLCEngine } = await import("@mlc-ai/web-llm");

            if (this.cancelRequested) {
                this.updateStatus("idle", 0, "Cancelled");
                return false;
            }

            const engine = await CreateMLCEngine(PREFERRED_MODEL, {
                initProgressCallback: (report: InitProgressReport) => {
                    if (this.cancelRequested) return;
                    const progress = report.progress || 0;
                    this.updateStatus(
                        "downloading",
                        progress,
                        report.text || "Loading model..."
                    );
                },
            });

            // Check if cancelled while downloading
            if (this.cancelRequested) {
                await engine.unload();
                this.updateStatus("idle", 0, "Cancelled");
                return false;
            }

            this.engine = engine;
            this.updateStatus("ready", 1, "MedGemma AI engine ready");
            return true;
        } catch (error) {
            if (this.cancelRequested) {
                this.updateStatus("idle", 0, "Cancelled");
                return false;
            }
            console.error("Model initialization failed:", error);
            this.updateStatus(
                "error",
                0,
                `Failed to load AI model: ${error instanceof Error ? error.message : "Unknown error"}`
            );
            return false;
        }
    }

    /**
     * Cancel an in-progress model load.
     */
    cancelLoad(): void {
        this.cancelRequested = true;
        this.updateStatus("idle", 0, "Cancelling...");
    }

    /**
     * Run chat completion with the loaded model.
     */
    async generateResponse(
        systemPrompt: string,
        userMessage: string
    ): Promise<string> {
        if (!this.engine || this.status !== "ready") {
            throw new Error("Model is not loaded. Call initModel() first.");
        }

        const response = await this.engine.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
            ],
            temperature: 0.3,
            max_tokens: 1024,
        });

        return response.choices[0]?.message?.content || "";
    }

    /**
     * Check if the model is ready for inference.
     */
    isModelReady(): boolean {
        return this.status === "ready" && this.engine !== null;
    }

    /**
     * Get the current model status.
     */
    getStatus(): ModelStatus {
        return this.status;
    }

    /**
     * Unload the model to free GPU memory.
     */
    async unloadModel(): Promise<void> {
        // Cancel any in-progress load
        this.cancelRequested = true;

        if (this.engine) {
            await this.engine.unload();
            this.engine = null;
        }
        this.updateStatus("idle", 0, "Model unloaded");
    }

    private updateStatus(status: ModelStatus, progress: number, text: string): void {
        this.status = status;
        if (this.progressCallback) {
            this.progressCallback({ status, progress, text });
        }
    }
}

// Singleton export
export const modelManager = new ModelManager();
