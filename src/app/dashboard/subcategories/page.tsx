"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function SubCategoriesPage() {
    return (
        <div className="w-full min-h-screen bg-gray-50 py-8 px-2 sm:px-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Subcategories</h1>
                        <p className="text-gray-500 mt-1">Manage medicine subcategories and OTC classification</p>
                    </div>
                    <Link
                        href="/dashboard/subcategories/new"
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                    >
                        + Add Subcategory
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <SubCategoriesTable />
                </div>
            </div>
        </div>
    );
}

function SubCategoriesTable() {
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [filteredSubcategories, setFilteredSubcategories] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterOTC, setFilterOTC] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 10;

    React.useEffect(() => {
        fetchData();
    }, []);

    React.useEffect(() => {
        let filtered = subcategories;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(sub =>
                sub.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by category
        if (filterCategory !== 'all') {
            filtered = filtered.filter(sub => sub.categoryId?._id === filterCategory);
        }

        // Filter by OTC status
        if (filterOTC !== 'all') {
            filtered = filtered.filter(sub => sub.isOTC === (filterOTC === 'true'));
        }

        setFilteredSubcategories(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    }, [searchTerm, filterCategory, filterOTC, subcategories]);

    const fetchData = async () => {
        try {
            const [subRes, catRes] = await Promise.all([
                fetch('/api/subcategories'),
                fetch('/api/categories'),
            ]);

            const subData = await subRes.json();
            const catData = await catRes.json();

            setSubcategories(subData.data || []);
            setFilteredSubcategories(subData.data || []);
            setCategories(catData.data || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            const res = await fetch(`/api/subcategories/${id}/toggle-status`, {
                method: 'PATCH',
            });

            if (res.ok) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Status updated',
                    showConfirmButton: false,
                    timer: 2000
                });
                fetchData();
            } else {
                const data = await res.json();
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to toggle status',
                    text: data.error || 'Failed to toggle subcategory status',
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Failed to toggle status',
                text: 'Network error',
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    // Pagination calculations
    const totalPages = Math.ceil(filteredSubcategories.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentSubcategories = filteredSubcategories.slice(startIndex, endIndex);

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px] relative">
                    <input
                        type="text"
                        placeholder="Search subcategories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="absolute left-3 top-2.5 w-5 h-5 text-gray-400">
                        <circle cx="11" cy="11" r="8" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
                    </svg>
                </div>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                </select>
                <select
                    value={filterOTC}
                    onChange={(e) => setFilterOTC(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                    <option value="all">All Types</option>
                    <option value="true">OTC Only</option>
                    <option value="false">Non OTC Only</option>
                </select>
                <div className="text-sm text-gray-600">
                    {filteredSubcategories.length} subcategor{filteredSubcategories.length !== 1 ? 'ies' : 'y'}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Description</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Category</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">OTC</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentSubcategories.map((subcategory: any) => (
                            <tr key={subcategory._id} className="hover:bg-green-50 transition">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {Array.isArray(subcategory.images) && subcategory.images[0] ? (
                                        <img src={subcategory.images[0]} alt="Subcategory" style={{ width: 32, height: 32, display: 'inline', marginRight: 8, verticalAlign: 'middle', borderRadius: '6px' }} />
                                    ) : null}
                                    {subcategory.name}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{subcategory.description}</td>
                                <td className="px-4 py-3 text-sm">
                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                        {subcategory.categoryId?.name || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {subcategory.isOTC ? (
                                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Yes</span>
                                    ) : (
                                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">No</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <button
                                        onClick={() => handleToggleStatus(subcategory._id)}
                                        className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                        style={{
                                            backgroundColor: subcategory.isActive ? '#10b981' : '#d1d5db'
                                        }}
                                        title={subcategory.isActive ? 'Click to deactivate' : 'Click to activate'}
                                    >
                                        <span
                                            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${subcategory.isActive ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <Link
                                        href={`/dashboard/subcategories/edit/${subcategory._id}`}
                                        className="text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Edit
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredSubcategories.length === 0 && (
                    <div className="text-center py-12">
                        <div className="flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 text-gray-300">
                                <rect x="3" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 5 9-5" />
                            </svg>
                        </div>
                        <p className="text-gray-500 text-lg">No subcategories found.</p>
                        {searchTerm && (
                            <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredSubcategories.length)} of {filteredSubcategories.length} subcategories
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
