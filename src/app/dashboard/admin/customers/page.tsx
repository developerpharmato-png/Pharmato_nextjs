"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import HeaderWithAction from '../../components/HeaderWithAction';
import Swal from 'sweetalert2';

type Customer = {
    _id: string;
    name?: string;
    email?: string;
    mobile?: string;
    countryCode?: string;
    walletAmount?: number;
    isActive: boolean;
};

export default function AdminCustomerListPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const itemsPerPage = 10;

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        fetch('/api/admin/customers/list')
            .then(res => res.json())
            .then(data => {
                if (!mounted) return;
                if (data.success) {
                    setCustomers(data.data || []);
                    setError(null);
                } else {
                    setError(data.message || 'Failed to fetch customers');
                    Swal.fire({ icon: 'error', title: 'Load failed', text: data.message || 'Failed to fetch customers' });
                }
                setLoading(false);
            })
            .catch(() => {
                if (!mounted) return;
                setError('Network error');
                setLoading(false);
                Swal.fire({ icon: 'error', title: 'Network error', text: 'Unable to fetch customers' });
            });
        return () => { mounted = false; };
    }, []);

    // Multi-field search via memo (name, email, mobile)
    const filteredCustomers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return customers;
        return customers.filter(c => {
            const name = (c.name || '').toLowerCase();
            const email = (c.email || '').toLowerCase();
            const mobile = (c.mobile || '').toLowerCase();
            return name.includes(term) || email.includes(term) || mobile.includes(term);
        });
    }, [searchTerm, customers]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Pagination logic
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

    return (
        <div className="p-8">
            <div className="mb-8">
                <HeaderWithAction
                    title="Admin Customers"
                    subtitle="Manage your customer records"
                    showBack={false}
                    showSearch={false}
                />
            </div>
            <div className="bg-white rounded-xl shadow-md p-8">
            

                 {/* Search Bar Above List */}
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex-1  max-w-md">
                                <input
                                    type="text"
                                    placeholder="Search by name, email or mobile..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    aria-label="Search customers"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" aria-hidden="true">
                                    <circle cx="11" cy="11" r="8" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
                                </svg>
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                        title="Clear search"
                                        aria-label="Clear search"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            <div className="text-sm text-gray-600 ml-4">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length} customers
                                {searchTerm && (
                                    <span className="ml-2 text-green-700">(Search: "{searchTerm}")</span>
                                )}
                            </div>
                        </div>


                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="rounded-full h-12 w-12 border-2 border-gray-300 border-t-green-600 animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="text-red-600 text-lg font-semibold">{error}</div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="flex flex-col items-center py-16">
                        <p className="text-gray-500 text-xl mb-2">No customers found.</p>
                        <p className="text-gray-400 text-base">Try searching by customer name.</p>
                    </div>
                ) : (
                    <>
                       
                        {/* Customer List Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm rounded-xl overflow-hidden shadow">
                                <thead className="bg-gray-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Mobile</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Wallet</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Active</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentCustomers.map((c, idx) => (
                                        <tr key={c._id} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                                            <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" title={c._id}>
                                                <Link href={`/dashboard/admin/customers/${c._id}`} className="text-green-700 underline hover:text-green-900 font-semibold">{c._id}</Link>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[220px]">{c.name || <span className="text-gray-400">-</span>}</td>
                                            <td className="px-4 py-3 text-gray-600 truncate max-w-[240px]">{c.email || <span className="text-gray-400">-</span>}</td>
                                            <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]">
                                                {c.mobile
                                                    ? `${c.countryCode ? c.countryCode : ''} ${c.mobile}`.trim()
                                                    : <span className="text-gray-400">-</span>}
                                            </td>
                                            <td className="px-4 py-3 text-green-700 font-bold">₹{(c.walletAmount ?? 0).toFixed(2)}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    aria-label={c.isActive ? 'Deactivate customer' : 'Activate customer'}
                                                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${c.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                                                    onClick={async () => {
                                                        const actionText = c.isActive ? 'deactivate' : 'activate';
                                                        const confirm = await Swal.fire({
                                                            icon: 'question',
                                                            title: `Confirm ${actionText}`,
                                                            text: `Are you sure you want to ${actionText} this customer?`,
                                                            showCancelButton: true,
                                                            confirmButtonColor: '#16a34a',
                                                            cancelButtonColor: '#6b7280',
                                                            confirmButtonText: 'Yes',
                                                        });
                                                        if (!confirm.isConfirmed) return;
                                                        const res = await fetch(`/api/admin/customers/active/${c._id}`, {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ isActive: !c.isActive })
                                                        });
                                                        if (res.ok) {
                                                            setCustomers(prev => prev.map(u => u._id === c._id ? { ...u, isActive: !c.isActive } : u));
                                                            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Customer ${c.isActive ? 'deactivated' : 'activated'}`, showConfirmButton: false, timer: 2000 });
                                                        } else {
                                                            Swal.fire({ icon: 'error', title: 'Update failed', text: 'Unable to change status' });
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
