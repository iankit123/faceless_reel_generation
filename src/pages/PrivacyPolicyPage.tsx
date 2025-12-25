import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PrivacyPolicyPage() {
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

                <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>

                <div className="space-y-6 text-zinc-400 leading-relaxed text-sm">
                    <p>Last Updated: December 2025</p>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
                        <p>We collect information you provide directly to us when you use our AI video generation services, including:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Account information (email, name) when you sign up via Google.</li>
                            <li>Content you upload (images for OCR, text prompts).</li>
                            <li>Generated content (video scripts and metadata).</li>
                            <li>Device identifiers for guest user tracking.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
                        <p>We use the collected data to:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Provide and maintain our video generation services.</li>
                            <li>Process and complete transactions.</li>
                            <li>Improve our AI models and user experience.</li>
                            <li>Communicate with you about updates and features.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">3. Data Sharing and Processing</h2>
                        <p>Our service integrates with third-party providers to deliver AI capabilities:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Groq:</strong> Text prompts and images are processed by Groq Cloud for story generation and OCR.</li>
                            <li><strong>Supabase:</strong> User profiles, project data, and authentication are managed via Supabase.</li>
                        </ul>
                        <p className="mt-4 italic">We do not sell your personal data to third parties.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">4. Cookies and Tracking</h2>
                        <p>We use local storage and essential cookies to maintain your session and persistent project data (like your video creations) across visits.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">5. Your Rights</h2>
                        <p>Depending on your location, you may have rights regarding your personal data, including the right to access, correct, or delete your information. Contact us for any such requests.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">6. Contact Us</h2>
                        <p>For questions about this Privacy Policy, please contact our support team.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
