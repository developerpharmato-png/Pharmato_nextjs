"use client";
import React, { useState } from 'react';
import { CustomTable, Column } from "../components/CustomTable";
import { CustomImage, CustomTooltip } from "../components/miniComponents";
import Link from 'next/link';
import Swal from 'sweetalert2';
// ...existing code...

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
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingSubcategory, setPendingSubcategory] = useState<{ id: string; isActive: boolean } | null>(null);

    React.useEffect(() => {
        fetchData();
    }, []);

    React.useEffect(() => {
        let filtered = subcategories;
        if (searchTerm) {
            filtered = filtered.filter(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (filterCategory !== 'all') {
            filtered = filtered.filter(sub => sub.categoryId?._id === filterCategory);
        }
        if (filterOTC !== 'all') {
            filtered = filtered.filter(sub => sub.isOTC === (filterOTC === 'true'));
        }
        setFilteredSubcategories(filtered);
        setPage(0);
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

    const handleToggleStatus = (id: string, isActive: boolean) => {
        setPendingSubcategory({ id, isActive });
        setDialogOpen(true);
    };

    const confirmToggleStatus = async () => {
        if (!pendingSubcategory) return;
        try {
            const res = await fetch(`/api/subcategories/${pendingSubcategory.id}/toggle-status`, {
                method: 'PATCH',
            });
            const data = await res.json();
            if (data.success) {
                setSubcategories(prev => prev.map(sub =>
                    sub._id === pendingSubcategory.id
                        ? { ...sub, isActive: !sub.isActive }
                        : sub
                ));
                setFilteredSubcategories(prev => prev.map(sub =>
                    sub._id === pendingSubcategory.id
                        ? { ...sub, isActive: !sub.isActive }
                        : sub
                ));
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Status updated',
                    showConfirmButton: false,
                    timer: 2000
                });
            } else {
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
        } finally {
            setDialogOpen(false);
            setPendingSubcategory(null);
        }
    };

    const cancelToggleStatus = () => {
        setDialogOpen(false);
        setPendingSubcategory(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    // Table columns
    const columns: Column<any>[] = [
        {
            id: "uniqueCode",
            label: "Id",
            selector: (row) => (
                <CustomTooltip title={row.uniqueCode || "—"}>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium inline-block" style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.uniqueCode || '—'}
                    </span>
                </CustomTooltip>
            ),
        },
        {
            id: "name",
            label: "Name",
            selector: (row) => (
                <CustomTooltip title={row.name || "-"}>
                    <div className="flex items-center gap-2">
                        {Array.isArray(row.images) && row.images[0] ? (
                            <CustomImage coverImage={row.images[0]} images={row.images} alt="Subcategory" style={{ width: 32, height: 32, borderRadius: 6 }} />
                        ) : null}
                        <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.name}</span>
                    </div>
                </CustomTooltip>
            ),
        },
        {
            id: "description",
            label: "Description",
            selector: (row) => (
                <CustomTooltip title={row.description || "-"}>
                    <span className="text-gray-600" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.description}</span>
                </CustomTooltip>
            ),
        },
        {
            id: "category",
            label: "Category",
            selector: (row) => (
                <CustomTooltip title={row.categoryId?.name || "N/A"}>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium" style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.categoryId?.name || 'N/A'}
                    </span>
                </CustomTooltip>
            ),
        },
        {
            id: "isOTC",
            label: "OTC",
            selector: (row) => (
                <CustomTooltip title={row.isOTC ? "Yes" : "No"}>
                    {row.isOTC ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Yes</span>
                    ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">No</span>
                    )}
                </CustomTooltip>
            ),
        },
        {
            id: "isActive",
            label: "Status",
            selector: (row) => (
                <CustomTooltip title={row.isActive ? "Active" : "Inactive"}>
                    <button
                        onClick={() => handleToggleStatus(row._id, row.isActive)}
                        className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        style={{ backgroundColor: row.isActive ? '#10b981' : '#d1d5db' }}
                        title={row.isActive ? 'Click to deactivate' : 'Click to activate'}
                    >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${row.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </CustomTooltip>
            ),
        },
        {
            id: "actions",
            label: "Actions",
            selector: (row) => (
                <CustomTooltip title="Edit">
                    <Link href={`/dashboard/subcategories/edit/${row._id}`} className="text-blue-600 hover:text-blue-800 font-medium">Edit</Link>
                </CustomTooltip>
            ),
        },
    ];

    // Pagination
    const paginatedData = filteredSubcategories.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <div className="space-y-4">
            {/* Dialog for status toggle confirmation */}
            {dialogOpen && pendingSubcategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backdropFilter: 'blur(6px)' }}>
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
                        <h2 className="text-lg font-bold mb-2">Confirm Status Change</h2>
                        <p className="mb-6 text-gray-700">
                            Are you sure you want to {pendingSubcategory.isActive ? 'inactivate' : 'activate'} this subcategory?
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
                                Yes, {pendingSubcategory.isActive ? 'Inactivate' : 'Activate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px] relative">
                    <input
                        type="text"
                        placeholder="Search subcategories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="absolute left-3 top-2.5 w-5 h-5 text-gray-400">
                        <circle cx="11" cy="11" r="8" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
                    </svg>
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            title="Clear search"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
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

           
            <CustomTable
                columns={columns}
                data={paginatedData}
                page={page}
                rowsPerPage={rowsPerPage}
                totalCount={filteredSubcategories.length}
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
            />
        </div>
    );
}
