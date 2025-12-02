"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from 'sweetalert2';

export default function EditSubCategoryPage() {
    const { id } = useParams();
    const router = useRouter();
    const [form, setForm] = useState({ name: "", description: "", categoryId: "", images: [] as string[], isOTC: false, isActive: true });
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
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
                        images: Array.isArray(data.data.images) ? data.data.images : [],
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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate file type - only allow images
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
            if (!allowedTypes.includes(file.type)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid file type',
                    text: 'Please upload only image files (JPEG, PNG, GIF, WebP, SVG)',
                });
                const fileInput = document.getElementById('edit-subcategory-image-input') as HTMLInputElement | null;
                if (fileInput) fileInput.value = '';
                return;
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                Swal.fire({
                    icon: 'error',
                    title: 'File too large',
                    text: 'Please upload an image smaller than 5MB',
                });
                const fileInput = document.getElementById('edit-subcategory-image-input') as HTMLInputElement | null;
                if (fileInput) fileInput.value = '';
                return;
            }

            setUploading(true);
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            const res = await fetch('/api/cloudinary/upload-image', {
                method: 'POST',
                body: uploadFormData,
            });
            const data = await res.json();
            if (data.success && data.url) {
                setForm(prev => ({ ...prev, images: [data.url] }));
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Image uploaded successfully',
                    showConfirmButton: false,
                    timer: 2000
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Image upload failed',
                    text: data.error || 'Failed to upload image',
                });
            }
            setUploading(false);
            const fileInput = document.getElementById('edit-subcategory-image-input') as HTMLInputElement | null;
            if (fileInput) fileInput.value = '';
        }
    };

    const handleDeleteImage = async (url: string) => {
        const res = await fetch('/api/cloudinary/delete-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: url }),
        });
        const data = await res.json();
        if (data.success) {
            setForm(prev => ({ ...prev, images: [] }));
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Image deleted',
                showConfirmButton: false,
                timer: 2000
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Delete failed',
                text: data.error || 'Failed to delete image',
            });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate image is uploaded
        if (form.images.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Image required',
                text: 'Please upload a subcategory image before submitting',
            });
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/subcategories/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Subcategory updated successfully',
                    showConfirmButton: false,
                    timer: 2000
                });
                setTimeout(() => {
                    router.push("/dashboard/subcategories");
                }, 1200);
            } else {
                const errorMsg = Array.isArray(data.error) ? data.error.join(", ") : data.error;
                Swal.fire({
                    icon: 'error',
                    title: 'Update failed',
                    text: errorMsg || 'Failed to update subcategory',
                });
                setError(errorMsg);
            }
        } catch {
            Swal.fire({
                icon: 'error',
                title: 'Update failed',
                text: 'Failed to update subcategory',
            });
            setError("Failed to update subcategory");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (error) return <div className="p-8 text-red-600">{error}</div>;

    return (
        <div className="w-full min-h-screen bg-gray-50 py-8 px-2 sm:px-6">
            <div className="max-w-3xl mx-auto">
                <header className="mb-8 relative">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="absolute left-0 top-0 inline-flex items-center justify-center w-10 h-10 text-gray-500 bg-white border border-gray-200 rounded-full shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                        aria-label="Go back"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="pl-14">
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Edit Subcategory</h1>
                        <p className="text-gray-500 text-base">Update subcategory details, images, and status.</p>
                    </div>
                </header>
                <div className="bg-white rounded-lg shadow p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory Name *</label>
                            <input name="name" value={form.name} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                            <textarea name="description" value={form.description} onChange={handleChange} required rows={3} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory Image *</label>
                            <div className="flex items-center gap-4">
                                {form.images.length === 0 ? (
                                    <div>
                                        <input
                                            id="edit-subcategory-image-input"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('edit-subcategory-image-input')?.click()}
                                            className="w-16 h-16 flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-200 transition"
                                            title="Upload photo"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-500">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 12.75l2.25 3 3-4.5 4.5 6" />
                                            </svg>
                                        </button>
                                        {uploading && <span className="ml-2 text-blue-600">Uploading...</span>}
                                    </div>
                                ) : (
                                    <div className="relative group">
                                        <img
                                            src={form.images[0]}
                                            alt="Subcategory"
                                            className="h-20 w-20 object-cover rounded border cursor-pointer"
                                            title="Subcategory image"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteImage(form.images[0])}
                                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-80 group-hover:opacity-100"
                                            title="Delete image"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                            {form.images.length === 0 && !uploading && (
                                <p className="text-xs text-gray-500 mt-2">No image uploaded yet.</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Parent Category *</label>
                            <select name="categoryId" value={form.categoryId} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                <option value="">Select a category</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>
                                        {Array.isArray(cat.images) && cat.images[0] ? (
                                            <img src={cat.images[0]} alt="Category" style={{ width: 24, height: 24, display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                                        ) : null}
                                        {cat.name}
                                    </option>
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
                            <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium">{loading ? "Saving..." : "Save Changes"}</button>
                            <button type="button" onClick={() => router.back()} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
