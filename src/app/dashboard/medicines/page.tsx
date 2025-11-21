"use client";
import React, { Suspense } from 'react';
import MedicinesTable from './table';
import Link from 'next/link';

export default function MedicinesPage() {
    return (
        <div className="p-8">
            <button
                onClick={() => window.history.back()}
                className="mb-8 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg shadow inline-flex items-center gap-2"
            >
                <span className="text-lg">←</span> Back
            </button>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Medicines 💊</h1>
                    <p className="text-gray-600">Manage your medicine inventory</p>
                </div>
                <Link
                    href="/dashboard/medicines/new"
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
                >
                    <span className="text-xl">➕</span>
                    Add Medicine
                </Link>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
                <Suspense fallback={
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                }>
                    <MedicinesTable />
                </Suspense>
            </div>
        </div>
    );
}