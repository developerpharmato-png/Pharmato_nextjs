"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditSubCategoryPage() {
    const { id } = useParams();
    const router = useRouter();
    const [form, setForm] = useState({ name: "", description: "", categoryId: "", isOTC: false, isActive: true });
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSubCategory() {
            try {
                const res = await fetch(`/api/subcategories/${id}`);
                const data = await res.json();
                if (data.success && data.data) {
                    setForm({
                        name: data.data.name,
                        description: data.data.description,
                        categoryId: data.data.categoryId?._id || "",
                        isOTC: data.data.isOTC,
                        isActive: data.data.isActive,
                    });
                } else {
                    setError("Subcategory not found");
                }
            } catch {
                setError("Failed to fetch subcategory");
            } finally {
                setLoading(false);
            }
        }
        async function fetchCategories() {
            try {
                const res = await fetch("/api/categories");
                const data = await res.json();
                setCategories(data.data || []);
            } catch { }
        }
        fetchSubCategory();
        fetchCategories();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/subcategories/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!data.success) {
                setError(Array.isArray(data.error) ? data.error.join(", ") : data.error);
            } else {
                router.push("/dashboard/subcategories");
            }
        } catch {
            setError("Failed to update subcategory");
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
            <h1 className="text-3xl font-bold mb-4">Edit Subcategory</h1>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl shadow-md p-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea name="description" value={form.description} onChange={handleChange} required rows={3} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Parent Category *</label>
                    <select name="categoryId" value={form.categoryId} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        <option value="">Select a category</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-3">
                    <input type="checkbox" id="isOTC" name="isOTC" checked={form.isOTC} onChange={handleChange} className="w-5 h-5 text-green-600 rounded focus:ring-green-500" />
                    <label htmlFor="isOTC" className="text-sm font-medium text-gray-700 cursor-pointer">OTC Subcategory</label>
                </div>
                <div className="flex items-center gap-3">
                    <input type="checkbox" id="isActive" name="isActive" checked={form.isActive} onChange={handleChange} className="w-5 h-5 text-green-600 rounded focus:ring-green-500" />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">Active</label>
                </div>
                <div className="flex gap-4 pt-4">
                    <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-md hover:shadow-lg">{loading ? "Saving..." : "Save Changes"}</button>
                    <button type="button" onClick={() => router.back()} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium">Cancel</button>
                </div>
            </form>
        </div>
    );
}
