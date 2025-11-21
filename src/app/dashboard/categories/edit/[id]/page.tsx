"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditCategoryPage() {
    const { id } = useParams();
    const router = useRouter();
    const [form, setForm] = useState({ name: "", description: "", isOTC: false, icon: "💊", isActive: true });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCategory() {
            try {
                const res = await fetch(`/api/categories/${id}`);
                const data = await res.json();
                if (data.success && data.data) {
                    setForm({
                        name: data.data.name,
                        description: data.data.description,
                        isOTC: data.data.isOTC,
                        icon: data.data.icon || "💊",
                        isActive: data.data.isActive,
                    });
                } else {
                    setError("Category not found");
                }
            } catch {
                setError("Failed to fetch category");
            } finally {
                setLoading(false);
            }
        }
        fetchCategory();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!data.success) {
                setError(Array.isArray(data.error) ? data.error.join(", ") : data.error);
            } else {
                router.push("/dashboard/categories");
            }
        } catch {
            setError("Failed to update category");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (error) return <div className="p-8 text-red-600">{error}</div>;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <button onClick={() => router.back()} className="mb-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg shadow inline-flex items-center gap-2">
                <span className="text-lg">←</span> Back
            </button>
            <h1 className="text-3xl font-bold mb-4">Edit Category</h1>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl shadow-md p-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea name="description" value={form.description} onChange={handleChange} required rows={3} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div className="flex items-center gap-3">
                    <input type="checkbox" id="isOTC" name="isOTC" checked={form.isOTC} onChange={handleChange} className="w-5 h-5 text-green-600 rounded focus:ring-green-500" />
                    <label htmlFor="isOTC" className="text-sm font-medium text-gray-700 cursor-pointer">OTC Category</label>
                </div>
                <div className="flex items-center gap-3">
                    <input type="checkbox" id="isActive" name="isActive" checked={form.isActive} onChange={handleChange} className="w-5 h-5 text-green-600 rounded focus:ring-green-500" />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">Active</label>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                    <input name="icon" value={form.icon} onChange={handleChange} className="w-16 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent text-2xl" />
                </div>
                <div className="flex gap-4 pt-4">
                    <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-md hover:shadow-lg">{loading ? "Saving..." : "Save Changes"}</button>
                    <button type="button" onClick={() => router.back()} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium">Cancel</button>
                </div>
            </form>
        </div>
    );
}
