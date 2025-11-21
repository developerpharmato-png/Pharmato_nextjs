import React from 'react';
import Link from 'next/link';

export default function DashboardPage() {
    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                    Welcome back! 👋
                </h1>
                <p className="text-gray-600">Here's what's happening with your pharmacy today.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3 mb-8">
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600 hover:shadow-lg transition">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Medicines</p>
                            <p className="text-3xl font-bold text-gray-800">248</p>
                            <p className="text-xs text-green-600 mt-2">↑ 12% from last month</p>
                        </div>
                        <div className="text-5xl">💊</div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600 hover:shadow-lg transition">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Prescriptions</p>
                            <p className="text-3xl font-bold text-gray-800">156</p>
                            <p className="text-xs text-blue-600 mt-2">↑ 8% from last month</p>
                        </div>
                        <div className="text-5xl">📋</div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-600 hover:shadow-lg transition">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Admins</p>
                            <p className="text-3xl font-bold text-gray-800">12</p>
                            <p className="text-xs text-purple-600 mt-2">↑ 2 new this week</p>
                        </div>
                        <div className="text-5xl">👥</div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    <Link
                        href="/dashboard/medicines/new"
                        className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition group"
                    >
                        <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white text-2xl group-hover:scale-110 transition">
                            ➕
                        </div>
                        <div className="ml-4">
                            <p className="font-semibold text-gray-800">Add Medicine</p>
                            <p className="text-xs text-gray-600">Add new medicine to inventory</p>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/prescriptions"
                        className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition group"
                    >
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-2xl group-hover:scale-110 transition">
                            📝
                        </div>
                        <div className="ml-4">
                            <p className="font-semibold text-gray-800">View Prescriptions</p>
                            <p className="text-xs text-gray-600">Manage prescriptions</p>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/admins"
                        className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition group"
                    >
                        <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white text-2xl group-hover:scale-110 transition">
                            👤
                        </div>
                        <div className="ml-4">
                            <p className="font-semibold text-gray-800">Manage Admins</p>
                            <p className="text-xs text-gray-600">View and edit admin accounts</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}