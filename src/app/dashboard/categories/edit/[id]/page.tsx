"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditCategoryPage() {
    const { id } = useParams();
    const router = useRouter();
    const [form, setForm] = useState<{ name: string; description: string; isOTC: boolean; images: string[]; isActive: boolean }>({ name: "", description: "", isOTC: false, images: [], isActive: true });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

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
                        images: Array.isArray(data.data.images) ? data.data.images : [],
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
        if (name === "images") {
            setForm({ ...form, images: value.split(',').map(url => url.trim()).filter(Boolean) });
        } else {
            setForm({ ...form, [name]: type === "checkbox" ? checked : value });
        }
    };

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImageFiles(Array.from(e.target.files));
        }
    };

    // Upload selected files to Cloudinary
    const handleUploadImages = async () => {
        setUploading(true);
        const uploadedUrls: string[] = [];
        for (const file of imageFiles) {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            const res = await fetch('/api/cloudinary/upload-image', {
                method: 'POST',
                body: uploadFormData,
            });
            const data = await res.json();
            if (data.success && data.url) {
                uploadedUrls.push(data.url);
            }
        }
        setForm(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
        setImageFiles([]);
        setUploading(false);
        const fileInput = document.getElementById('edit-category-image-input') as HTMLInputElement | null;
        if (fileInput) fileInput.value = '';
    };

    // Delete image from Cloudinary and remove from array
    const handleDeleteImage = async (url: string) => {
        const res = await fetch('/api/cloudinary/delete-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: url }),
        });
        const data = await res.json();
        if (data.success) {
            setForm(prev => ({ ...prev, images: prev.images.filter(img => img !== url) }));
        } else {
            alert('Failed to delete image');
        }
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
            {/* Back button top left */}
            <button onClick={() => router.back()} className="mb-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg shadow inline-flex items-center gap-2">
                <span className="text-lg">←</span> Back
            </button>
            {/* Custom Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Edit Category</h1>
                <p className="text-gray-500 mt-1">Update category details, images, and status.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl shadow-md p-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea name="description" value={form.description} onChange={handleChange} required rows={3} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Images (Upload & Manage)</label>
                    <input
                        id="edit-category-image-input"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="mb-2"
                    />
                    <button
                        type="button"
                        onClick={handleUploadImages}
                        disabled={uploading || imageFiles.length === 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                    >
                        {uploading ? 'Uploading...' : 'Upload Selected Images'}
                    </button>
                    <div className="mt-4 flex flex-wrap gap-4">
                        {form.images.map((img, idx) => (
                            <div key={img} className="relative group">
                                <img src={img} alt={`Category ${idx}`} className="h-20 w-20 object-cover rounded border" />
                                <button
                                    type="button"
                                    onClick={() => handleDeleteImage(img)}
                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-80 group-hover:opacity-100"
                                    title="Delete image"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    {form.images.length === 0 && (
                        <p className="text-xs text-gray-500 mt-2">No images uploaded yet.</p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <input type="checkbox" id="isOTC" name="isOTC" checked={form.isOTC} onChange={handleChange} className="w-5 h-5 text-green-600 rounded focus:ring-green-500" />
                    <label htmlFor="isOTC" className="text-sm font-medium text-gray-700 cursor-pointer">OTC Category</label>
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
