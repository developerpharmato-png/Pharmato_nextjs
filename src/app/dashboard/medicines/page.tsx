"use client";
import React, { Suspense, useState } from 'react';
import MedicinesTable from './table';
import Link from 'next/link';
import HeaderWithAction from '../components/HeaderWithAction';

export default function MedicinesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    return (
        <div className="w-full min-h-screen bg-gray-50 p-0">
            <HeaderWithAction
                title="Medicines"
                subtitle="Manage your medicine inventory"
                backLabel="Back"
                addLabel="Add Medicine"
                addHref="/dashboard/medicines/new"
                showBack={false}
                showSearch
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
            />
            <div className="w-full bg-white rounded-xl shadow-md p-8">
                <Suspense fallback={
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                }>
                    <MedicinesTable searchValue={searchTerm} onSearchChange={setSearchTerm} />
                </Suspense>
            </div>
        </div>
    );
}