import { Link } from 'react-router-dom';
import { ArrowLeft, Book, Code, Zap, Settings, Users, Cloud } from 'lucide-react';

export default function Documentation() {
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

                <h1 className="text-4xl font-bold text-white mb-4">Documentation</h1>
                <p className="text-gray-400 mb-8">Everything you need to know about APIFlow</p>

                <div className="prose prose-invert prose-orange max-w-none">
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                            <Zap className="h-6 w-6 text-orange-400" />
                            Getting Started
                        </h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            APIFlow is a powerful desktop application for testing and debugging APIs. Get started in minutes:
                        </p>
                        <ol className="list-decimal list-inside text-gray-300 space-y-2 ml-4">
                            <li>Download and install APIFlow for your operating system</li>
                            <li>Create an account or sign in</li>
                            <li>Create your first workspace</li>
                            <li>Start making API requests</li>
                        </ol>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                            <Book className="h-6 w-6 text-orange-400" />
                            Core Concepts
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                                <h3 className="text-xl font-semibold text-white mb-2">Workspaces</h3>
                                <p className="text-gray-300 leading-relaxed">
                                    Workspaces are containers for organizing your API projects. Each workspace can contain
                                    multiple collections, environments, and team members with different permission levels.
                                </p>
                            </div>

                            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                                <h3 className="text-xl font-semibold text-white mb-2">Collections</h3>
                                <p className="text-gray-300 leading-relaxed">
                                    Collections group related API requests together. Use them to organize requests by feature,
                                    service, or any logical grouping that makes sense for your project.
                                </p>
                            </div>

                            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                                <h3 className="text-xl font-semibold text-white mb-2">Requests</h3>
                                <p className="text-gray-300 leading-relaxed">
                                    Requests are individual API calls. Configure HTTP methods, headers, query parameters,
                                    body content, and authentication for each request.
                                </p>
                            </div>

                            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                                <h3 className="text-xl font-semibold text-white mb-2">Environments</h3>
                                <p className="text-gray-300 leading-relaxed">
                                    Environments store variables that can be reused across requests. Create separate environments
                                    for development, staging, and production to easily switch between different API endpoints.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                            <Code className="h-6 w-6 text-orange-400" />
                            Making Requests
                        </h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            APIFlow supports all standard HTTP methods:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li><span className="text-orange-400 font-semibold">GET</span> - Retrieve data from a server</li>
                            <li><span className="text-orange-400 font-semibold">POST</span> - Send data to create a resource</li>
                            <li><span className="text-orange-400 font-semibold">PUT</span> - Update an existing resource</li>
                            <li><span className="text-orange-400 font-semibold">PATCH</span> - Partially update a resource</li>
                            <li><span className="text-orange-400 font-semibold">DELETE</span> - Remove a resource</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                            <Settings className="h-6 w-6 text-orange-400" />
                            Authentication
                        </h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            APIFlow supports multiple authentication methods:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li><span className="text-orange-400 font-semibold">Bearer Token</span> - JWT and OAuth 2.0 tokens</li>
                            <li><span className="text-orange-400 font-semibold">Basic Auth</span> - Username and password</li>
                            <li><span className="text-orange-400 font-semibold">API Key</span> - Custom API keys in headers or query params</li>
                            <li><span className="text-orange-400 font-semibold">No Auth</span> - Public endpoints</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                            <Users className="h-6 w-6 text-orange-400" />
                            Collaboration
                        </h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Work together with your team:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li>Invite team members to workspaces</li>
                            <li>Assign roles (Admin, Editor, Viewer)</li>
                            <li>Share collections and requests</li>
                            <li>Sync changes across devices</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                            <Cloud className="h-6 w-6 text-orange-400" />
                            Variables & Environments
                        </h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Use variables to make your requests dynamic and reusable:
                        </p>
                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-4">
                            <code className="text-orange-400">
                                {'{{baseUrl}}/api/users/{{userId}}'}
                            </code>
                        </div>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Variables are enclosed in double curly braces and can be used in:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li>Request URLs</li>
                            <li>Headers</li>
                            <li>Query parameters</li>
                            <li>Request body</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">Keyboard Shortcuts</h2>
                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Send Request</p>
                                    <p className="text-white font-mono">Ctrl/Cmd + Enter</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">New Request</p>
                                    <p className="text-white font-mono">Ctrl/Cmd + N</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Save Request</p>
                                    <p className="text-white font-mono">Ctrl/Cmd + S</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Search</p>
                                    <p className="text-white font-mono">Ctrl/Cmd + K</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">Need More Help?</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            For more detailed documentation, tutorials, and examples:
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <a
                                href="https://github.com/vishalvishwakarma6688/desktop-application-postman"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition-all"
                            >
                                View on GitHub
                            </a>
                            <a
                                href="https://github.com/vishalvishwakarma6688/desktop-application-postman/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-all"
                            >
                                Report an Issue
                            </a>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
