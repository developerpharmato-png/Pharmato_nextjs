"use client";
import React, { useEffect, useState } from 'react';

type Props = {
    searchValue?: string;
    onSearchChange?: (value: string) => void;
};

export default function MedicinesTable({ searchValue, onSearchChange }: Props) {
    const [medicines, setMedicines] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [localSearch, setLocalSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [sortKey, setSortKey] = useState<string>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const itemsPerPage = 10;

    const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

    useEffect(() => {
        // initial load
        fetchMedicines(currentPage, searchValue ?? localSearch);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sorting helper
    const compare = (a: any, b: any) => {
        const dir = sortOrder === 'asc' ? 1 : -1;
        const getVal = (item: any) => {
            switch (sortKey) {
                case 'name': return item.name?.toLowerCase() ?? '';
                case 'category': return item.categoryId?.name?.toLowerCase() ?? '';
                case 'subcategory': return item.subCategoryId?.name?.toLowerCase() ?? '';
                case 'type': return (item.subCategoryId?.isOTC ?? item.categoryId?.isOTC) ? 1 : 0;
                case 'manufacturer': return item.manufacturer?.toLowerCase() ?? '';
                case 'price': return Number(item.price) ?? 0;
                case 'stock': return Number(item.stock) ?? 0;
                case 'expiry': return new Date(item.expiryDate).getTime() ?? 0;
                default: return '';
            }
        };
        const va = getVal(a);
        const vb = getVal(b);
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
    };

    // effective search value (external prop wins)
    const effectiveSearch = typeof searchValue === 'string' ? searchValue : localSearch;

    // Fetch when page or search changes (debounced for search)
    useEffect(() => {
        const debounce = setTimeout(() => {
            const pageToFetch = currentPage;
            fetchMedicines(pageToFetch, effectiveSearch);
        }, 300);
        return () => clearTimeout(debounce);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, effectiveSearch]);

    const toggleSort = (key: string) => {
        if (sortKey === key) {
            setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    const fetchMedicines = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const limit = itemsPerPage;
            const offset = (page - 1) * limit;
            const params = new URLSearchParams();
            params.set('limit', String(limit));
            params.set('offset', String(offset));
            if (search) params.set('search', search);

            const res = await fetch(`/api/medicines?${params.toString()}`);
            const data = await res.json();
            if (data && data.success) {
                setMedicines(data.data || []);
                setTotalCount(typeof data.total === 'number' ? data.total : (data.data || []).length);
            } else {
                console.error('Failed to fetch medicines:', data?.error || data);
                setMedicines([]);
                setTotalCount(0);
            }
        } catch (error) {
            console.error('Failed to fetch medicines:', error);
            setMedicines([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + medicines.length;
    const currentMedicines = medicines;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">

            {/* Desktop Table (hidden on small screens) */}
            <div className="overflow-x-auto hidden md:block">
                <table className="min-w-full border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">ID</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Image</th>
                            <th onClick={() => toggleSort('name')} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200 cursor-pointer select-none">Name {sortKey === 'name' ? (sortOrder === 'asc' ? <span className="material-icons text-xs align-middle">arrow_upward</span> : <span className="material-icons text-xs align-middle">arrow_downward</span>) : ''}</th>
                            <th onClick={() => toggleSort('category')} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200 cursor-pointer select-none">Category {sortKey === 'category' ? (sortOrder === 'asc' ? <span className="material-icons text-xs align-middle">arrow_upward</span> : <span className="material-icons text-xs align-middle">arrow_downward</span>) : ''}</th>
                            <th onClick={() => toggleSort('subcategory')} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200 cursor-pointer select-none">Subcategory {sortKey === 'subcategory' ? (sortOrder === 'asc' ? <span className="material-icons text-xs align-middle">arrow_upward</span> : <span className="material-icons text-xs align-middle">arrow_downward</span>) : ''}</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Prescription</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">OTC</th>
                            <th onClick={() => toggleSort('manufacturer')} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200 cursor-pointer select-none">Manufacturer {sortKey === 'manufacturer' ? (sortOrder === 'asc' ? <span className="material-icons text-xs align-middle">arrow_upward</span> : <span className="material-icons text-xs align-middle">arrow_downward</span>) : ''}</th>
                            <th onClick={() => toggleSort('price')} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200 cursor-pointer select-none">Price {sortKey === 'price' ? (sortOrder === 'asc' ? <span className="material-icons text-xs align-middle">arrow_upward</span> : <span className="material-icons text-xs align-middle">arrow_downward</span>) : ''}</th>
                            <th onClick={() => toggleSort('stock')} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200 cursor-pointer select-none">Stock {sortKey === 'stock' ? (sortOrder === 'asc' ? <span className="material-icons text-xs align-middle">arrow_upward</span> : <span className="material-icons text-xs align-middle">arrow_downward</span>) : ''}</th>
                            <th onClick={() => toggleSort('expiry')} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200 cursor-pointer select-none">Expiry {sortKey === 'expiry' ? (sortOrder === 'asc' ? <span className="material-icons text-xs align-middle">arrow_upward</span> : <span className="material-icons text-xs align-middle">arrow_downward</span>) : ''}</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Highlights</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Rating</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentMedicines.map((medicine: any) => (
                            <tr key={medicine._id} className="hover:bg-green-50 transition">
                                <td className="px-4 py-3 text-xs font-mono">
                                    <a href={`/dashboard/medicines/${medicine._id}`} className="text-green-700 underline hover:text-green-900">
                                        {medicine._id}
                                    </a>
                                </td>
                                <td className="px-4 py-3">
                                    {medicine.images && medicine.images.length > 0 ? (
                                        <img src={medicine.images[0]} alt={medicine.name} className="h-10 w-10 object-cover rounded" />
                                    ) : (
                                        <span className="inline-block h-10 w-10 bg-gray-200 rounded text-gray-400 flex items-center justify-center">
                                            <span className="material-icons">medication</span>
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{medicine.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                        {medicine.categoryId?.name || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                        {medicine.subCategoryId?.name || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {medicine.isPrescription ? (
                                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">Yes</span>
                                    ) : (
                                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">No</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {medicine.isOTC ? (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">OTC</span>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{medicine.manufacturer}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{inr.format(Number(medicine.price) || 0)}</td>
                                <td className="px-4 py-3 text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${medicine.stock > 50 ? 'bg-green-100 text-green-800' :
                                        medicine.stock > 20 ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                        {medicine.stock} units
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {new Date(medicine.expiryDate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {medicine.highlights && medicine.highlights.length > 0 ? (
                                        <span>{medicine.highlights.join(', ')}</span>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm text-yellow-600 font-semibold">
                                    {medicine.rating && medicine.rating.average > 0 ? (
                                        <span className="inline-flex items-center gap-1"><span className="material-icons text-yellow-600 text-base">star</span> {medicine.rating.average.toFixed(1)} <span className="text-gray-400 text-xs">({medicine.rating.count})</span></span>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {currentMedicines.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4"><span className="material-icons">medication</span></div>
                        <p className="text-gray-500 text-lg">No medicines found.</p>
                        {effectiveSearch && (
                            <p className="text-gray-400 text-sm mt-2">Try adjusting your search term</p>
                        )}
                    </div>
                )}
            </div>

            {/* Mobile cards (visible on small screens) */}
            <div className="space-y-3 md:hidden">
                {currentMedicines.map((medicine: any) => (
                    <div key={medicine._id} className="bg-white border rounded-lg p-3 shadow-sm flex items-start gap-3">
                        <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                            {medicine.images && medicine.images.length > 0 ? (
                                <img src={medicine.images[0]} alt={medicine.name} className="h-full w-full object-cover" />
                            ) : (
                                <span className="material-icons text-gray-400">medication</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <a href={`/dashboard/medicines/${medicine._id}`} className="text-sm font-semibold text-gray-900 hover:underline">{medicine.name}</a>
                            <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-2">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">{medicine.categoryId?.name || 'N/A'}</span>
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">{medicine.subCategoryId?.name || 'N/A'}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                                <div className="text-sm font-semibold text-gray-900">{inr.format(Number(medicine.price) || 0)}</div>
                                <div className={`text-xs px-2 py-1 rounded-full ${medicine.stock > 50 ? 'bg-green-100 text-green-800' : medicine.stock > 20 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{medicine.stock} units</div>
                            </div>
                            <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
                                <div className="inline-flex items-center gap-1"><span className="material-icons text-base text-yellow-600">star</span> {medicine.rating?.average ? medicine.rating.average.toFixed(1) : '-'}</div>
                                <div className="inline-flex items-center gap-1"><span className="material-icons text-base">event</span> <span className="text-xs">{new Date(medicine.expiryDate).toLocaleDateString()}</span></div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 items-center">
                            <a href={`/dashboard/medicines/${medicine._id}`} className="p-2 rounded hover:bg-gray-100 text-gray-600" title="View"><span className="material-icons">visibility</span></a>
                            <a href={`/dashboard/medicines/${medicine._id}/edit`} className="p-2 rounded hover:bg-gray-100 text-gray-600" title="Edit"><span className="material-icons">edit</span></a>
                        </div>
                    </div>
                ))}

                {currentMedicines.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4"><span className="material-icons">medication</span></div>
                        <p className="text-gray-500 text-lg">No medicines found.</p>
                        {effectiveSearch && (
                            <p className="text-gray-400 text-sm mt-2">Try adjusting your search term</p>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(startIndex + endIndex, totalCount)} of {totalCount} medicines
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <span className="material-icons align-middle">chevron_left</span>
                            <span className="sr-only">Previous</span>
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
                            <span className="material-icons align-middle">chevron_right</span>
                            <span className="sr-only">Next</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}