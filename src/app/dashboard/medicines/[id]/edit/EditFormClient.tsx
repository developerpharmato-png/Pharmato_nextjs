"use client";
import React, { useEffect, useState } from 'react';
import { MdAdd, MdDelete, MdArrowBack, MdSave } from 'react-icons/md';
import { useParams } from 'next/navigation';
import HeaderWithAction from '../../../components/HeaderWithAction';

type Medicine = any;

export default function EditFormClient({ id }: { id?: string }) {
    const params = useParams();
    const clientIdFromParams = (params as any)?.id;
    const effectiveId = id && id !== 'undefined' ? id : clientIdFromParams;
    const [loading, setLoading] = useState(true);
    const [medicine, setMedicine] = useState<Medicine | null>(null);
    const [apiError, setApiError] = useState<{ status: number; body: any } | null>(null);
    const [form, setForm] = useState({
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
        images: [] as string[],
    });
    const [newImageUrl, setNewImageUrl] = useState('');
    const [composition, setComposition] = useState([{ name: '', value: '' }]);
    const [categories, setCategories] = useState<any[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [filteredSubcategories, setFilteredSubcategories] = useState<any[]>([]);

    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            try {
                const usedId = effectiveId;
                if (!usedId || usedId === 'undefined') {
                    setMedicine(null);
                    setApiError({ status: 400, body: { success: false, error: 'Invalid id passed to client', details: usedId } });
                    return;
                }
                const res = await fetch(`/api/medicines/${usedId}`);
                const status = res.status;
                let json: any = null;
                try {
                    json = await res.json();
                } catch (e) {
                    json = null;
                }
                if (!mounted) return;
                if (json?.success) {
                    const data = json.data;
                    setMedicine(data);
                    setForm({
                        name: data.name ?? '',
                        description: data.description ?? '',
                        manufacturer: data.manufacturer ?? '',
                        category: data.category ?? 'Tablet',
                        categoryId: data.categoryId ?? '',
                        subCategoryId: data.subCategoryId ?? '',
                        price: data.price ?? '',
                        purchasePrice: data.purchasePrice ?? '',
                        mrp: data.mrp ?? '',
                        discount: data.discount ?? 0,
                        stock: data.stock ?? '',
                        expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString().slice(0, 10) : '',
                        batchNumber: data.batchNumber ?? '',
                        isOTC: data.isOTC ?? false,
                        requiresPrescription: data.requiresPrescription ?? true,
                        images: data.images ?? [],
                    });
                    setComposition(Array.isArray(data.composition) ? data.composition : [{ name: '', value: '' }]);
                    setApiError(null);
                } else {
                    setMedicine(null);
                    setApiError({ status, body: json });
                }
            } catch (err) {
                setMedicine(null);
                setApiError({ status: 0, body: String(err) });
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, [id]);

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
        if (name === 'categoryId') {
            newForm.subCategoryId = '';
        }
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

    const addImageUrl = () => {
        const url = newImageUrl.trim();
        if (!url) return;
        setForm(prev => ({ ...prev, images: [...(prev.images || []), url] }));
        setNewImageUrl('');
    };

    const removeImageAt = (idx: number) => {
        setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
    };

    const handleCompositionChange = (idx: number, field: string, value: string) => {
        setComposition(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
    };
    const addCompositionRow = () => setComposition(prev => [...prev, { name: '', value: '' }]);
    const removeCompositionRow = (idx: number) => setComposition(prev => prev.filter((_, i) => i !== idx));

    function handleCancel() {
        if (typeof window !== 'undefined') window.history.back();
    }

    // buildPayload removed; payload is built directly in handleSubmit

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const payload = {
            ...form,
            composition,
            price: Number(form.price),
            purchasePrice: Number(form.purchasePrice),
            mrp: Number(form.mrp),
            discount: Number(form.discount),
            stock: Number(form.stock),
            expiryDate: new Date(form.expiryDate),
            categoryId: form.categoryId || undefined,
            subCategoryId: form.subCategoryId || undefined,
            finalUpdate: true,
        };
        fetch(`/api/medicines/${effectiveId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })
            .then(async res => {
                const json = await res.json();
                if (json.success) {
                    alert('Medicine updated successfully!');
                } else {
                    alert('Update failed: ' + (json.error || 'Unknown error'));
                }
            })
            .catch(err => {
                alert('Update failed: ' + err);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    if (loading) return <div className="p-6">Loading...</div>;
    if (!medicine) {
        return (
            <div className="p-6">
                <div className="text-lg font-semibold">Medicine not found.</div>
                <div className="text-sm text-gray-600 mt-2">Using id: <strong>{effectiveId ?? String(id)}</strong></div>
                {apiError && (
                    <div className="mt-3 text-sm text-red-600">
                        <div><strong>API status:</strong> {apiError.status}</div>
                        <div><strong>Response:</strong> <pre className="whitespace-pre-wrap">{JSON.stringify(apiError.body, null, 2)}</pre></div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <HeaderWithAction
                    title="Edit Medicine"
                    subtitle="Update medicine details"
                    showBack={true}
                    showSearch={false}
                />
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-8 max-w-3xl w-full">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Medicine Images (URLs)</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                placeholder="https://example.com/image.jpg"
                                value={newImageUrl}
                                onChange={e => setNewImageUrl(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                            />
                            <button
                                type="button"
                                onClick={addImageUrl}
                                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                            >
                                <MdAdd size={20} /> Add
                            </button>
                        </div>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {form.images.map((url, idx) => (
                                <div key={idx} className="relative group">
                                    <img
                                        src={url}
                                        alt={`preview-${idx}`}
                                        className="w-16 h-16 object-cover rounded border shadow"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImageAt(idx)}
                                        className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-red-500 border shadow-md flex items-center justify-center group-hover:scale-110 transition"
                                        aria-label={`Remove image ${idx}`}
                                    >
                                        <MdDelete size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
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
                                        {cat.name} {cat.isOTC ? '(OTC)' : ''}
                                    </option>
                                ))}
                            </select>
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
                        <div className="flex flex-col gap-2">
                            {composition.map((c, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row gap-2 items-center w-full">
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        value={c.name}
                                        onChange={e => handleCompositionChange(idx, 'name', e.target.value)}
                                        className="border rounded px-2 py-2 flex-1 w-full sm:w-auto"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Value"
                                        value={c.value}
                                        onChange={e => handleCompositionChange(idx, 'value', e.target.value)}
                                        className="border rounded px-2 py-2 flex-1 w-full sm:w-auto"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeCompositionRow(idx)}
                                        className="text-red-500 hover:text-red-700 p-2 rounded-full flex items-center justify-center"
                                        aria-label="Remove composition"
                                    >
                                        <MdDelete size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addCompositionRow}
                            className="text-green-600 mt-2 flex items-center gap-2 font-semibold"
                        >
                            <MdAdd size={20} /> Add Composition
                        </button>
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
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                            <MdSave size={22} /> {loading ? 'Saving...' : 'Save Medicine'}
                        </button>
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium flex items-center justify-center gap-2"
                        >
                            <MdArrowBack size={22} /> Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
