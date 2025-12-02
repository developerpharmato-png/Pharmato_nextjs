"use client";
import React from 'react';
import Link from 'next/link';

type Props = {
    title: string;
    subtitle?: string;
    backLabel?: string;
    addLabel?: string;
    addHref?: string;
    showBack?: boolean;
    showSearch?: boolean;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    rightNode?: React.ReactNode;
};

export default function HeaderWithAction({
    title,
    subtitle,
    backLabel = 'Back',
    addLabel = 'Add',
    addHref,
    showBack = true,
    showSearch = false,
    searchValue,
    onSearchChange,
    rightNode,
}: Props) {
    return (
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                {showBack && (
                    <button
                        onClick={() => typeof window !== 'undefined' && window.history.back()}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg shadow inline-flex items-center gap-2"
                        aria-label="Go back"
                    >
                        <span className="material-icons">arrow_back</span>
                        <span className="hidden sm:inline">{backLabel}</span>
                    </button>
                )}

                <div>
                    <h1 className="text-2xl sm:text-4xl font-bold text-gray-800">{title}</h1>
                    {subtitle && <p className="text-gray-600 hidden sm:block">{subtitle}</p>}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {showSearch && (
                    <div className="hidden sm:block">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search medicines..."
                                value={searchValue ?? ''}
                                onChange={(e) => onSearchChange?.(e.target.value)}
                                className="w-72 px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="absolute left-3 top-2.5 w-5 h-5 text-gray-400">
                                <circle cx="11" cy="11" r="8" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
                            </svg>
                            {searchValue && (
                                <button
                                    type="button"
                                    onClick={() => onSearchChange?.('')}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                    title="Clear search"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {rightNode}

                {addHref && (
                    <Link
                        href={addHref}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md flex items-center gap-2 font-medium"
                    >
                        <span className="material-icons">add</span>
                        <span className="hidden sm:inline">{addLabel}</span>
                    </Link>
                )}
            </div>
        </div>
    );
}
