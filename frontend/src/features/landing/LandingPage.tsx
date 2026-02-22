import React from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/shared/ui/Logo";
import { Button } from "@/shared/ui/Button";

export function LandingPage(): React.ReactNode {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--color-border)]">
                <div className="max-w-[var(--max-width)] mx-auto p-6 flex items-center justify-between">
                    <Logo size="md" />
                    <div className="flex items-center gap-6">
                        <a href="#features" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
                            Features
                        </a>
                        <a href="#how-it-works" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
                            How It Works
                        </a>
                        <a href="#b2b" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
                            For Sponsors
                        </a>
                        <Link to="/login">
                            <Button variant="ghost" size="sm">Sign In</Button>
                        </Link>
                        <Link to="/register">
                            <Button variant="primary" size="sm">Get Started</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="py-32 px-6">
                <div className="max-w-[var(--max-width)] mx-auto text-center">
                    <div className="animate-fade-in-up">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-[var(--color-primary)] mb-6">
                            🩺 HIPAA & GDPR Compliant • FDA 21 CFR Part 11
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-[var(--color-text)] tracking-tight leading-[1.1] animate-fade-in-up animation-delay-100">
                        Clinical Triage Without Borders
                        <br />
                    </h1>
                    <div className="mt-3 mb-2 animate-fade-in-up animation-delay-100">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-sm">
                            Powered by AI
                        </span>
                    </div>
                    <p className="text-lg md:text-xl text-[var(--color-text-secondary)] mt-6 max-w-2xl mx-auto mb-10 animate-fade-in-up animation-delay-200 leading-relaxed">
                        A hybrid-AI diagnostic engine designed for the world's most remote regions. From offline image analysis to automated patient matching for clinical trials, we’re making high-quality care—and high-impact research—accessible to everyone, everywhere
                    </p>
                    <div className="flex items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
                        <Link to="/register">
                            <Button variant="primary" size="lg">
                                Start Free Triage
                            </Button>
                        </Link>
                        <a href="#b2b">
                            <Button variant="outline" size="lg">
                                Sponsor a Trial
                            </Button>
                        </a>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto mt-16 animate-fade-in-up animation-delay-400">
                        <div>
                            <p className="text-3xl font-bold text-[var(--color-text)]">100%</p>
                            <p className="text-sm text-[var(--color-text-muted)]">Offline Capable</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-[var(--color-text)]">FHIR</p>
                            <p className="text-sm text-[var(--color-text-muted)]">Interoperable</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-[var(--color-text)]">70-90%</p>
                            <p className="text-sm text-[var(--color-text-muted)]">Less AI Hallucination</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-20 px-6 bg-[var(--color-surface-alt)]">
                <div className="max-w-[var(--max-width)] mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4">
                            Built for Underserved Communities
                        </h2>
                        <p className="text-[var(--color-text-secondary)] max-w-lg mx-auto">
                            Every feature is designed to meet the needs of patients, clinicians, and sponsors in any environment.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: "📱",
                                title: "Offline-First AI Triage",
                                description:
                                    "MedGemma 4B runs directly on your device — no internet required. Get clinical-grade assessments anytime, anywhere.",
                            },
                            {
                                icon: "🔒",
                                title: "Military-Grade Compliance",
                                description:
                                    "HIPAA, GDPR, and FDA 21 CFR Part 11 compliant. Immutable audit trails, encrypted PHI, and time-bound consent.",
                            },
                            {
                                icon: "🔬",
                                title: "Trial Matching Engine",
                                description:
                                    "Automatically match your anonymized profile with decentralized clinical trials. Earn compensation while advancing science.",
                            },
                            {
                                icon: "🗣️",
                                title: "Voice Biomarker Analysis",
                                description:
                                    "Gemini-powered audio processing extracts acoustic biomarkers for respiratory, mental health, and neurological screening.",
                            },
                            {
                                icon: "💊",
                                title: "Supply-Chain Aware Rx",
                                description:
                                    "Prescriptions cross-referenced with local pharmacy inventory. If a drug is unavailable, get the next best alternative instantly.",
                            },
                            {
                                icon: "🧠",
                                title: "Explainable AI (XAI)",
                                description:
                                    "SHAP and LIME visualizations show exactly which data points drove the AI's decision — no more black boxes.",
                            },
                        ].map((feature) => (
                            <div
                                key={feature.title}
                                className="bg-white rounded-xl border border-[var(--color-border)] p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="text-3xl mb-4">{feature.icon}</div>
                                <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20 px-6">
                <div className="max-w-[var(--max-width)] mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4">
                            How It Works
                        </h2>
                        <p className="text-[var(--color-text-secondary)] max-w-lg mx-auto">
                            From symptom input to treatment plan in minutes — all grounded in verified clinical data.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            {
                                step: "01",
                                title: "Describe Symptoms",
                                description: "Enter text, upload images, or speak — the AI processes all modalities.",
                            },
                            {
                                step: "02",
                                title: "AI Triage",
                                description: "MedGemma runs locally; Gemini handles complex multimodal fusion in the cloud.",
                            },
                            {
                                step: "03",
                                title: "Verified Diagnosis",
                                description: "RAG pipeline cross-references FHIR records, PubMed, and clinical guidelines.",
                            },
                            {
                                step: "04",
                                title: "Actionable Plan",
                                description: "Get treatment recommendations, pharmacy availability, and trial matching.",
                            },
                        ].map((item) => (
                            <div key={item.step} className="text-center">
                                <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-bold mx-auto mb-4">
                                    {item.step}
                                </div>
                                <h3 className="font-semibold text-[var(--color-text)] mb-2">{item.title}</h3>
                                <p className="text-sm text-[var(--color-text-secondary)]">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* B2B Section */}
            <section id="b2b" className="py-20 px-6 bg-[var(--color-text)]">
                <div className="max-w-[var(--max-width)] mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 mb-6">
                                For Pharmaceutical Sponsors
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                                Access the Most Diverse
                                <br />
                                Trial Populations on Earth
                            </h2>
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                Traditional clinical trials fail on diversity. Our platform reaches
                                populations in low-resource settings — giving you the diverse,
                                representative data that regulators and ethics boards demand.
                            </p>
                            <div className="space-y-4">
                                {[
                                    "Automated pre-screening against complex eligibility criteria",
                                    "HL7 FHIR interoperable — plug into your existing EHR systems",
                                    "eConsent & ePRO modules for fully decentralized trials",
                                    "Real-time enrollment analytics and demographic breakdowns",
                                ].map((point) => (
                                    <div key={point} className="flex items-start gap-3">
                                        <span className="text-[var(--color-success)] mt-0.5">✓</span>
                                        <span className="text-gray-300 text-sm">{point}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8">
                                <Link to="/register">
                                    <Button variant="primary" size="lg">
                                        Request Demo
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-2xl border border-white/10 p-8">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <span className="text-white font-medium">Recruitment Speed</span>
                                    <span className="text-[var(--color-success)] font-bold">3x Faster</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <span className="text-white font-medium">Population Diversity</span>
                                    <span className="text-[var(--color-success)] font-bold">85%+ Underrepresented</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <span className="text-white font-medium">Data Standards</span>
                                    <span className="text-[var(--color-success)] font-bold">HL7 FHIR R4</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-white font-medium">Compliance</span>
                                    <span className="text-[var(--color-success)] font-bold">FDA / EMA Ready</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4">
                        Ready to Democratize Healthcare?
                    </h2>
                    <p className="text-[var(--color-text-secondary)] mb-8">
                        Join thousands of patients and clinicians using AI-powered triage — completely free.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <Link to="/register">
                            <Button variant="primary" size="lg">Create Free Account</Button>
                        </Link>
                        <Link to="/login">
                            <Button variant="outline" size="lg">Sign In</Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-[var(--color-border)] py-12 px-6">
                <div className="max-w-[var(--max-width)] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <Logo size="sm" />
                    <div className="flex items-center gap-6 text-sm text-[var(--color-text-muted)]">
                        <a href="#" className="hover:text-[var(--color-text)] transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-[var(--color-text)] transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-[var(--color-text)] transition-colors">HIPAA Notice</a>
                        <a href="#" className="hover:text-[var(--color-text)] transition-colors">Contact</a>
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)]">
                        © 2026 Cavista. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
