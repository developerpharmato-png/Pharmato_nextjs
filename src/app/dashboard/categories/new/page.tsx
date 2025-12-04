
"use client";
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

export default function NewCategoryPage() {
    const [previewOpen, setPreviewOpen] = useState(false);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isOTC: false,
        images: [] as string[],
        isActive: true,
    });
    const [uploading, setUploading] = useState(false);

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
                const fileInput = document.getElementById('category-image-input') as HTMLInputElement | null;
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
                const fileInput = document.getElementById('category-image-input') as HTMLInputElement | null;
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
                setFormData(prev => ({ ...prev, images: [data.url] }));
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
            const fileInput = document.getElementById('category-image-input') as HTMLInputElement | null;
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
            setFormData(prev => ({ ...prev, images: [] }));
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validate image is uploaded
        if (formData.images.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Image required',
                text: 'Please upload a category image before submitting',
            });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Category created successfully',
                    showConfirmButton: false,
                    timer: 2000
                });
                setTimeout(() => {
                    router.push('/dashboard/categories');
                }, 1200);
            } else {
                const data = await res.json();
                Swal.fire({
                    icon: 'error',
                    title: 'Create failed',
                    text: data.error || 'Failed to create category',
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Create failed',
                text: 'Failed to create category',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="containerStyle scrollbar-hide">
           
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
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Add New Category</h1>
                        <p className="text-gray-500 text-base">Create a new medicine category for your inventory</p>
                    </div>
                </header>
                <div className="bg-white rounded-lg shadow p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="e.g., Pain Relief, Antibiotics, Vitamins"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                            <textarea
                                required
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                rows={4}
                                placeholder="Brief description of the category"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category Image *</label>
                            <div className="flex items-center gap-4">
                                {formData.images.length === 0 ? (
                                    <div>
                                        <input
                                            id="category-image-input"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('category-image-input')?.click()}
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
                                    <div>
                                        <div className="relative group">
                                            <img
                                                src={formData.images[0]}
                                                alt="Category"
                                                className="h-20 w-20 object-cover rounded border cursor-pointer"
                                                onClick={() => setPreviewOpen(true)}
                                                title="Click to preview"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteImage(formData.images[0])}
                                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-80 group-hover:opacity-100"
                                                title="Delete image"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        {previewOpen && (
                                            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backdropFilter: 'blur(8px)' }}>
                                                <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col items-center">
                                                    <img src={formData.images[0]} alt="Preview" className="max-w-xs max-h-[60vh] rounded mb-4" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewOpen(false)}
                                                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-medium"
                                                    >
                                                        Close
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {formData.images.length === 0 && !uploading && (
                                <p className="text-xs text-gray-500 mt-2">No image uploaded yet.</p>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="isOTC"
                                    checked={formData.isOTC}
                                    onChange={e => setFormData({ ...formData, isOTC: e.target.checked })}
                                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                />
                                <label htmlFor="isOTC" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <span>Over-the-Counter (OTC) Category</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">Medicines in this category can be purchased without a prescription</p>
                                </label>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
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
