"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewSubCategoryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        categoryId: '',
        isOTC: false,
        isActive: true,
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(data.data || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/subcategories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push('/dashboard/subcategories');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create subcategory');
            }
        } catch (error) {
            console.error('Failed to create subcategory:', error);
            alert('Failed to create subcategory');
        } finally {
            setLoading(false);
        }
    };

    const selectedCategory = categories.find(cat => cat._id === formData.categoryId);

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Add New Subcategory</h1>
                <p className="text-gray-600 mt-1">Create a new medicine subcategory</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Parent Category *
                        </label>
                        <select
                            required
                            value={formData.categoryId}
                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="">Select a category</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.icon} {cat.name} {cat.isOTC ? '(OTC)' : '(Prescription)'}
                                </option>
                            ))}
                        </select>
                        {selectedCategory && (
                            <p className="text-xs text-gray-500 mt-1">
                                Parent category is {selectedCategory.isOTC ? 'OTC' : 'Prescription Required'}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subcategory Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="e.g., Headache Relief, Cold & Flu, Multivitamins"
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
                            placeholder="Brief description of the subcategory"
                        />
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
                                    <span>🟢 Over-the-Counter (OTC) Subcategory</span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                    Medicines in this subcategory can be purchased without a prescription
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
                                Active Subcategory
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Subcategory'}
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
