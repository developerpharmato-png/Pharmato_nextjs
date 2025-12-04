"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const EditMedicineModal = dynamic(() => import("../EditMedicineModal"), { ssr: false });
import { useParams } from "next/navigation";
import HeaderWithAction from '../../components/HeaderWithAction';

type TabKey = 'overview' | 'pricing' | 'inventory' | 'composition' | 'related';

// Updated to use /api/customer/medicines/detail/{id}
export default function MedicineDetailPage() {
    const { id } = useParams();
    const [medicine, setMedicine] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showRelatedPopup, setShowRelatedPopup] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('overview');
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    // Ensure Material Icons font is available for this page
    useEffect(() => {
        if (typeof document === 'undefined') return;
        if (!document.getElementById('material-icons-stylesheet')) {
            const link = document.createElement('link');
            link.id = 'material-icons-stylesheet';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
            document.head.appendChild(link);
        }
    }, []);

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

    if (loading) return <div className="p-6">Loading...</div>;
    if (!medicine) return <div className="p-6">Medicine not found.</div>;

    const images: string[] = medicine.images || [];

    return (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {/* Header + Sticky action bar */}
            <HeaderWithAction
                title={medicine.name}
                subtitle={medicine.manufacturer || ''}
                showBack={false}
                showSearch={false}
                rightNode={(
                    <div className="flex items-center gap-2">
                        {/* Desktop: labeled buttons */}
                        <a href={`/dashboard/medicines/${id}/edit`} className="hidden sm:inline-flex items-center gap-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm font-semibold">
                            <span className="material-icons text-base">edit</span>
                            <span>Edit</span>
                        </a>
                        <button className={`hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold ${medicine.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            <span className="material-icons text-base">{medicine.isActive ? 'check_circle' : 'highlight_off'}</span>
                            <span>{medicine.isActive ? 'Active' : 'Inactive'}</span>
                        </button>

                        {/* Mobile: compact icon buttons */}
                        <a href={`/dashboard/medicines/${id}/edit`} className="sm:hidden inline-flex items-center justify-center w-10 h-10 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full">
                            <span className="material-icons">edit</span>
                        </a>
                        <button className={`sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-full ${medicine.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} aria-label="Toggle active">
                            <span className="material-icons">{medicine.isActive ? 'check_circle' : 'highlight_off'}</span>
                        </button>
                    </div>
                )}
            />

            <div className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: image gallery */}
                <div className="md:col-span-1">
                    <div className="rounded-lg overflow-hidden border bg-gray-50">
                        {images.length > 0 ? (
                            <button type="button" onClick={() => setLightboxIndex(0)} className="w-full block">
                                <img src={images[0]} alt={medicine.name} className="w-full h-56 sm:h-72 md:h-80 object-cover" />
                            </button>
                        ) : (
                            <div className="w-full h-56 sm:h-72 md:h-80 flex items-center justify-center text-6xl text-green-600">
                                <span className="material-icons text-6xl">medication</span>
                            </div>
                        )}
                    </div>
                    <div className="mt-3 overflow-x-auto">
                        <div className="inline-flex gap-2 items-center">
                            {images.length > 0 ? images.map((img, idx) => (
                                <button key={idx} onClick={() => setLightboxIndex(idx)} className="w-20 h-20 rounded-md overflow-hidden border flex-shrink-0">
                                    <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                                </button>
                            )) : (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span className="material-icons text-base">photo_camera</span>
                                    <span>No images</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: info + tabs */}
                <div className="md:col-span-2">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                            <div className="text-gray-700 text-sm sm:text-base mb-3">{medicine.description}</div>
                            <div className="flex flex-wrap gap-2 mb-3 items-center">
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                                    <span className="material-icons text-sm">category</span>
                                    <span>{medicine.categoryId?.name || medicine.category}</span>
                                </span>
                                {medicine.subCategoryId?.name && (
                                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">
                                        <span className="material-icons text-sm">subdirectory_arrow_right</span>
                                        <span>{medicine.subCategoryId.name}</span>
                                    </span>
                                )}
                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${medicine.isOTC ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    <span className="material-icons text-sm">{medicine.isOTC ? 'local_pharmacy' : 'medical_services'}</span>
                                    <span>OTC: {medicine.isOTC ? 'Yes' : 'No'}</span>
                                </span>
                            </div>
                        </div>

                        <div className="w-full md:w-64">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-gray-50 p-3 rounded-md text-center flex flex-col items-center gap-1">
                                    <span className="material-icons text-green-600">attach_money</span>
                                    <div className="text-xs text-gray-500">Price</div>
                                    <div className="text-lg font-bold text-green-700">₹{medicine.price}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md text-center flex flex-col items-center gap-1">
                                    <span className="material-icons text-gray-600">inventory_2</span>
                                    <div className="text-xs text-gray-500">Stock</div>
                                    <div className="text-sm font-semibold">{medicine.stock} units</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md text-center flex flex-col items-center gap-1">
                                    <span className="material-icons text-orange-500">event</span>
                                    <div className="text-xs text-gray-500">Expiry</div>
                                    <div className="text-sm">{medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString() : '-'}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md text-center flex flex-col items-center gap-1">
                                    <span className="material-icons text-gray-600">local_offer</span>
                                    <div className="text-xs text-gray-500">Batch</div>
                                    <div className="text-sm">{medicine.batchNumber || '-'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sections: Overview, Pricing, Inventory, Composition, Related */}
                    <div className="mt-4 space-y-4">
                        {/* Overview / Highlights */}
                        <section className="bg-white border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-800 inline-flex items-center gap-2"><span className="material-icons text-base">info</span> Overview</h2>
                                {/* small action can be added here if needed */}
                            </div>
                            <div className="mt-3 text-gray-700">{medicine.description}</div>
                            {medicine.highlights && medicine.highlights.length > 0 && (
                                <div className="mt-4">
                                    <div className="text-sm font-semibold text-gray-800 mb-2">Highlights</div>
                                    <div className="flex flex-wrap gap-2">
                                        {medicine.highlights.map((h: string, idx: number) => (
                                            <div key={idx} className="px-3 py-1 bg-yellow-50 text-yellow-800 rounded text-sm">{h}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Pricing */}
                        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white border rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-gray-600 inline-flex items-center gap-2"><span className="material-icons text-base">sell</span> Pricing</h3>
                                </div>
                                <div className="mt-3 grid grid-cols-1 gap-2">
                                    <div className="text-sm text-gray-500">MRP</div>
                                    <div className="text-lg font-semibold">₹{medicine.mrp || '-'}</div>
                                    <div className="text-sm text-gray-500 mt-3">Purchase Price</div>
                                    <div className="text-lg font-semibold">₹{medicine.purchasePrice || '-'}</div>
                                </div>
                            </div>

                            <div className="bg-white border rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-gray-600 inline-flex items-center gap-2"><span className="material-icons text-base">attach_money</span> Selling</h3>
                                </div>
                                <div className="mt-3">
                                    <div className="text-sm text-gray-500">Price</div>
                                    <div className="text-2xl font-bold text-green-700">₹{medicine.price}</div>
                                    <div className="text-sm text-gray-500 mt-2">Discount</div>
                                    <div className="text-sm">{medicine.discount ?? 0}%</div>
                                </div>
                            </div>
                        </section>

                        {/* Inventory */}
                        <section className="bg-white border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-600 inline-flex items-center gap-2"><span className="material-icons text-base">inventory_2</span> Inventory</h3>
                                <div className="text-sm text-gray-500">Status</div>
                            </div>
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-gray-50 p-3 rounded text-center">
                                    <div className="text-xs text-gray-500">Stock</div>
                                    <div className="text-lg font-semibold">{medicine.stock} units</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded text-center">
                                    <div className="text-xs text-gray-500">Expiry</div>
                                    <div className="text-sm">{medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString() : '-'}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded text-center">
                                    <div className="text-xs text-gray-500">Batch</div>
                                    <div className="text-sm">{medicine.batchNumber || '-'}</div>
                                </div>
                            </div>
                        </section>

                        {/* Composition */}
                        <section className="bg-white border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-600 inline-flex items-center gap-2"><span className="material-icons text-base">science</span> Composition</h3>
                            </div>
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {medicine.composition?.length ? medicine.composition.map((c: any, idx: number) => (
                                    <div key={idx} className="bg-gray-50 p-3 rounded-md">
                                        <div className="text-sm font-semibold">{c.name}</div>
                                        <div className="text-sm text-gray-600">{c.value}</div>
                                    </div>
                                )) : (
                                    <div className="text-sm text-gray-500">No composition data available.</div>
                                )}
                            </div>
                        </section>

                        {/* Related Products */}
                        <section className="bg-white border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-600 inline-flex items-center gap-2"><span className="material-icons text-base">link</span> Related Products</h3>
                                <button onClick={() => setShowRelatedPopup(true)} className="text-xs px-3 py-1 bg-blue-600 text-white rounded">Update</button>
                            </div>
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {medicine.relatedProducts?.map((prod: any) => (
                                    <div key={prod._id} className="bg-white border rounded-md shadow-sm overflow-hidden hover:shadow-md transition">
                                        <div className="h-36 w-full bg-gray-100">
                                            <img src={prod.images?.[0]} alt={prod.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="p-3">
                                            <div className="text-sm font-semibold truncate">{prod.name}</div>
                                            <div className="text-xs text-gray-500">{prod.manufacturer}</div>
                                            <div className="mt-2 flex items-center justify-between">
                                                <div className="text-green-700 font-bold">₹{prod.price}</div>
                                                {prod.mrp && prod.mrp > prod.price && <div className="text-xs text-gray-400 line-through">₹{prod.mrp}</div>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {showRelatedPopup && (
                <RelatedProductsPopup
                    categoryId={medicine.categoryId?._id || medicine.categoryId}
                    selected={medicine.relatedProducts?.map((prod: any) => prod._id) || []}
                    onClose={() => setShowRelatedPopup(false)}
                    onUpdate={handleUpdateRelatedProducts}
                />
            )}

            {/* Simple lightbox */}
            {lightboxIndex !== null && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={() => setLightboxIndex(null)}>
                    <div className="max-w-3xl max-h-[80vh] w-full p-4">
                        <img src={images[lightboxIndex]} alt={`lightbox-${lightboxIndex}`} className="w-full h-auto object-contain rounded" />
                    </div>
                </div>
            )}
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
