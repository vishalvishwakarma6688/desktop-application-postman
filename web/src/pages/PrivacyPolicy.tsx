import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const REPOSITORY_URL = 'https://github.com/vishalvishwakarma6688/desktop-application-postman';
const CONTACT_EMAIL = 'vishalvishwakarma2786@gmail.com';

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
                <p className="text-gray-400 mb-8">Last updated: June 9, 2026</p>

                <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5 mb-10">
                    <p className="text-gray-300 leading-relaxed">
                        APIFlow is an open-source, server-backed API development tool. This policy explains
                        what information the current application processes, where it is stored, and which
                        third-party services may receive it.
                    </p>
                </div>

                <div className="prose prose-invert prose-orange max-w-none">
                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Information You Provide</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            When you create an account or use APIFlow, the backend may store:
                        </p>
                        <ul className="list-disc text-gray-300 space-y-2 ml-6">
                            <li>Your name, email address, optional avatar, and authentication provider.</li>
                            <li>A securely hashed password when you register with email and password.</li>
                            <li>Workspaces, collections, saved requests, scripts, and environment variables.</li>
                            <li>Request configuration, including URLs, headers, bodies, and authentication values.</li>
                            <li>Request history, including request snapshots, response bodies, response headers, status codes, and execution times.</li>
                        </ul>
                        <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-4 text-sm leading-relaxed text-amber-100/80">
                            Saved requests and environment variables may contain API keys, tokens, passwords,
                            or other sensitive values. Avoid storing production secrets unless you understand
                            and accept the risks of storing them in the configured backend database.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-white mb-4">2. How API Requests Are Processed</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Requests sent from APIFlow are executed by the configured APIFlow backend. The
                            backend receives the request URL, method, headers, authentication values, query
                            parameters, body, and selected environment variables needed to execute the request.
                        </p>
                        <p className="text-gray-300 leading-relaxed">
                            The destination API you choose will also receive the information included in your
                            request. Its handling of that information is controlled by its own privacy policy,
                            not this policy.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-white mb-4">3. Optional AI Features</h2>
                        <p className="text-gray-300 leading-relaxed">
                            When you intentionally use an AI feature, relevant prompt content may be sent by
                            the APIFlow backend to Google Gemini. Depending on the feature, this can include
                            your question, request URL, headers, request body, error details, or portions of an
                            API response. Review and remove sensitive values before using AI features.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-white mb-4">4. Information Stored on Your Device</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            The desktop application uses local application storage for limited operational data,
                            including:
                        </p>
                        <ul className="list-disc text-gray-300 space-y-2 ml-6">
                            <li>Your authentication token while you remain signed in.</li>
                            <li>The identifier of your currently selected workspace.</li>
                            <li>Application preferences such as timeout, proxy, redirect, SSL verification, and diff-viewer settings.</li>
                        </ul>
                        <p className="text-gray-300 leading-relaxed mt-4">
                            Signing out removes the locally stored authentication token. Other application
                            preferences may remain until you clear the application&apos;s local data.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Third-Party Services</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            APIFlow may communicate with third-party services when required for a feature:
                        </p>
                        <ul className="list-disc text-gray-300 space-y-2 ml-6">
                            <li>Google or GitHub when you choose their OAuth sign-in options.</li>
                            <li>Google Gemini when you intentionally use an AI-assisted feature.</li>
                            <li>GitHub to check for application updates and retrieve official releases.</li>
                            <li>The destination APIs that you explicitly configure and send requests to.</li>
                            <li>The hosting and database providers used by the configured APIFlow backend.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-white mb-4">6. Analytics and Advertising</h2>
                        <p className="text-gray-300 leading-relaxed">
                            The current APIFlow codebase does not include third-party advertising or dedicated
                            product-analytics tracking. Normal operational logs may still be created by the
                            backend, hosting provider, database provider, destination APIs, and third-party
                            services used by the application.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-white mb-4">7. Security and Data Retention</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Local-account passwords are hashed before storage. However, no system can guarantee
                            absolute security, and APIFlow does not currently claim that all stored request data,
                            credentials, or environment variables are encrypted at rest.
                        </p>
                        <p className="text-gray-300 leading-relaxed">
                            Data remains in the configured backend until it is deleted through available
                            application features, removed by an administrator, or deleted according to the
                            hosting provider&apos;s practices. Request-history records can be deleted or cleared
                            through the application.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-white mb-4">8. Your Choices</h2>
                        <ul className="list-disc text-gray-300 space-y-2 ml-6">
                            <li>Do not save requests or environment variables containing sensitive credentials.</li>
                            <li>Remove sensitive content before using optional AI features.</li>
                            <li>Delete request history and other saved resources using available application controls.</li>
                            <li>Sign out to remove the authentication token stored on your device.</li>
                            <li>Self-host and review the open-source code if you require control over the backend environment.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-white mb-4">9. Open-Source Transparency</h2>
                        <p className="text-gray-300 leading-relaxed">
                            You can inspect the application and backend implementation in the{' '}
                            <a
                                href={REPOSITORY_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-orange-400 hover:underline"
                            >
                                public GitHub repository
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            . The repository is the best source for verifying current behavior and reporting concerns.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-white mb-4">10. Policy Changes</h2>
                        <p className="text-gray-300 leading-relaxed">
                            This policy may change as APIFlow evolves. Material changes will be reflected on this
                            page by updating the date above.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">11. Contact</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            For privacy questions or requests, contact the project maintainer:
                        </p>
                        <p className="text-orange-400">
                            Email:{' '}
                            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">
                                {CONTACT_EMAIL}
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
