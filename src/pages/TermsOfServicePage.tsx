import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TermsOfServicePage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-300 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                </button>

                <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>

                <div className="space-y-6 text-zinc-400 leading-relaxed text-sm">
                    <p>Last Updated: December 2025</p>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
                        <p>By accessing or using our services, you agree to be bound by these Terms of Service. If you do not agree, you may not use the service.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
                        <p>Our platform provides AI-powered video generation tools, including text-to-story expansion, image generation guidance, and automated video editing.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">3. Credits and Payments</h2>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Registered users receive initial credits to use the service.</li>
                            <li>Credits are consumed upon successful video generation.</li>
                            <li>Additional credits may be purchased and are non-refundable unless required by law.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">4. User Responsibility</h2>
                        <p>You are responsible for the prompts you enter and the content you generate. You agree not to use the service to generate harmful, illegal, or infringing content.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">5. Intellectual Property</h2>
                        <p>You retain rights to the inputs you provide. We grant you a license to use the generated output for personal and commercial purposes, subject to these terms. However, we do not guarantee the copyrightability of AI-generated content.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">6. Limitations of Liability</h2>
                        <p>Our service is provided "as is". We are not liable for any damages resulting from the use or inability to use our AI generation tools.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">7. Modifications to Terms</h2>
                        <p>We reserve the right to modify these terms at any time. Your continued use of the service constitutes acceptance of the new terms.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
