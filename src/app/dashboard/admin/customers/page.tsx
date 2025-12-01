"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Suspense } from 'react';

export default function AdminCustomerListPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const itemsPerPage = 10;

    useEffect(() => {
        fetch('/api/admin/customers/list')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setCustomers(data.data || []);
                    setFilteredCustomers(data.data || []);
                    setError(null);
                } else {
                    setError(data.message || 'Failed to fetch customers');
                }
                setLoading(false);
            })
            .catch(() => {
                setError('Network error');
                setLoading(false);
            });
    }, []);
    // Filter by name only
    useEffect(() => {
        const filtered = customers.filter(c =>
            (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCustomers(filtered);
        setCurrentPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, customers]);

    // Pagination logic
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold text-green-700 mb-2 flex items-center gap-2 animate-fade-in">
                        Admin Customers <span>🧑‍💼</span> <span>💼</span>
                    </h1>
                    <p className="text-gray-600 text-lg">Manage your customer records</p>
                </div>
            </div>
            <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fade-in">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : error ? (
                    <div className="text-red-600 text-lg font-semibold">{error}</div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="flex flex-col items-center py-16">
                        <div className="text-7xl mb-4 animate-bounce">🧑‍💼</div>
                        <p className="text-gray-500 text-xl mb-2">No customers found.</p>
                        <p className="text-gray-400 text-base">Try searching by customer name.</p>
                    </div>
                ) : (
                    <>
                        {/* Search Bar Above List */}
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex-1 relative max-w-md">
                                <input
                                    type="text"
                                    placeholder="Search customers by name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                <span className="absolute left-3 top-2.5 text-gray-400 text-xl">🔍</span>
                            </div>
                            <div className="text-sm text-gray-600 ml-4">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length} customers
                                {searchTerm && (
                                    <span className="ml-2 text-green-700">(Search: "{searchTerm}")</span>
                                )}
                            </div>
                        </div>
                        {/* Customer List Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm rounded-xl overflow-hidden shadow-lg">
                                <thead className="bg-gradient-to-r from-green-100 to-blue-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">ID</th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">Name</th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">Email</th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">Mobile</th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">Wallet</th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">Active</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentCustomers.map((c, idx) => (
                                        <tr key={c._id} className={`border-b transition-all duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-green-50'} hover:bg-green-100`}>
                                            <td className="px-6 py-4 font-mono text-xs">
                                                <Link href={`/dashboard/admin/customers/${c._id}`} className="text-green-700 underline hover:text-green-900 font-semibold transition-all duration-150">{c._id}</Link>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{c.name || <span className="text-gray-400">-</span>}</td>
                                            <td className="px-6 py-4 text-gray-600">{c.email || <span className="text-gray-400">-</span>}</td>
                                            <td className="px-6 py-4 text-gray-600">{c.mobile || <span className="text-gray-400">-</span>}</td>
                                            <td className="px-6 py-4 text-green-700 font-bold">₹{c.walletAmount ?? 0}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${c.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                                                    onClick={async () => {
                                                        const res = await fetch(`/api/admin/customers/active/${c._id}`, {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ isActive: !c.isActive })
                                                        });
                                                        if (res.ok) {
                                                            setCustomers(prev => prev.map(u => u._id === c._id ? { ...u, isActive: !c.isActive } : u));
                                                            setFilteredCustomers(prev => prev.map(u => u._id === c._id ? { ...u, isActive: !c.isActive } : u));
                                                        }
                                                    }}
                                                >
                                                    <span className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300 ${c.isActive ? 'translate-x-6' : ''}`}></span>
                                                </button>
                                                <span className={`ml-2 text-xs font-mono ${c.isActive ? 'text-green-700' : 'text-gray-500'}`}>{String(c.isActive)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination Below List */}
                        <div className="mt-6 flex items-center justify-end gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Previous
                            </button>
                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${currentPage === page
                                            ? 'bg-green-600 text-white'
                                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
