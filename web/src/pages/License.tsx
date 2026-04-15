import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function License() {
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

                <h1 className="text-4xl font-bold text-white mb-4">MIT License</h1>
                <p className="text-gray-400 mb-8">APIFlow is open-source software</p>

                <div className="prose prose-invert prose-orange max-w-none">
                    <section className="mb-8">
                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                            <p className="text-gray-300 leading-relaxed mb-4">
                                Copyright (c) {new Date().getFullYear()} APIFlow Contributors
                            </p>
                            <p className="text-gray-300 leading-relaxed mb-4">
                                Permission is hereby granted, free of charge, to any person obtaining a copy
                                of this software and associated documentation files (the "Software"), to deal
                                in the Software without restriction, including without limitation the rights
                                to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                                copies of the Software, and to permit persons to whom the Software is
                                furnished to do so, subject to the following conditions:
                            </p>
                            <p className="text-gray-300 leading-relaxed mb-4">
                                The above copyright notice and this permission notice shall be included in all
                                copies or substantial portions of the Software.
                            </p>
                            <p className="text-gray-300 leading-relaxed">
                                THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                                IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                                FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                                AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                                LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                                OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                                SOFTWARE.
                            </p>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">What This Means</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            The MIT License is a permissive open-source license that allows you to:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li>Use the software for any purpose, including commercial applications</li>
                            <li>Modify the source code to suit your needs</li>
                            <li>Distribute copies of the original or modified software</li>
                            <li>Sublicense the software to others</li>
                            <li>Sell copies of the software</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">Requirements</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            The only requirement is that you include the original copyright notice and license text
                            in any copies or substantial portions of the software.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">No Warranty</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            The software is provided "as is" without any warranty. The authors are not liable for any
                            damages or issues that may arise from using the software.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Licenses</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            APIFlow uses various open-source libraries and dependencies, each with their own licenses.
                            These include but are not limited to:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li>React (MIT License)</li>
                            <li>Electron (MIT License)</li>
                            <li>Express.js (MIT License)</li>
                            <li>MongoDB (Server Side Public License)</li>
                            <li>Tailwind CSS (MIT License)</li>
                        </ul>
                        <p className="text-gray-300 leading-relaxed mt-4">
                            For a complete list of dependencies and their licenses, please refer to the package.json
                            files in the source code repository.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">Contributing</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            By contributing to APIFlow, you agree that your contributions will be licensed under the same MIT License.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">Questions?</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            If you have questions about the license, please contact us at:
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
