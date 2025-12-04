"use client";
import React, { useState } from "react";
import { CustomButton } from "../components/miniComponents";

export interface EditMedicineModalProps {
    medicine: any;
    onClose: () => void;
    onUpdated: (updated: any) => void;
}

export default function EditMedicineModal({ medicine, onClose, onUpdated }: EditMedicineModalProps) {
    const [form, setForm] = useState<{
        name: string;
        description: string;
        price: string;
        stock: string;
        expiryDate: string;
        batchNumber: string;
        isOTC: boolean;
        requiresPrescription: boolean;
        images: any[];
        imageUrls: string[];
    }>({
        name: medicine.name || "",
        description: medicine.description || "",
        price: medicine.price || "",
        stock: medicine.stock || "",
        expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().slice(0, 10) : "",
        batchNumber: medicine.batchNumber || "",
        isOTC: medicine.isOTC || false,
        requiresPrescription: medicine.isPrescription || false,
        images: medicine.images || [],
        imageUrls: [],
    });
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setImageFiles(files);
    };

    const handleImageUrlsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const urls = e.target.value.split('\n').map(url => url.trim()).filter(url => url);
        setForm(prev => ({ ...prev, imageUrls: urls }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        // Log the payload before sending
        const debugPayload: any = { ...form };
        debugPayload.images = imageFiles;
        console.log("Edit Medicine Payload:", debugPayload);
        try {
            const formData = new FormData();
            Object.entries(form).forEach(([key, value]) => {
                if (key !== "images") formData.append(key, value as any);
            });
            imageFiles.forEach(file => formData.append("images", file));
            const res = await fetch(`/api/medicines/${medicine._id}`, {
                method: "PUT",
                body: formData,
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Update failed");
            onUpdated(data.data);
            onClose();
        } catch (err: any) {
            setError(err.message || "Update failed");
        } finally {
            setLoading(false);
        }
    };
  
    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-md p-8 w-[900px] max-w-full relative max-h-[80vh] overflow-y-auto">
                <button className="absolute top-4 right-4 text-red-500 text-xl font-bold" onClick={onClose}>×</button>
                <h2 className="text-4xl font-bold text-gray-800 mb-2">Edit Medicine 💊</h2>
                <p className="text-gray-600 mb-6">Update medicine details below</p>
                <form onSubmit={handleSubmit} className="space-y-6 ">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Medicine Images</label>
                        <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {(imageFiles.length > 0 ? imageFiles : form.images).map((img: any, idx: number) => (
                                <img key={idx} src={typeof img === "string" ? img : URL.createObjectURL(img)} alt={`preview-${idx}`} className="w-16 h-16 object-cover rounded border shadow" />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Medicine Name *</label>
                        <input name="name" value={form.name} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition" placeholder="Enter medicine name" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                        <textarea name="description" value={form.description} onChange={handleChange} required rows={4} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition" placeholder="Enter medicine description and usage" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity *</label>
                            <input name="stock" type="number" value={form.stock} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition" placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Selling Price (₹) *</label>
                            <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition" placeholder="Selling Price" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date *</label>
                            <input name="expiryDate" type="date" value={form.expiryDate} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Batch Number *</label>
                            <input name="batchNumber" value={form.batchNumber} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition" placeholder="Batch number" />
                        </div>
                    </div>
                    <div className="space-y-4 border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-800">Medicine Classification</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <input type="checkbox" id="isOTC" name="isOTC" checked={form.isOTC} onChange={handleChange} className="w-5 h-5 text-green-600 rounded focus:ring-green-500" />
                                <label htmlFor="isOTC" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <span>🟢 Over-the-Counter (OTC)</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">Can be purchased without prescription</p>
                                </label>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <input type="checkbox" id="requiresPrescription" name="requiresPrescription" checked={form.requiresPrescription} onChange={handleChange} className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500" />
                                <label htmlFor="requiresPrescription" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <span>📋 Requires Prescription</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">Prescription needed for purchase</p>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Or paste image URLs (one per line)</label>
                        <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-4 py-3 mt-1 focus:ring-2 focus:ring-green-500 focus:border-transparent transition" placeholder="https://..." value={form.imageUrls?.join('\n') || ''} onChange={handleImageUrlsChange} />
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {form.imageUrls?.map((url: string, idx: number) => (
                                <img key={idx} src={url} alt={`url-preview-${idx}`} className="w-16 h-16 object-cover rounded border shadow" />
                            ))}
                        </div>
                    </div>
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}
                    <div className="flex gap-4 pt-4">
                        <CustomButton
                            type="submit"
                            disabled={loading}
                            width="100%"
                            className="flex-1"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </CustomButton>
                        <CustomButton
                            type="button"
                            onClick={onClose}
                            width="120px"
                            className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                        >
                            Cancel
                        </CustomButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
