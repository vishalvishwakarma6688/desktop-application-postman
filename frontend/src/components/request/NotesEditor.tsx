import { useState, useEffect } from 'react';
import { FileText, Eye, Edit3, Save, X } from 'lucide-react';

interface Props {
    notes?: string;
    onChange: (notes: string) => void;
}

export default function NotesEditor({ notes = '', onChange }: Props) {
    const [value, setValue] = useState(notes);
    const [isPreview, setIsPreview] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setValue(notes);
        setHasChanges(false);
    }, [notes]);

    const handleSave = () => {
        onChange(value);
        setHasChanges(false);
    };

    const handleCancel = () => {
        setValue(notes);
        setHasChanges(false);
    };

    const handleChange = (newValue: string) => {
        setValue(newValue);
        setHasChanges(newValue !== notes);
    };

    // Simple markdown preview renderer
    const renderMarkdown = (text: string) => {
        if (!text) return <p className="text-gray-500 italic">No notes added yet.</p>;

        return text.split('\n').map((line, i) => {
            // Headers
            if (line.startsWith('# ')) {
                return <h1 key={i} className="text-2xl font-bold text-white mt-4 mb-2">{line.slice(2)}</h1>;
            }
            if (line.startsWith('## ')) {
                return <h2 key={i} className="text-xl font-bold text-white mt-3 mb-2">{line.slice(3)}</h2>;
            }
            if (line.startsWith('### ')) {
                return <h3 key={i} className="text-lg font-semibold text-white mt-2 mb-1">{line.slice(4)}</h3>;
            }

            // Code blocks (inline)
            if (line.includes('`')) {
                const parts = line.split('`');
                return (
                    <p key={i} className="text-gray-300 mb-2">
                        {parts.map((part, j) =>
                            j % 2 === 0 ? (
                                part
                            ) : (
                                <code key={j} className="bg-gray-800 text-orange-400 px-1.5 py-0.5 rounded text-sm font-mono">
                                    {part}
                                </code>
                            )
                        )}
                    </p>
                );
            }

            // Lists
            if (line.startsWith('- ') || line.startsWith('* ')) {
                return (
                    <li key={i} className="text-gray-300 ml-4 mb-1">
                        {line.slice(2)}
                    </li>
                );
            }

            // Bold/Italic (simplified)
            if (line.includes('**')) {
                const parts = line.split('**');
                return (
                    <p key={i} className="text-gray-300 mb-2">
                        {parts.map((part, j) =>
                            j % 2 === 0 ? part : <strong key={j} className="font-semibold text-white">{part}</strong>
                        )}
                    </p>
                );
            }

            // Regular paragraph
            return line ? <p key={i} className="text-gray-300 mb-2">{line}</p> : <br key={i} />;
        });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-gray-800/30">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-300">Request Notes</h3>
                    <span className="text-xs text-gray-500">• Markdown supported</span>
                </div>
                <div className="flex items-center gap-2">
                    {hasChanges && (
                        <>
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                            >
                                <Save className="h-3.5 w-3.5" />
                                Save
                            </button>
                        </>
                    )}
                    <div className="flex rounded-lg bg-gray-700/50 p-0.5">
                        <button
                            onClick={() => setIsPreview(false)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${!isPreview
                                    ? 'bg-gray-800 text-white'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                        </button>
                        <button
                            onClick={() => setIsPreview(true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${isPreview
                                    ? 'bg-gray-800 text-white'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Eye className="h-3.5 w-3.5" />
                            Preview
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                {isPreview ? (
                    <div className="p-6 prose prose-invert prose-sm max-w-none">
                        {renderMarkdown(value)}
                        {!value && (
                            <div className="text-center py-12">
                                <FileText className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                                <p className="text-gray-500 mb-2">No notes added yet</p>
                                <p className="text-xs text-gray-600">
                                    Click "Edit" to add notes or documentation for this request
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-4">
                        <textarea
                            value={value}
                            onChange={(e) => handleChange(e.target.value)}
                            placeholder="# Request Documentation&#10;&#10;Add notes, usage examples, or any documentation here...&#10;&#10;## Markdown Support&#10;- **Bold text** with **double asterisks**&#10;- `Inline code` with backticks&#10;- Lists with dashes&#10;&#10;### Example&#10;This endpoint returns user information."
                            className="w-full h-full min-h-[400px] bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-300 font-mono focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 resize-none"
                        />
                        <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-gray-600">
                                Supports: # Headers, **bold**, `code`, - lists
                            </span>
                            <span className="text-gray-600">
                                {value.length} characters
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
