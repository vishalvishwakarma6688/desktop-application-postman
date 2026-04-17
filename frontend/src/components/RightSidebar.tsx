import { useState } from 'react';
import { X, Copy, Check, Settings, Cookie } from 'lucide-react';
import { Request } from '@/types';
import { generateCodeSnippet, type CodeLanguage } from '@/utils/codeGenerator';
import toast from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    activeTab: 'code' | 'cookies' | 'settings';
    request: Request | null;
}

const CODE_LANGUAGES: { value: CodeLanguage; label: string }[] = [
    { value: 'curl', label: 'cURL' },
    { value: 'javascript', label: 'JavaScript - Fetch' },
    { value: 'nodejs', label: 'Node.js - HTTPS' },
    { value: 'python', label: 'Python - Requests' },
    { value: 'php', label: 'PHP - cURL' },
];

export default function RightSidebar({ isOpen, onClose, activeTab, request }: Props) {
    const [selectedLanguage, setSelectedLanguage] = useState<CodeLanguage>('curl');
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!request) return;
        const code = generateCodeSnippet(request, selectedLanguage);
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            toast.success('Code copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const getCodeSnippet = () => {
        if (!request) return '';
        return generateCodeSnippet(request, selectedLanguage);
    };

    if (!isOpen) return null;

    return (
        <div className="w-96 bg-gray-900 border-l border-gray-800 shadow-2xl flex flex-col">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
                <h2 className="text-sm font-semibold text-gray-200">
                    {activeTab === 'code' && 'Code Snippet'}
                    {activeTab === 'cookies' && 'Cookies'}
                    {activeTab === 'settings' && 'Settings'}
                </h2>
                <button
                    onClick={onClose}
                    className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {activeTab === 'code' && (
                    <>
                        {/* Language Selector */}
                        <div className="px-4 py-3 border-b border-gray-800 shrink-0">
                            <label className="block text-xs font-medium text-gray-400 mb-2">Language</label>
                            <select
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value as CodeLanguage)}
                                className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                            >
                                {CODE_LANGUAGES.map((lang) => (
                                    <option key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Code Display */}
                        <div className="flex-1 overflow-auto p-4">
                            <div className="relative">
                                <pre className="text-xs font-mono text-gray-300 bg-gray-950 rounded-lg p-4 overflow-x-auto">
                                    <code>{getCodeSnippet()}</code>
                                </pre>
                                <button
                                    onClick={handleCopy}
                                    className="absolute top-2 right-2 flex items-center gap-1.5 rounded bg-gray-800 hover:bg-gray-700 px-3 py-1.5 text-xs text-gray-300 transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="h-3.5 w-3.5 text-green-400" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3.5 w-3.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'cookies' && (
                    <div className="flex-1 flex items-center justify-center p-4">
                        <div className="text-center">
                            <Cookie className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">Cookies management coming soon</p>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="flex-1 flex items-center justify-center p-4">
                        <div className="text-center">
                            <Settings className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">Settings coming soon</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
