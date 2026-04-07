"use client";
import React, { useState, useRef, useEffect } from "react";

interface PolicyExpandableProps {
    htmlContent: string;
    title: string;
    maxHeight?: number;
}

export const PolicyExpandable: React.FC<PolicyExpandableProps> = ({
    htmlContent,
    title,
    maxHeight = 150,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showButton, setShowButton] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            setShowButton(contentRef.current.scrollHeight > maxHeight);
        }
    }, [htmlContent, maxHeight]);

    if (!htmlContent) return null;

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">

                {title}
            </h3>

            <div className="relative">
                <div
                    ref={contentRef}
                    style={{
                        maxHeight: isExpanded ? "none" : `${maxHeight}px`,
                        overflow: "hidden"
                    }}
                    className={`text-sm text-gray-600 leading-relaxed policy-content transition-all duration-500 ease-in-out`}
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
                <style jsx global>{`
                    .policy-content h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #111827; }
                    .policy-content h2 { font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.75rem; color: #1f2937; }
                    .policy-content h3 { font-size: 1.125rem; font-weight: 600; margin: 1.25rem 0 0.5rem; color: #374151; }
                    .policy-content p { margin-bottom: 1rem; }
                    .policy-content ul, .policy-content ol { margin: 0 0 1rem 1.5rem; }
                    .policy-content li { margin-bottom: 0.5rem; }
                    .policy-content blockquote { border-left: 4px solid #e5e7eb; padding-left: 1rem; margin: 1rem 0; font-style: italic; color: #4b5563; }
                    .policy-content strong { font-weight: 700; color: #111827; }
                    .policy-content a { color: #059669; text-decoration: underline; }
                `}</style>

                {!isExpanded && showButton && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                )}
            </div>

            {showButton && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-4 self-start text-green-600 hover:text-green-700 font-bold text-xs uppercase tracking-widest flex items-center gap-1 transition-all group"
                >
                    {isExpanded ? (
                        <>
                            <span className="material-icons text-sm transform group-hover:-translate-y-0.5 transition-transform"> Show Less </span>
                        </>
                    ) : (
                        <>
                            <span className="material-icons text-sm transform group-hover:translate-y-0.5 transition-transform"> Read More</span>
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

export default PolicyExpandable;
