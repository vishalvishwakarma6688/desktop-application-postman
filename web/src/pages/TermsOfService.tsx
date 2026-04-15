import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gray-950">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-orange-400 transition-colors mb-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                </Link>

                <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
                <p className="text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="prose prose-invert prose-orange max-w-none">
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            By accessing and using APIFlow, you accept and agree to be bound by the terms and provisions of this agreement.
                            If you do not agree to these terms, please do not use our service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            APIFlow is a free, open-source desktop application for API testing and development. We provide tools to:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li>Create and manage API requests</li>
                            <li>Organize requests in collections</li>
                            <li>Test and debug APIs</li>
                            <li>Sync data across devices</li>
                            <li>Generate code snippets</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            To use certain features, you must create an account. You are responsible for:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li>Maintaining the confidentiality of your account credentials</li>
                            <li>All activities that occur under your account</li>
                            <li>Notifying us immediately of any unauthorized use</li>
                            <li>Providing accurate and complete information</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">4. Acceptable Use</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            You agree not to use APIFlow to:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li>Violate any laws or regulations</li>
                            <li>Infringe on intellectual property rights</li>
                            <li>Transmit malicious code or viruses</li>
                            <li>Attempt to gain unauthorized access to systems</li>
                            <li>Interfere with or disrupt the service</li>
                            <li>Use the service for any illegal or unauthorized purpose</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Intellectual Property</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            APIFlow is open-source software licensed under the MIT License. You retain all rights to the content
                            you create using our service. The APIFlow name, logo, and branding are protected trademarks.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">6. Data and Privacy</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Your use of APIFlow is also governed by our Privacy Policy. We collect and process data as described
                            in that policy. You are responsible for ensuring you have the right to share any data you input into the service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">7. Service Availability</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            We strive to provide reliable service but do not guarantee uninterrupted access. We may:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li>Modify or discontinue features with or without notice</li>
                            <li>Perform maintenance that may temporarily affect availability</li>
                            <li>Suspend or terminate accounts that violate these terms</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">8. Disclaimer of Warranties</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            APIFlow is provided "as is" without warranties of any kind, either express or implied. We do not warrant that:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li>The service will be error-free or uninterrupted</li>
                            <li>Defects will be corrected</li>
                            <li>The service is free of viruses or harmful components</li>
                            <li>Results obtained will be accurate or reliable</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            To the maximum extent permitted by law, APIFlow shall not be liable for any indirect, incidental,
                            special, consequential, or punitive damages resulting from your use or inability to use the service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">10. Termination</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            We reserve the right to terminate or suspend your account and access to the service at our sole discretion,
                            without notice, for conduct that we believe violates these terms or is harmful to other users, us, or third parties.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">11. Changes to Terms</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            We may modify these terms at any time. Continued use of the service after changes constitutes acceptance
                            of the modified terms. We will notify users of significant changes.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Information</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            For questions about these terms, please contact us at:
                        </p>
                        <p className="text-orange-400">
                            Email: <a href="mailto:legal@apiflow.dev" className="hover:underline">legal@apiflow.dev</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
