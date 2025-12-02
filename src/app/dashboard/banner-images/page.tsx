
"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from 'sweetalert2';

export default function BannerImagesDashboard() {
    const [images, setImages] = useState<string[]>([]);
    const [inputImages, setInputImages] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchImages = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/admin/banner-images");
            setImages(res.data.data?.images || []);
        } catch (err) {
            setError("Failed to fetch banner images");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        const urls = inputImages
            .split("\n")
            .map((url) => url.trim())
            .filter((url) => url);
        try {
            const res = await axios.post("/api/admin/banner-images", { images: urls });
            setImages(res.data.data?.images || []);
            setSuccess("Banner images updated successfully");
            setInputImages("");
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Banner images updated',
                showConfirmButton: false,
                timer: 2000
            });
        } catch (err: any) {
            setError(err?.response?.data?.message || "Error updating banner images");
            Swal.fire({
                icon: 'error',
                title: 'Failed to update images',
                text: err?.response?.data?.message || 'Unknown error',
            });
        }
        setLoading(false);
    };

    const handleDeleteImage = async (imageUrl: string) => {
        const result = await Swal.fire({
            title: 'Delete Image?',
            text: 'Are you sure you want to delete this image?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
        });
        if (!result.isConfirmed) return;
        setLoading(true);
        try {
            const res = await axios.delete(`/api/admin/banner-images`, { data: { image: imageUrl } });
            if (res.data.success) {
                setImages(prev => prev.filter(img => img !== imageUrl));
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
                    title: 'Failed to delete image',
                    text: res.data.error || 'Unknown error',
                });
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Failed to delete image',
                text: 'Network error',
            });
        }
        setLoading(false);
    };

    return (
        <div className="w-full min-h-screen bg-gray-50 py-8 px-2 sm:px-6">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Banner Images</h2>
                <form
                    onSubmit={handleUpdate}
                    className="mb-8 flex flex-col gap-4"
                >
                    <label className="font-semibold text-base sm:text-lg mb-1">Enter image URLs (one per line):</label>
                    <textarea
                        value={inputImages}
                        onChange={(e) => setInputImages(e.target.value)}
                        rows={5}
                        className="border border-gray-300 px-3 py-2 rounded w-full focus:outline-none focus:border-blue-500 text-base font-mono"
                        placeholder="https://example.com/image1.jpg\nhttps://example.com/image2.jpg"
                    />
                    <button
                        type="submit"
                        className="px-5 py-2 rounded font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors self-end"
                        disabled={loading}
                    >
                        Update Banner Images
                    </button>
                    {error && <div className="text-red-600 font-medium">{error}</div>}
                    {success && <div className="text-green-600 font-medium">{success}</div>}
                </form>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {images.length === 0 ? (
                        <div className="col-span-2 text-gray-400 text-base font-semibold text-center">
                            <div className="text-center py-10">
                                <div className="flex items-center justify-center mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-gray-300">
                                        <rect x="3" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 5 9-5" />
                                    </svg>
                                </div>
                                <p className="text-gray-500 text-base">No images found.</p>
                            </div>
                        </div>
                    ) : (
                        images.map((url, idx) => (
                            <div
                                key={idx}
                                className="rounded-lg overflow-hidden shadow bg-white flex flex-col items-center justify-center p-3 border border-gray-100 relative"
                            >
                                <img
                                    src={url}
                                    alt={`Banner ${idx + 1}`}
                                    className="w-full h-40 object-cover rounded mb-2 border cursor-pointer"
                                    style={{ background: "#f0f0f0" }}
                                />
                                <button
                                    className="absolute top-2 right-2 bg-white border border-gray-300 text-gray-500 rounded-full p-1 shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                                    title="Delete image"
                                    onClick={() => handleDeleteImage(url)}
                                    disabled={loading}
                                    aria-label="Delete image"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                <div className="font-mono text-xs text-blue-700 break-all text-center">
                                    {url}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {loading && <div className="mt-6 text-gray-500 text-base font-semibold">Loading...</div>}
            </div>
        </div>
    );
}
