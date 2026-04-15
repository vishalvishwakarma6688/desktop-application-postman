import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-950 mt-36">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-orange-400 transition-colors mb-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                </Link>

                <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
                <p className="text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="prose prose-invert prose-orange max-w-none">
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Welcome to APIFlow. We respect your privacy and are committed to protecting your personal data.
                            This privacy policy explains how we collect, use, and safeguard your information when you use our desktop application.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            APIFlow is designed with privacy in mind. We collect minimal information necessary to provide our services:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li>Account information (email, username) when you register</li>
                            <li>API requests and collections you create (stored locally and on our servers)</li>
                            <li>Usage analytics to improve the application</li>
                            <li>Technical information (OS version, app version) for debugging</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            We use the collected information to:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li>Provide and maintain our service</li>
                            <li>Sync your data across devices</li>
                            <li>Improve and optimize the application</li>
                            <li>Communicate with you about updates and features</li>
                            <li>Ensure security and prevent fraud</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">4. Data Storage and Security</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Your data is stored securely using industry-standard encryption. We implement appropriate technical
                            and organizational measures to protect your personal information against unauthorized access, alteration,
                            disclosure, or destruction.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Data Sharing</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li>With your explicit consent</li>
                            <li>To comply with legal obligations</li>
                            <li>To protect our rights and prevent fraud</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            You have the right to:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li>Access your personal data</li>
                            <li>Correct inaccurate data</li>
                            <li>Request deletion of your data</li>
                            <li>Export your data</li>
                            <li>Opt-out of marketing communications</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">7. Cookies and Tracking</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            We use minimal cookies and tracking technologies to maintain your session and improve user experience.
                            You can control cookie preferences through your browser settings.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">8. Changes to This Policy</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            We may update this privacy policy from time to time. We will notify you of any changes by posting
                            the new policy on this page and updating the "Last updated" date.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">9. Contact Us</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            If you have any questions about this privacy policy, please contact us at:
                        </p>
                        <p className="text-orange-400">
                            Email: <a href="mailto:privacy@apiflow.dev" className="hover:underline">privacy@apiflow.dev</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
