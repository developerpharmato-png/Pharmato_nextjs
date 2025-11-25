"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// Updated to use /api/customer/medicines/detail/{id}
export default function MedicineDetailPage() {
    const { id } = useParams();
    const [medicine, setMedicine] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showRelatedPopup, setShowRelatedPopup] = useState(false);

    useEffect(() => {
        async function fetchMedicine() {
            try {
                const res = await fetch(`/api/medicines/${id}`);
                const data = await res.json();
                setMedicine(data.data);
            } catch (err) {
                setMedicine(null);
            } finally {
                setLoading(false);
            }
        }
        fetchMedicine();
    }, [id]);

    const handleUpdateRelatedProducts = async (ids: string[]) => {
        try {
            await fetch('/api/medicines/update-related', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medicineId: id, relatedProductIds: ids })
            });
        } catch (err) { }
        setShowRelatedPopup(false);
        // Refetch medicine detail to update UI
        setLoading(true);
        try {
            const res = await fetch(`/api/medicines/${id}`);
            const data = await res.json();
            setMedicine(data.data);
        } catch (err) {
            setMedicine(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!medicine) return <div className="p-8">Medicine not found.</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <button
                onClick={() => window.history.back()}
                className="mb-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg shadow inline-flex items-center gap-2"
            >
                <span className="text-lg">←</span> Back
            </button>
            <div className="bg-white rounded-2xl shadow-xl p-8 flex gap-10">
                <div className="flex flex-col gap-4 items-center">
                    {medicine.images && medicine.images.length > 0 ? (
                        <img src={medicine.images[0]} alt={medicine.name} className="w-64 h-64 object-cover rounded-2xl shadow border-2 border-green-100" />
                    ) : (
                        <div className="w-64 h-64 bg-gray-100 rounded-2xl flex items-center justify-center text-6xl text-green-400 shadow">💊</div>
                    )}
                    <div className="flex gap-2 mt-2">
                        {medicine.images?.slice(1).map((img: string, idx: number) => (
                            <img key={idx} src={img} alt="thumb" className="w-16 h-16 object-cover rounded-lg border shadow" />
                        ))}
                    </div>
                </div>
                <div className="flex-1 flex flex-col gap-3">
                    <h1 className="text-4xl font-extrabold text-green-700 mb-1 flex items-center gap-2">
                        {medicine.name}
                        {medicine.isActive ? <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Active</span> : <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Inactive</span>}
                    </h1>
                    <div className="text-lg text-gray-600 mb-2">{medicine.description}</div>
                    <div className="flex gap-4 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">{medicine.categoryId?.name || medicine.category}</span>
                        {medicine.subCategoryId?.name && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">{medicine.subCategoryId.name}</span>
                        )}
                    </div>
                    <div className="flex gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${medicine.isOTC ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>OTC: {medicine.isOTC ? 'Yes' : 'No'}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${medicine.isPrescription ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-500'}`}>Prescription: {medicine.isPrescription ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex gap-6 mb-2">
                        <span className="text-xl font-bold text-green-700">₹{medicine.price}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${medicine.stock > 50 ? 'bg-green-100 text-green-800' : medicine.stock > 20 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{medicine.stock} units</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">Expiry: {new Date(medicine.expiryDate).toLocaleDateString()}</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">Batch: {medicine.batchNumber}</span>
                    </div>
                    <div className="flex gap-2 mb-2 flex-wrap">
                        {medicine.highlights?.map((h: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">{h}</span>
                        ))}
                    </div>
                    <div className="mb-2">
                        <span className="font-semibold">Rating:</span> {medicine.rating ? <span className="ml-2 text-yellow-600 font-bold">⭐ {medicine.rating.average} <span className="text-xs text-gray-500">({medicine.rating.count})</span></span> : <span className="text-gray-400">-</span>}
                    </div>
                    <div className="mb-2">
                        <span className="font-semibold">Composition:</span>
                        <div className="flex gap-2 flex-wrap mt-1">
                            {medicine.composition?.map((c: any, idx: number) => (
                                <span key={idx} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-xs font-medium">{c.name}: {c.value}</span>
                            ))}
                        </div>
                    </div>
                    <div className="mb-2">
                        <div className="flex items-center gap-4">
                            <span className="font-semibold">Related Products:</span>
                            <button
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-semibold shadow"
                                onClick={() => setShowRelatedPopup(true)}
                            >
                                Update
                            </button>
                        </div>
                        <div className="flex gap-4 mt-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                            {medicine.relatedProducts?.map((prod: any) => (
                                <div key={prod._id} className="bg-white border rounded-xl shadow-sm w-52 min-h-[220px] flex flex-col overflow-hidden hover:shadow-lg hover:scale-105 transition-transform relative">
                                    {prod.discount > 0 && (
                                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">{prod.discount}% OFF</span>
                                    )}
                                    <img src={prod.images?.[0]} alt={prod.name} className="h-28 w-full object-cover" />
                                    <div className="flex-1 flex flex-col justify-between p-2">
                                        <div>
                                            <div className="font-bold text-base mb-1 truncate">{prod.name}</div>
                                            <div className="text-xs text-gray-500 mb-1">{prod.manufacturer}</div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-green-700 font-bold text-base">₹{prod.price}</span>
                                            {prod.mrp && prod.mrp > prod.price && (
                                                <span className="text-gray-400 line-through text-xs">₹{prod.mrp}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-end mt-2">
                                            <span className="text-green-700 text-xl" style={{ paddingRight: '6px', paddingBottom: '4px' }}>
                                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-shopping-cart" style={{ display: 'block' }}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61l1.38-7.39H6" /></svg>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {showRelatedPopup && (
                            <RelatedProductsPopup
                                categoryId={medicine.categoryId?._id || medicine.categoryId}
                                selected={medicine.relatedProducts?.map((prod: any) => prod._id) || []}
                                onClose={() => setShowRelatedPopup(false)}
                                onUpdate={handleUpdateRelatedProducts}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function RelatedProductsPopup({ categoryId, selected, onClose, onUpdate }: { categoryId: string, selected: string[], onClose: () => void, onUpdate: (ids: string[]) => void }) {
    const [products, setProducts] = React.useState<{ _id: string, name: string }[]>([]);
    const [checked, setChecked] = React.useState<string[]>(selected);
    const [loading, setLoading] = React.useState(true);
    // Get current medicineId from selected (first one is always the current medicine)
    const currentMedicineId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '';

    React.useEffect(() => {
        fetch(`/api/medicines/by-category/${categoryId}`)
            .then(res => res.json())
            .then(data => {
                // Exclude current medicine from list
                const filtered = (data.data || []).filter((prod: any) => prod._id !== currentMedicineId);
                setProducts(filtered);
                setLoading(false);
            });
    }, [categoryId, currentMedicineId]);

    const handleCheck = (id: string) => {
        if (checked.includes(id)) {
            setChecked(prev => prev.filter(x => x !== id));
        } else {
            if (checked.length < 5) {
                setChecked(prev => [...prev, id]);
            }
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.2)' }}>
            <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Select Related Products</h2>
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                        {products.map(prod => (
                            <label key={prod._id} className={`flex items-center gap-3 py-2 px-2 rounded hover:bg-gray-100 cursor-pointer ${checked.length >= 5 && !checked.includes(prod._id) ? 'opacity-50 pointer-events-none' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={checked.includes(prod._id)}
                                    onChange={() => handleCheck(prod._id)}
                                    className="accent-green-600 w-4 h-4"
                                    disabled={checked.length >= 5 && !checked.includes(prod._id)}
                                />
                                <span className="font-medium text-gray-800 text-base">{prod.name}</span>
                            </label>
                        ))}
                        {checked.length >= 5 && (
                            <div className="text-red-600 text-xs mt-2">Maximum 5 products can be selected.</div>
                        )}
                    </div>
                )}
                <div className="flex gap-4 mt-6 justify-end">
                    <button className="px-4 py-2 bg-gray-200 rounded" onClick={onClose}>Cancel</button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={() => onUpdate(checked)}>Update</button>
                </div>
            </div>
        </div>
    );
}
