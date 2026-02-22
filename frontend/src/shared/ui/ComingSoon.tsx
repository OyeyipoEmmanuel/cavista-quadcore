import React from "react";

interface ComingSoonProps {
    title?: string;
    description?: string;
}

export function ComingSoon({
    title = "Coming Soon",
    description = "This feature is currently under development and will be available in a future update.",
}: ComingSoonProps): React.ReactNode {
    return (
        <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
            <div className="text-center max-w-md space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
                    <span className="text-3xl">🚧</span>
                </div>
                <h1 className="text-2xl font-bold text-[var(--color-text)]">
                    {title}
                </h1>
                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                    {description}
                </p>
                <div className="pt-4">
                    <span className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        Under Development
                    </span>
                </div>
            </div>
        </div>
    );
}
