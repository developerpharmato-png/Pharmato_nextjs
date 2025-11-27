
"use client";
import React, { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HeaderWithAction from '../../../components/HeaderWithAction';

export default function EditMedicinePage({ params }: { params: Promise<{ id: string }> }) {
    // Next.js 16: params is a Promise, unwrap with use()
    const { id } = use<{ id: string }>(params);
    const [form, setForm] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Editable state for all fields
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [filteredSubcategories, setFilteredSubcategories] = useState<any[]>([]);
    const [composition, setComposition] = useState<{ name: string; value: string }[]>([]);
    const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'inventory' | 'images' | 'composition' | 'classification'>('general');

    // Fetch medicine data by ID and prefill form (runs after `id` is defined)
    useEffect(() => {
        const fetchMedicine = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/medicines/${id}`);
                const data = await res.json();
                if (data.success && data.data) {
                    setForm(data.data);
                    if (data.data.images) setImageFiles([]); // images from backend, not File objects
                } else {
                    setError(data.error || "Failed to fetch medicine data");
                }
            } catch (err: any) {
                setError(err.message || "Failed to fetch medicine data");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchMedicine();
    }, [id]);

    // Fetch categories/subcategories for dropdowns
    useEffect(() => {
        fetchCategories();
        fetchSubcategories();
    }, []);

    useEffect(() => {
        if (form && form.categoryId) {
            const filtered = subcategories.filter(sub => sub.categoryId?._id === form.categoryId);
            setFilteredSubcategories(filtered);
        } else {
            setFilteredSubcategories([]);
        }
    }, [form?.categoryId, subcategories]);

    useEffect(() => {
        if (form && form.composition) {
            setComposition(form.composition);
        }
    }, [form]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(data.data || []);
        } catch (error) {
            // ...existing code...
        }
    };

    const fetchSubcategories = async () => {
        try {
            const res = await fetch('/api/subcategories');
            const data = await res.json();
            setSubcategories(data.data || []);
        } catch (error) {
            // ...existing code...
        }
    };

    // Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setForm((prev: any) => {
            let newForm = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };
            if (name === 'categoryId') newForm.subCategoryId = '';
            if (name === 'price' || name === 'mrp') {
                const priceNum = Number(name === 'price' ? value : newForm.price);
                const mrpNum = Number(name === 'mrp' ? value : newForm.mrp);
                if (mrpNum > 0 && priceNum >= 0 && mrpNum >= priceNum) {
                    newForm.discount = Math.round(((mrpNum - priceNum) / mrpNum) * 100);
                } else {
                    newForm.discount = 0;
                }
            }
            return newForm;
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setImageFiles(files);
        setForm((prev: any) => ({ ...prev, images: files }));
    };

    const handleCompositionChange = (idx: number, field: string, value: string) => {
        setComposition(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
    };
    const addCompositionRow = () => setComposition(prev => [...prev, { name: '', value: '' }]);
    const removeCompositionRow = (idx: number) => setComposition(prev => prev.filter((_, i) => i !== idx));

    useEffect(() => {
        setForm((prev: any) => ({ ...prev, composition }));
    }, [composition]);

    // Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            let res;
            // If there are new image files, use FormData (multipart). Otherwise send JSON which backend also accepts.
            if (imageFiles.length > 0) {
                const formData = new FormData();
                Object.entries(form || {}).forEach(([key, value]) => {
                    if (key === "images" && Array.isArray(value)) {
                        value.forEach((file: any) => formData.append("images", file));
                    } else if (key === "composition" && Array.isArray(value)) {
                        formData.append("composition", JSON.stringify(value));
                    } else if (value !== undefined && value !== null) {
                        formData.append(key, value as any);
                    }
                });
                imageFiles.forEach((file) => formData.append("images", file));
                res = await fetch(`/api/medicines/${id}`, {
                    method: "PUT",
                    body: formData,
                });
            } else {
                // Send JSON payload — ensure composition is serialized as array
                const payload: any = { ...form };
                // convert any Date objects to ISO strings
                if (payload.expiryDate && payload.expiryDate instanceof Date) payload.expiryDate = payload.expiryDate.toISOString();
                // ensure composition is an array
                if (payload.composition && typeof payload.composition === 'string') {
                    try { payload.composition = JSON.parse(payload.composition); } catch { /* keep as-is */ }
                }
                res = await fetch(`/api/medicines/${id}`, {
                    method: "PUT",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Update failed");
            router.push("/dashboard/medicines");
        } catch (err: any) {
            setError(err.message || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    // UI
    return (
        <div className="w-full px-4 py-6 sm:px-6 sm:py-8">
            <div className="mb-6">
                <HeaderWithAction
                    title="Edit Medicine"
                    subtitle="Update medicine details"
                    showBack={true}
                    showSearch={false}
                />
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 w-full">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tab navigation */}
                    <div className="mb-4 border-b">
                        <nav className="flex gap-2 overflow-x-auto">
                            {[
                                { key: 'general', label: 'General' },
                                { key: 'pricing', label: 'Pricing' },
                                { key: 'inventory', label: 'Inventory' },
                                { key: 'images', label: 'Images' },
                                { key: 'composition', label: 'Composition' },
                                { key: 'classification', label: 'Classification' }
                            ].map(t => (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setActiveTab(t.key as any)}
                                    className={`px-4 py-2 -mb-px border-b-2 ${activeTab === t.key ? 'border-green-600 text-green-700 font-medium' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Images Tab */}
                    {activeTab === 'images' && (
                        <div className="bg-gray-50 rounded-lg p-4 border">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Medicine Images</label>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                            />
                            <div className="mt-2">
                                <div className="overflow-x-auto py-2">
                                    <div className="inline-flex gap-2">
                                        {imageFiles.length > 0
                                            ? imageFiles.map((file, idx) => (
                                                <img key={idx} src={URL.createObjectURL(file)} alt={`preview-${idx}`} className="w-20 h-20 object-cover rounded border shadow-sm" />
                                            ))
                                            : (form?.images?.map((img: string, idx: number) => (
                                                <img key={idx} src={img} alt={`img-${idx}`} className="w-20 h-20 object-cover rounded border shadow-sm" />
                                            )) || <div className="text-sm text-gray-500">No images uploaded</div>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <div className="bg-white rounded-lg p-4 border">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Medicine Name *</label>
                                <input
                                    name="name"
                                    value={form?.name || ''}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                    placeholder="Enter medicine name"
                                />
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                                <textarea
                                    name="description"
                                    value={form?.description || ''}
                                    onChange={handleChange}
                                    required
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                    placeholder="Enter medicine description and usage"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Manufacturer *</label>
                                    <input
                                        name="manufacturer"
                                        value={form?.manufacturer || ''}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                        placeholder="Manufacturer name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Form Type *</label>
                                    <select
                                        name="category"
                                        value={form?.category || ''}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                    >
                                        {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Other'].map(c =>
                                            <option key={c} value={c}>{c}</option>
                                        )}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                                    <select
                                        name="categoryId"
                                        value={form?.categoryId || ''}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name} {cat.isOTC ? '(OTC)' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategory</label>
                                    <select
                                        name="subCategoryId"
                                        value={form?.subCategoryId || ''}
                                        onChange={handleChange}
                                        disabled={!form?.categoryId}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition disabled:bg-gray-100"
                                    >
                                        <option value="">Select a subcategory</option>
                                        {filteredSubcategories.map(sub => (
                                            <option key={sub._id} value={sub._id}>{sub.name} {sub.isOTC ? '(OTC)' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                            <select
                                name="categoryId"
                                value={form?.categoryId || ''}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                            >
                                <option value="">Select a category</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>{cat.name} {cat.isOTC ? '(OTC)' : ''}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategory</label>
                            <select
                                name="subCategoryId"
                                value={form?.subCategoryId || ''}
                                onChange={handleChange}
                                disabled={!form?.categoryId}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition disabled:bg-gray-100"
                            >
                                <option value="">Select a subcategory</option>
                                {filteredSubcategories.map(sub => (
                                    <option key={sub._id} value={sub._id}>{sub.name} {sub.isOTC ? '(OTC)' : ''}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity *</label>
                            <input
                                name="stock"
                                type="number"
                                value={form?.stock || ''}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                placeholder="0"
                            />
                        </div>
                    </div>
                    {/* Pricing Tab */}
                    {activeTab === 'pricing' && (
                        <div className="bg-white rounded-lg p-4 border">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">MRP (₹) *</label>
                                    <input
                                        name="mrp"
                                        type="number"
                                        step="0.01"
                                        value={form?.mrp || ''}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        placeholder="MRP"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Purchase Price (₹) *</label>
                                    <input
                                        name="purchasePrice"
                                        type="number"
                                        step="0.01"
                                        value={form?.purchasePrice || ''}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                                        placeholder="Purchase Price"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Selling Price (₹) *</label>
                                    <input
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        value={form?.price || ''}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                        placeholder="Selling Price"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Discount (%)</label>
                                    <input
                                        name="discount"
                                        type="number"
                                        value={form?.discount || 0}
                                        readOnly
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-100 text-gray-700"
                                        placeholder="Discount %"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Inventory Tab */}
                    {activeTab === 'inventory' && (
                        <div className="bg-white rounded-lg p-4 border">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity *</label>
                                    <input
                                        name="stock"
                                        type="number"
                                        value={form?.stock || ''}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date *</label>
                                    <input
                                        name="expiryDate"
                                        type="date"
                                        value={form?.expiryDate ? new Date(form.expiryDate).toISOString().split('T')[0] : ''}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Batch Number *</label>
                                    <input
                                        name="batchNumber"
                                        value={form?.batchNumber || ''}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                        placeholder="Batch number"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Composition Tab */}
                    {activeTab === 'composition' && (
                        <div className="bg-white rounded-lg p-4 border">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Composition</label>
                            {composition.map((c, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        value={c.name}
                                        onChange={e => handleCompositionChange(idx, 'name', e.target.value)}
                                        className="border rounded px-2 py-2 flex-1 w-full"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Value"
                                        value={c.value}
                                        onChange={e => handleCompositionChange(idx, 'value', e.target.value)}
                                        className="border rounded px-2 py-2 flex-1 w-full"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeCompositionRow(idx)}
                                        className="w-full sm:w-auto text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1 rounded text-sm sm:self-center"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addCompositionRow} className="text-green-600 mt-2">+ Add Composition</button>
                        </div>
                    )}
                    {/* Classification Tab */}
                    {activeTab === 'classification' && (
                        <div className="space-y-4 border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-800">Medicine Classification</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="isOTC"
                                        name="isOTC"
                                        checked={form?.isOTC || false}
                                        onChange={handleChange}
                                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                    />
                                    <label htmlFor="isOTC" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <span>🟢 Over-the-Counter (OTC)</span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">
                                            Can be purchased without prescription
                                        </p>
                                    </label>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="requiresPrescription"
                                        name="requiresPrescription"
                                        checked={form?.requiresPrescription || false}
                                        onChange={handleChange}
                                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                                    />
                                    <label htmlFor="requiresPrescription" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <span>📋 Requires Prescription</span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">
                                            Prescription needed for purchase
                                        </p>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:flex-1 px-5 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow"
                        >
                            {loading ? 'Saving...' : 'Update Medicine'}
                        </button>
                        <Link
                            href="/dashboard/medicines"
                            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition font-medium"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
