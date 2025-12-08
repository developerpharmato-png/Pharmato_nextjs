import React from 'react';
import { Pill, FileText, ShieldCheck, Plus, Eye, User, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    return (
        <div className="p-4 sm:p-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">
                    Welcome back
                </h1>
                <p className="text-sm sm:text-base text-gray-500">Here's what's happening with your pharmacy today</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-600 hover:shadow-md transition flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Total Medicines</p>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-800">248</p>
                        <p className="text-xs text-green-600 mt-2">↑ 12% from last month</p>
                    </div>
                    <div className="w-14 h-14 bg-green-50 rounded-lg flex items-center justify-center">
                        <Pill className="text-3xl text-green-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-600 hover:shadow-md transition flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Prescriptions</p>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-800">156</p>
                        <p className="text-xs text-blue-600 mt-2">↑ 8% from last month</p>
                    </div>
                    <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FileText className="text-3xl text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-600 hover:shadow-md transition flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Total Admins</p>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-800">12</p>
                        <p className="text-xs text-purple-600 mt-2">↑ 2 new this week</p>
                    </div>
                    <div className="w-14 h-14 bg-purple-50 rounded-lg flex items-center justify-center">
                        <ShieldCheck className="text-3xl text-purple-600" />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg sm:text-2xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Link
                        href="/dashboard/medicines/new"
                        className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition group"
                    >
                        <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white text-xl group-hover:scale-110 transition">
                            <Plus />
                        </div>
                        <div className="ml-4">
                            <p className="font-semibold text-gray-800">Adsd Medicine</p>
                            <p className="text-xs text-gray-600">Add new medicine to inventory</p>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/prescriptions"
                        className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition group"
                    >
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl group-hover:scale-110 transition">
                            <Eye />
                        </div>
                        <div className="ml-4">
                            <p className="font-semibold text-gray-800">View Prescriptions</p>
                            <p className="text-xs text-gray-600">Manage prescriptions</p>
                        </div>
                    </Link>

                    {/* Admin quick action removed per request */}

                    <Link
                        href="/dashboard/pincode"
                        className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition group"
                    >
                        <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center text-white text-xl group-hover:scale-110 transition">
                            <MapPin />
                        </div>
                        <div className="ml-4">
                            <p className="font-semibold text-gray-800">Manage Pincodes</p>
                            <p className="text-xs text-gray-600">Add, update, or delete pincodes</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}