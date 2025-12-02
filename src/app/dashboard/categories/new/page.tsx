"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCategoryPage() {
    // Back button handler
    const handleBack = () => {
        router.back();
    };
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<{
        name: string;
        description: string;
        isOTC: boolean;
        images: string[];
        isActive: boolean;
    }>({
        name: '',
        description: '',
        isOTC: false,
        images: [],
        isActive: true,
    });
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
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
        setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
        setImageFiles([]); // Clear selected files so user can select more
        setUploading(false);
        // Optionally, reset the file input value so user can re-select same files if needed
        const fileInput = document.getElementById('category-image-input') as HTMLInputElement | null;
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
            setFormData(prev => ({ ...prev, images: prev.images.filter(img => img !== url) }));
        } else {
            alert('Failed to delete image');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push('/dashboard/categories');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create category');
            }
        } catch (error) {
            console.error('Failed to create category:', error);
            alert('Failed to create category');
        } finally {
            setLoading(false);
        }
    };

    // Removed iconOptions

    return (
        <div className="p-6">
            <div className="mb-8 flex items-center gap-4">
                <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow hover:bg-gray-300 transition flex items-center gap-2"
                >
                    <span className="text-xl">←</span> Back
                </button>
                <span className="inline-block text-4xl">🩺</span>
                <div>
                    <h1 className="text-4xl font-extrabold text-green-700">Add New Category</h1>
                    <p className="text-gray-600 text-lg">Create a new medicine category for your inventory</p>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="e.g., Pain Relief, Antibiotics, Vitamins"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            rows={4}
                            placeholder="Brief description of the category"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category Images (Upload & Manage)
                        </label>
                        <input
                            id="category-image-input"
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
                            {formData.images.map((img, idx) => (
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
                        {formData.images.length === 0 && (
                            <p className="text-xs text-gray-500 mt-2">No images uploaded yet.</p>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <input
                                type="checkbox"
                                id="isOTC"
                                checked={formData.isOTC}
                                onChange={(e) => setFormData({ ...formData, isOTC: e.target.checked })}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                            <label htmlFor="isOTC" className="text-sm font-medium text-gray-700 cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <span>🟢 Over-the-Counter (OTC) Category</span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                    Medicines in this category can be purchased without a prescription
                                </p>
                            </label>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                                Active Category
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Category'}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
