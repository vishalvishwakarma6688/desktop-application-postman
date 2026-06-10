import { ChevronDown, ExternalLink, ShieldCheck } from 'lucide-react';

const RELEASES_URL = 'https://github.com/vishalvishwakarma6688/desktop-application-postman/releases';

interface CodeSigningNoticeProps {
    scrolled: boolean;
}

export default function CodeSigningNotice({ scrolled }: CodeSigningNoticeProps) {
    return (
        <aside
            aria-label="Windows download security notice"
            className={`border-b border-amber-400/20 text-amber-50 transition-all duration-300 ${scrolled ? 'bg-gray-950/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400/10 ring-1 ring-amber-400/30">
                        <ShieldCheck className="h-4 w-4 text-amber-300" aria-hidden="true" />
                    </div>

                    <div className="min-w-0 flex-1 text-xs leading-relaxed">
                        <p className="text-gray-300">
                            <span className="font-semibold text-amber-300">A quick note for Windows users:</span>{' '}
                            APIFlow is an independent, open-source project and does not yet have a paid
                            code-signing certificate. Because of this, Microsoft Defender SmartScreen may
                            display an &quot;Unknown publisher&quot; message. This warning is expected for
                            the current Windows installer.
                        </p>

                        <details className="group mt-1.5">
                            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-sm font-semibold text-amber-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
                                How to download and continue safely
                                <ChevronDown
                                    className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
                                    aria-hidden="true"
                                />
                            </summary>

                            <div className="mt-2 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-gray-300">
                                <ol className="list-decimal space-y-1 pl-4 marker:font-semibold marker:text-amber-300">
                                    <li>
                                        Download the installer only from our{' '}
                                        <a
                                            href={RELEASES_URL}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 rounded-sm font-semibold text-amber-300 underline decoration-amber-400/50 underline-offset-2 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                                        >
                                            official GitHub releases
                                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                                        </a>
                                        .
                                    </li>
                                    <li>
                                        When SmartScreen appears, select <strong className="text-white">More info</strong>.
                                    </li>
                                    <li>
                                        After confirming the installer came from the official release page,
                                        select <strong className="text-white">Run anyway</strong> to continue.
                                    </li>
                                </ol>
                                <p className="mt-2 text-gray-400">
                                    Please do not continue if you downloaded the installer from another website
                                    or do not trust its source.
                                </p>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        </aside>
    );
}
