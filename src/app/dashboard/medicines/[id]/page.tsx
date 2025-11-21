"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function MedicineDetailPage() {
    const { id } = useParams();
    const [medicine, setMedicine] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
                        <span className="font-semibold">Related Products:</span>
                        <div className="flex gap-3 mt-2 flex-wrap">
                            {medicine.relatedProducts?.map((prod: any) => (
                                <div key={prod._id} className="border rounded-xl p-3 w-36 text-center bg-gray-50 shadow hover:scale-105 transition-transform">
                                    <img src={prod.images?.[0]} alt={prod.name} className="h-14 w-14 object-cover mx-auto mb-2 rounded-lg" />
                                    <div className="text-xs font-semibold truncate">{prod.name}</div>
                                    <div className="text-xs text-green-700 font-bold">₹{prod.price}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
