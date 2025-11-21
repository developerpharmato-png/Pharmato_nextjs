"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function CategoriesPage() {
    const [seeding, setSeeding] = React.useState(false);

    const handleSeedData = async () => {
        if (!confirm('This will clear all existing categories and subcategories. Continue?')) return;

        setSeeding(true);
        try {
            const res = await fetch('/api/seed', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert(`Successfully seeded ${data.data.categories} categories and ${data.data.subcategories} subcategories!`);
                window.location.reload();
            } else {
                alert('Failed to seed data: ' + data.error);
            }
        } catch (error) {
            console.error('Seed failed:', error);
            alert('Failed to seed data');
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div className="p-6">
            <button
                onClick={() => window.history.back()}
                className="mb-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg shadow inline-flex items-center gap-2"
            >
                <span className="text-lg">←</span> Back
            </button>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Categories</h1>
                    <p className="text-gray-600 mt-1">Manage medicine categories and OTC classification</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSeedData}
                        disabled={seeding}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50"
                    >
                        {seeding ? 'Seeding...' : '🌱 Seed Dummy Data'}
                    </button>
                    <Link
                        href="/dashboard/categories/new"
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                    >
                        + Add Category
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <CategoriesTable />
            </div>
        </div>
    );
}

function CategoriesTable() {
    const [categories, setCategories] = useState<any[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOTC, setFilterOTC] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 10;

    React.useEffect(() => {
        fetchCategories();
    }, []);

    React.useEffect(() => {
        let filtered = categories;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(cat =>
                cat.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by OTC status
        if (filterOTC !== 'all') {
            filtered = filtered.filter(cat => cat.isOTC === (filterOTC === 'true'));
        }

        setFilteredCategories(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    }, [searchTerm, filterOTC, categories]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(data.data || []);
            setFilteredCategories(data.data || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            const res = await fetch(`/api/categories/${id}/toggle-status`, {
                method: 'PATCH',
            });

            if (res.ok) {
                const data = await res.json();
                fetchCategories();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to toggle category status');
            }
        } catch (error) {
            console.error('Failed to toggle category status:', error);
            alert('Failed to toggle category status');
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
    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentCategories = filteredCategories.slice(startIndex, endIndex);

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <span className="absolute left-3 top-2.5 text-gray-400 text-xl">🔍</span>
                </div>
                <select
                    value={filterOTC}
                    onChange={(e) => setFilterOTC(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                    <option value="all">All Types</option>
                    <option value="true">OTC Only</option>
                    <option value="false">Prescription Only</option>
                </select>
                <div className="text-sm text-gray-600">
                    {filteredCategories.length} categor{filteredCategories.length !== 1 ? 'ies' : 'y'}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Icon</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Description</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Type</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentCategories.map((category: any) => (
                            <tr key={category._id} className="hover:bg-green-50 transition">
                                <td className="px-4 py-3 text-2xl">{category.icon || '💊'}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{category.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{category.description}</td>
                                <td className="px-4 py-3 text-sm">
                                    {category.isOTC ? (
                                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                            🟢 OTC (Over-the-Counter)
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                            📋 Prescription Required
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <button
                                        onClick={() => handleToggleStatus(category._id)}
                                        className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                        style={{
                                            backgroundColor: category.isActive ? '#10b981' : '#d1d5db'
                                        }}
                                        title={category.isActive ? 'Click to deactivate' : 'Click to activate'}
                                    >
                                        <span
                                            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${category.isActive ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <Link
                                        href={`/dashboard/categories/edit/${category._id}`}
                                        className="text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Edit
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredCategories.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📂</div>
                        <p className="text-gray-500 text-lg">No categories found.</p>
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
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredCategories.length)} of {filteredCategories.length} categories
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
