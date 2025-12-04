"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import HeaderWithAction from "../components/HeaderWithAction";
import CategoriesTable from "./CategoriesTable";
import { useRouter } from "next/navigation";

export default function CategoriesPage() {
    const [seeding, setSeeding] = React.useState(false);
    const [filterOTC, setFilterOTC] = useState<string>("all");
    const router = useRouter();

    const handleSeedData = async () => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "This will clear all existing categories and subcategories. Continue?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, seed data",
            cancelButtonText: "Cancel",
        });
        if (!result.isConfirmed) return;

        setSeeding(true);
        try {
            const res = await fetch("/api/seed", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: `Seeded ${data.data.categories} categories and ${data.data.subcategories} subcategories!`,
                    showConfirmButton: false,
                    timer: 2500,
                });
                setTimeout(() => window.location.reload(), 1200);
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Failed to seed data",
                    text: data.error || "Unknown error",
                });
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Failed to seed data",
                text: "Seed failed",
            });
        } finally {
            setSeeding(false);
        }
    };

    // Pagination and data state for CustomTable
    const [categories, setCategories] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchCategories();
    }, [page, rowsPerPage, filterOTC, searchTerm]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("limit", rowsPerPage.toString());
            params.append("offset", (page * rowsPerPage).toString());
            if (searchTerm) params.append("name", searchTerm);
            if (filterOTC !== "all") params.append("isOTC", filterOTC);
            const res = await fetch(`/api/categories?${params.toString()}`);
            const data = await res.json();
            setCategories(data.data || []);
            setTotalCount(data.total || (data.data ? data.data.length : 0));
        } catch (error) {
            setCategories([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id: string, isActive: boolean) => {
        try {
            const res = await fetch(`/api/categories/${id}/toggle-status`, {
                method: "PATCH",
            });
            const data = await res.json();
            if (data.success) {
                setCategories((prev) =>
                    prev.map((cat) =>
                        cat._id === id ? { ...cat, isActive: !cat.isActive } : cat
                    )
                );
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Status updated",
                    showConfirmButton: false,
                    timer: 2000,
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Failed to toggle status",
                    text: data.error || "Unknown error",
                });
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Failed to toggle status",
                text: "Network error",
            });
        }
    };

    const handleAdd = () => {
        router.push("/dashboard/categories/new");
    };
    return (
        <div className="containerStyle scrollbar-hide">
            <HeaderWithAction
                title="Categories"
                subtitle="Manage medicine categories and OTC classification"
                showBack={false}
                showSearch={true}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                addLabel="Add "
                addHref="/dashboard/categories/new"
                addShow={true}
                handleAdd={handleAdd}
            />
            <div className="flex items-center mb-6 justify-end gap-3 w-full">
                <select
                    value={filterOTC}
                    onChange={(e) => setFilterOTC(e.target.value)}
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
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    {seeding ? "Seeding..." : "Seed Dummy Data"}
                </button>
            </div>
            <div className="w-full bg-white rounded-lg shadow-md p-4">
                <CategoriesTable
                    data={categories}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    totalCount={totalCount}
                    onPageChange={setPage}
                    onRowsPerPageChange={setRowsPerPage}
                    onToggleStatus={handleToggleStatus}
                    loading={loading}
                />
            </div>
        </div>
    );
}
