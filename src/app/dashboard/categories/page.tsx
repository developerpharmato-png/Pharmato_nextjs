"use client";
import React, { useState } from 'react';

import Link from 'next/link';
import HeaderWithAction from '../components/HeaderWithAction';

export default function CategoriesPage() {
    const [seeding, setSeeding] = React.useState(false);
    const [filterOTC, setFilterOTC] = useState<string>('all');

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
            <HeaderWithAction
                title="Categories"
                subtitle="Manage medicine categories and OTC classification"
                showBack={false}
                showSearch={false}
            />
            <div className="flex items-center mb-6 justify-end gap-3">
                <select
                    value={filterOTC}
                    onChange={e => setFilterOTC(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    style={{ minWidth: 160 }}
                >
                    <option value="all">All</option>
                    <option value="true">OTC Only</option>
                    <option value="false">Non-OTC Only</option>
                </select>
                <button
                    onClick={handleSeedData}
                    disabled={seeding}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 flex items-center gap-2"
                >
                    <span className="material-icons" style={{ fontSize: 22 }}>auto_awesome</span>
                    {seeding ? 'Seeding...' : 'Seed Dummy Data'}
                </button>
                <Link
                    href="/dashboard/categories/new"
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2"
                >
                    <span className="material-icons" style={{ fontSize: 22 }}>add_circle</span>
                    Add Category
                </Link>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
                <CategoriesTable />
            </div>
        </div>
    );

    function CategoriesTable() {
        const [dialogOpen, setDialogOpen] = useState(false);
        const [pendingCategory, setPendingCategory] = useState<{ id: string; isActive: boolean } | null>(null);
        const [categories, setCategories] = useState<any[]>([]);
        const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
        const [searchTerm, setSearchTerm] = useState('');
        // Remove duplicate filterOTC, use parent state
        const [currentPage, setCurrentPage] = useState(1);
        const [loading, setLoading] = useState(true);
        const itemsPerPage = 10;

        React.useEffect(() => {
            fetchCategories();
        }, [searchTerm, filterOTC]);

        const fetchCategories = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (searchTerm) params.append('name', searchTerm);
                if (filterOTC !== 'all') params.append('isOTC', filterOTC);
                const res = await fetch(`/api/categories?${params.toString()}`);
                const data = await res.json();
                setCategories(data.data || []);
                setFilteredCategories(data.data || []);
                setCurrentPage(1);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            } finally {
                setLoading(false);
            }
        };

        const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentCategories = filteredCategories.slice(startIndex, endIndex);

        // Add missing handleToggleStatus function
        const handleToggleStatus = (categoryId: string, isActive: boolean) => {
            setPendingCategory({ id: categoryId, isActive });
            setDialogOpen(true);
        };

        const confirmToggleStatus = async () => {
            if (!pendingCategory) return;
            try {
                const res = await fetch(`/api/categories/${pendingCategory.id}/toggle-status`, {
                    method: 'PATCH',
                });
                const data = await res.json();
                if (data.success) {
                    // Update only the affected category in local state
                    setCategories(prev => prev.map(cat =>
                        cat._id === pendingCategory.id
                            ? { ...cat, isActive: !cat.isActive }
                            : cat
                    ));
                    setFilteredCategories(prev => prev.map(cat =>
                        cat._id === pendingCategory.id
                            ? { ...cat, isActive: !cat.isActive }
                            : cat
                    ));
                } else {
                    alert('Failed to toggle status: ' + (data.error || 'Unknown error'));
                }
            } catch (error) {
                alert('Failed to toggle status');
            } finally {
                setDialogOpen(false);
                setPendingCategory(null);
            }
        };

        const cancelToggleStatus = () => {
            setDialogOpen(false);
            setPendingCategory(null);
        };
        return (
            <div className="space-y-4">
                {/* Dialog for status toggle confirmation */}
                {dialogOpen && pendingCategory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backdropFilter: 'blur(6px)' }}>
                        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
                            <h2 className="text-lg font-bold mb-2">Confirm Status Change</h2>
                            <p className="mb-6 text-gray-700">
                                Are you sure you want to {pendingCategory.isActive ? 'inactivate' : 'activate'} this category?
                            </p>
                            <div className="flex gap-4 justify-end">
                                <button
                                    onClick={cancelToggleStatus}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmToggleStatus}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                                >
                                    Yes, {pendingCategory.isActive ? 'Inactivate' : 'Activate'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Filters */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative" style={{ minWidth: 200 }}>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search category name..."
                            className="px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                                style={{ outline: 'none' }}
                                aria-label="Clear search"
                            >
                                <span style={{ fontSize: 18, pointerEvents: 'none' }}>✕</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Loader */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                )}

                {/* Table */}
                {!loading && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Id</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Image</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Description</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">OTC</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentCategories.map((category: any) => (
                                    <tr key={category._id} className="hover:bg-green-50 transition">
                                        <td className="px-4 py-3 text-sm font-mono text-gray-700 whitespace-nowrap">{category.uniqueCode ? category.uniqueCode : '-'}</td>
                                        <td className="px-4 py-3">
                                            {Array.isArray(category.images) && category.images.length > 0 ? (
                                                <img src={category.images[0]} alt="Category" className="h-10 w-10 object-cover rounded" />
                                            ) : (
                                                <span className="inline-block h-10 w-10 bg-gray-200 rounded text-xl flex items-center justify-center">📦</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{category.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{category.description}</td>
                                        <td className="px-4 py-3 text-sm">
                                            {category.isOTC ? (
                                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Yes</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">No</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <button
                                                onClick={() => handleToggleStatus(category._id, category.isActive)}
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
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
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
}
