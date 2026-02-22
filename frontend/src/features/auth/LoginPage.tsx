import React from "react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthLayout } from "@/shared/layout/AuthLayout";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";

export function LoginPage(): React.ReactNode {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent): Promise<void> => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        console.log({email, password})

        try {
            await login({ email, password });

            navigate("/dashboard");
        } catch (err: unknown) {
            if (err && typeof err === "object" && "response" in err) {
                const axiosErr = err as { response?: { data?: { error?: string } } };
                setError(axiosErr.response?.data?.error || "Login failed. Please try again.");
            } else {
                setError("Login failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Welcome Back" subtitle="Sign in to your account">
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <div className="flex items-center justify-end">
                    <Link
                        to="/forgot-password"
                        className="text-sm text-[var(--color-primary)] hover:underline"
                    >
                        Forgot password?
                    </Link>
                </div>

                <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                    Sign In
                </Button>

                <p className="text-center text-sm text-[var(--color-text-secondary)]">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-[var(--color-primary)] font-medium hover:underline">
                        Create one
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
