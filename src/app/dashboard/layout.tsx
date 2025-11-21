"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [admin, setAdmin] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const adminData = localStorage.getItem('admin');
        if (!adminData) {
            router.push('/login');
        } else {
            setAdmin(JSON.parse(adminData));
            setLoading(false);
        }
    }, [router]);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            localStorage.removeItem('admin');
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: '📊' },
        { name: 'Medicines', path: '/dashboard/medicines', icon: '💊' },
        { name: 'Categories', path: '/dashboard/categories', icon: '📂' },
        { name: 'Subcategories', path: '/dashboard/subcategories', icon: '📁' },
        { name: 'Prescriptions', path: '/dashboard/prescriptions', icon: '📋' },
        { name: 'Admins', path: '/dashboard/admins', icon: '👥' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-green-50 to-teal-50">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 ease-in-out flex-shrink-0`}>
                <div className="flex flex-col h-full">
                    {/* Logo/Brand */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            {sidebarOpen && (
                                <div>
                                    <h1 className="text-2xl font-bold text-green-600">Pharmato</h1>
                                    <p className="text-xs text-gray-500">Medicine Management</p>
                                </div>
                            )}
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="text-gray-500 hover:text-green-600 transition"
                            >
                                {sidebarOpen ? '◀' : '▶'}
                            </button>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`flex items-center px-4 py-3 rounded-lg transition-all ${isActive
                                        ? 'bg-green-600 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                                        }`}
                                >
                                    <span className="text-2xl">{item.icon}</span>
                                    {sidebarOpen && (
                                        <span className="ml-3 font-medium">{item.name}</span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile & Logout */}
                    <div className="p-4 border-t border-gray-200">
                        <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'} mb-3`}>
                            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                {admin?.name?.charAt(0).toUpperCase()}
                            </div>
                            {sidebarOpen && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{admin?.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{admin?.email}</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleLogout}
                            className={`w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition ${!sidebarOpen ? 'text-xs' : ''
                                }`}
                        >
                            {sidebarOpen ? 'Logout' : '🚪'}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
