"use client";
import React, { useEffect, useState } from 'react';

export default function MedicinesTable() {
    const [medicines, setMedicines] = useState<any[]>([]);
    const [filteredMedicines, setFilteredMedicines] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [sortKey, setSortKey] = useState<string>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const itemsPerPage = 10;

    const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

    useEffect(() => {
        fetchMedicines();
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

    useEffect(() => {
        const filtered = medicines.filter(medicine =>
            medicine.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const sorted = filtered.slice().sort(compare);
        setFilteredMedicines(sorted);
        setCurrentPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, medicines, sortKey, sortOrder]);

    const toggleSort = (key: string) => {
        if (sortKey === key) {
            setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    const fetchMedicines = async () => {
        try {
            const res = await fetch('/api/medicines');
            const data = await res.json();
            setMedicines(data.data || []);
            setFilteredMedicines(data.data || []);
        } catch (error) {
            console.error('Failed to fetch medicines:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentMedicines = filteredMedicines.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Search medicines by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <span className="absolute left-3 top-2.5 text-gray-400 text-xl">🔍</span>
                </div>
                <div className="text-sm text-gray-600">
                    {filteredMedicines.length} medicine{filteredMedicines.length !== 1 ? 's' : ''} found
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">ID</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Image</th>
                            <th onClick={() => toggleSort('name')} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200 cursor-pointer select-none">Name {sortKey === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                            <th onClick={() => toggleSort('category')} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200 cursor-pointer select-none">Category {sortKey === 'category' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                            <th onClick={() => toggleSort('subcategory')} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200 cursor-pointer select-none">Subcategory {sortKey === 'subcategory' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Prescription</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">OTC</th>
                            <th onClick={() => toggleSort('manufacturer')} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200 cursor-pointer select-none">Manufacturer {sortKey === 'manufacturer' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                            <th onClick={() => toggleSort('price')} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200 cursor-pointer select-none">Price {sortKey === 'price' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                            <th onClick={() => toggleSort('stock')} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200 cursor-pointer select-none">Stock {sortKey === 'stock' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                            <th onClick={() => toggleSort('expiry')} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200 cursor-pointer select-none">Expiry {sortKey === 'expiry' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</th>
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
                                            💊
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
                                        <span>⭐ {medicine.rating.average.toFixed(1)} ({medicine.rating.count})</span>
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
                        <div className="text-6xl mb-4">💊</div>
                        <p className="text-gray-500 text-lg">No medicines found.</p>
                        {searchTerm && (
                            <p className="text-gray-400 text-sm mt-2">Try adjusting your search term</p>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredMedicines.length)} of {filteredMedicines.length} medicines
                    </div>
                    <div className="flex gap-2">
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
                </div>
            )}
        </div>
    );
}