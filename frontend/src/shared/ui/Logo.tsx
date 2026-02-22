import React from "react";
interface LogoProps {
    className?: string;
    size?: "sm" | "md" | "lg";
}

const sizeMap = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
};

export function Logo({ className = "", size = "md" }: LogoProps): React.ReactNode {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="flex items-center justify-center w-8 h-8 bg-[var(--color-primary)] rounded-lg">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-5 h-5 text-white"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
            </div>
            <span className={`font-bold text-[var(--color-text)] tracking-tight ${sizeMap[size]}`}>
                DiagMed
            </span>
        </div>
    );
}
