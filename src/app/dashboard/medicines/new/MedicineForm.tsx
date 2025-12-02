"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import HeaderWithAction from '../../components/HeaderWithAction';
import Swal from 'sweetalert2';

export default function MedicineForm() {
    const router = useRouter();
    const [form, setForm] = useState<{
        name: string;
        description: string;
        manufacturer: string;
        category: string;
        categoryId: string;
        subCategoryId: string;
        price: string;
        purchasePrice: string;
        mrp: string;
        discount: number;
        stock: string;
        expiryDate: string;
        batchNumber: string;
        isOTC: boolean;
        requiresPrescription: boolean;
        images: string[];
        highlights: string[];
    }>({
        name: '',
        description: '',
        manufacturer: '',
        category: 'Tablet',
        categoryId: '',
        subCategoryId: '',
        price: '',
        purchasePrice: '',
        mrp: '',
        discount: 0,
        stock: '',
        expiryDate: '',
        batchNumber: '',
        isOTC: false,
        requiresPrescription: true,
        images: [],
        highlights: [],
    });
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
            if (!allowedTypes.includes(file.type)) {
                Swal.fire({ icon: 'error', title: 'Invalid file type', text: 'Please upload only image files (JPEG, PNG, GIF, WebP, SVG)' });
                const inp = document.getElementById('medicine-image-input') as HTMLInputElement | null;
                if (inp) inp.value = '';
                return;
            }

            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                Swal.fire({ icon: 'error', title: 'File too large', text: 'Please upload an image smaller than 5MB' });
                const inp = document.getElementById('medicine-image-input') as HTMLInputElement | null;
                if (inp) inp.value = '';
                return;
            }

            setUploading(true);
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            const res = await fetch('/api/cloudinary/upload-image', { method: 'POST', body: uploadFormData });
            const data = await res.json();
            if (data.success && data.url) {
                setForm(prev => ({ ...prev, images: [data.url] }));
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Image uploaded successfully', showConfirmButton: false, timer: 2000 });
            } else {
                Swal.fire({ icon: 'error', title: 'Image upload failed', text: data.error || 'Failed to upload image' });
            }
            setUploading(false);
            const inp2 = document.getElementById('medicine-image-input') as HTMLInputElement | null;
            if (inp2) inp2.value = '';
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
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Image deleted', showConfirmButton: false, timer: 2000 });
        } else {
            Swal.fire({ icon: 'error', title: 'Delete failed', text: data.error || 'Failed to delete image' });
        }
    };
    const [composition, setComposition] = useState([{ name: '', value: '' }]);
    const [categories, setCategories] = useState<any[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [filteredSubcategories, setFilteredSubcategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
        fetchSubcategories();
    }, []);

    useEffect(() => {
        if (form.categoryId) {
            const filtered = subcategories.filter(sub => sub.categoryId?._id === form.categoryId);
            setFilteredSubcategories(filtered);
        } else {
            setFilteredSubcategories([]);
        }
    }, [form.categoryId, subcategories]);

    useEffect(() => {
        const cat = categories.find(c => c._id === form.categoryId);
        const sub = subcategories.find(s => s._id === form.subCategoryId);
        const derivedOTC = (sub?.isOTC ?? cat?.isOTC) ?? false;
        setForm(prev => ({
            ...prev,
            isOTC: derivedOTC,
            requiresPrescription: !derivedOTC,
        }));
    }, [form.categoryId, form.subCategoryId, categories, subcategories]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(data.data || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchSubcategories = async () => {
        try {
            const res = await fetch('/api/subcategories');
            const data = await res.json();
            setSubcategories(data.data || []);
        } catch (error) {
            console.error('Failed to fetch subcategories:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        let newForm = {
            ...form,
            [name]: type === 'checkbox' ? checked : value
        };
        // Prevent negative stock
        if (name === 'stock') {
            const stockNum = Math.max(0, Number(value));
            newForm.stock = stockNum.toString();
        }
        // Reset subcategory when category changes
        if (name === 'categoryId') {
            newForm.subCategoryId = '';
        }
        // Auto-calculate discount when price or mrp changes
        if (name === 'price' || name === 'mrp') {
            const priceNum = Number(name === 'price' ? value : newForm.price);
            const mrpNum = Number(name === 'mrp' ? value : newForm.mrp);
            if (mrpNum > 0 && priceNum >= 0 && mrpNum >= priceNum) {
                newForm.discount = Math.round(((mrpNum - priceNum) / mrpNum) * 100);
            } else {
                newForm.discount = 0;
            }
        }
        setForm(newForm);
    };

    const handleCompositionChange = (idx: number, field: string, value: string) => {
        setComposition(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
    };
    const addCompositionRow = () => setComposition(prev => [...prev, { name: '', value: '' }]);
    const removeCompositionRow = (idx: number) => setComposition(prev => prev.filter((_, i) => i !== idx));

    const handleHighlightChange = (idx: number, value: string) => {
        setForm(prev => ({
            ...prev,
            highlights: prev.highlights.map((h, i) => (i === idx ? value : h)),
        }));
    };
    const addHighlightRow = () => setForm(prev => ({ ...prev, highlights: [...prev.highlights, ''] }));
    const removeHighlightRow = (idx: number) => setForm(prev => ({ ...prev, highlights: prev.highlights.filter((_, i) => i !== idx) }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // UI validation: Selling price must not exceed MRP
            const priceNum = Number(form.price);
            const mrpNum = Number(form.mrp);
            if (!Number.isNaN(priceNum) && !Number.isNaN(mrpNum) && priceNum > mrpNum) {
                Swal.fire({ icon: 'error', title: 'Invalid price', text: 'Selling price cannot be greater than MRP' });
                setLoading(false);
                return;
            }
            if (!form.images || form.images.length === 0) {
                Swal.fire({ icon: 'error', title: 'Image required', text: 'Please upload a medicine image before submitting' });
                setLoading(false);
                return;
            }
            const res = await fetch('/api/medicines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    composition,
                    highlights: (form.highlights || []).map(h => (h || '').trim()).filter(h => h.length > 0),
                    price: Number(form.price),
                    purchasePrice: Number(form.purchasePrice),
                    mrp: Number(form.mrp),
                    discount: Number(form.discount),
                    stock: Number(form.stock),
                    expiryDate: new Date(form.expiryDate),
                    categoryId: form.categoryId || undefined,
                    subCategoryId: form.subCategoryId || undefined,
                }),
            });
            const data = await res.json();
            if (!data.success) {
                setError(Array.isArray(data.error) ? data.error.join(', ') : data.error);
            } else {
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Medicine created successfully', showConfirmButton: false, timer: 2000 });
                setTimeout(() => router.push('/dashboard/medicines'), 1000);
            }
        } catch (err) {
            setError('Failed to create medicine');
        } finally {
            setLoading(false);
        }
    };

    const selectedCategory = categories.find(cat => cat._id === form.categoryId);
    const selectedSubcategory = subcategories.find(sub => sub._id === form.subCategoryId);

    return (
        <div className="p-8">
            <div className="mb-8">
                <HeaderWithAction
                    title="Add New Medicine"
                    subtitle="Enter medicine details to add to inventory"
                    showBack={true}
                    showSearch={false}
                />
            </div>
            <div className="bg-white rounded-xl shadow-md p-8 max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Medicine Image *</label>
                        <div className="flex items-center gap-4">
                            {form.images.length === 0 ? (
                                <div>
                                    <input id="medicine-image-input" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('medicine-image-input')?.click()}
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
                                    <img src={form.images[0]} alt="Medicine" className="h-20 w-20 object-cover rounded border cursor-pointer" title="Click to preview" />
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
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Medicine Name *</label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                            placeholder="Enter medicine name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            required
                            rows={4}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                            placeholder="Enter medicine description and usage"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Manufacturer *</label>
                            <input
                                name="manufacturer"
                                value={form.manufacturer}
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
                                value={form.category}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                            >
                                {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Other'].map(c =>
                                    <option key={c} value={c}>{c}</option>
                                )}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                            <select
                                name="categoryId"
                                value={form.categoryId}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                            >
                                <option value="">Select a category</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>
                                        {Array.isArray(cat.images) && cat.images[0] ? (
                                            <img src={cat.images[0]} alt="Category" style={{ width: 24, height: 24, display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                                        ) : null}
                                        {cat.name} {cat.isOTC ? '(OTC)' : ''}
                                    </option>
                                ))}
                            </select>
                            {selectedCategory && (
                                <div className="mt-2">
                                    {selectedCategory.isOTC ? (
                                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                            🟢 OTC Category
                                        </span>
                                    ) : (
                                        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                                            📋 Prescription Category
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategory</label>
                            <select
                                name="subCategoryId"
                                value={form.subCategoryId}
                                onChange={handleChange}
                                disabled={!form.categoryId}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition disabled:bg-gray-100"
                            >
                                <option value="">Select a subcategory</option>
                                {filteredSubcategories.map(sub => (
                                    <option key={sub._id} value={sub._id}>
                                        {sub.name} {sub.isOTC ? '(OTC)' : ''}
                                    </option>
                                ))}
                            </select>
                            {selectedSubcategory && (
                                <div className="mt-2">
                                    {selectedSubcategory.isOTC ? (
                                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                            🟢 OTC Subcategory
                                        </span>
                                    ) : (
                                        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                                            📋 Prescription Subcategory
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity *</label>
                            <input
                                name="stock"
                                type="number"
                                value={form.stock}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">MRP (₹) *</label>
                            <input
                                name="mrp"
                                type="number"
                                step="0.01"
                                value={form.mrp}
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
                                value={form.purchasePrice}
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
                                value={form.price}
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
                                value={form.discount}
                                readOnly
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-100 text-gray-700"
                                placeholder="Discount %"
                            />
                        </div>
                    </div>
                    {/* ...existing fields below... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date *</label>
                            <input
                                name="expiryDate"
                                type="date"
                                value={form.expiryDate}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Batch Number *</label>
                            <input
                                name="batchNumber"
                                value={form.batchNumber}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                placeholder="Batch number"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Composition</label>
                        {composition.map((c, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={c.name}
                                    onChange={e => handleCompositionChange(idx, 'name', e.target.value)}
                                    className="border rounded px-2 py-1 flex-1"
                                />
                                <input
                                    type="text"
                                    placeholder="Value"
                                    value={c.value}
                                    onChange={e => handleCompositionChange(idx, 'value', e.target.value)}
                                    className="border rounded px-2 py-1 flex-1"
                                />
                                <button type="button" onClick={() => removeCompositionRow(idx)} className="text-red-500">Remove</button>
                            </div>
                        ))}
                        <button type="button" onClick={addCompositionRow} className="text-green-600 mt-2">+ Add Composition</button>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Highlights</label>
                        {form.highlights.length === 0 && (
                            <p className="text-xs text-gray-500 mb-2">Add short bullet points to highlight key info.</p>
                        )}
                        {form.highlights.map((h, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder={`Highlight #${idx + 1}`}
                                    value={h}
                                    onChange={e => handleHighlightChange(idx, e.target.value)}
                                    className="border rounded px-2 py-1 flex-1"
                                />
                                <button type="button" onClick={() => removeHighlightRow(idx)} className="text-red-500">Remove</button>
                            </div>
                        ))}
                        <button type="button" onClick={addHighlightRow} className="text-green-600 mt-2">+ Add Highlight</button>
                    </div>
                    <div className="space-y-4 border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-800">Medicine Classification</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="isOTC"
                                    name="isOTC"
                                    checked={form.isOTC}
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
                                    checked={form.requiresPrescription}
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
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-md hover:shadow-lg"
                        >
                            {loading ? 'Saving...' : 'Save Medicine'}
                        </button>
                        <Link
                            href="/dashboard/medicines"
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
