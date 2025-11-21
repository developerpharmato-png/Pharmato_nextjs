import React, { Suspense } from 'react';
import AdminsTable from './table';

export default function AdminsPage() {
    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Admins 👥</h1>
                <p className="text-gray-600">Manage admin accounts and permissions</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
                <Suspense fallback={
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                }>
                    <AdminsTable />
                </Suspense>
            </div>
        </div>
    );
}
