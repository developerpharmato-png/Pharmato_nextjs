"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

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
        } catch (err: any) {
            setError(err?.response?.data?.message || "Error updating banner images");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto mt-10 p-8 bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl shadow-xl border border-gray-200">
            <h2 className="text-3xl font-extrabold text-green-700 flex items-center gap-2 mb-8">
                <span>🖼️</span> Banner Images
            </h2>
            <form
                onSubmit={handleUpdate}
                className="mb-8 bg-white p-6 rounded-xl shadow flex flex-col gap-4"
            >
                <label className="font-bold text-lg mb-2">Enter image URLs (one per line):</label>
                <textarea
                    value={inputImages}
                    onChange={(e) => setInputImages(e.target.value)}
                    rows={5}
                    className="border-2 border-green-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:border-green-500 text-lg font-mono"
                    placeholder="https://example.com/image1.jpg\nhttps://example.com/image2.jpg"
                />
                <button
                    type="submit"
                    className="px-6 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow self-end"
                    disabled={loading}
                >
                    Update Banner Images
                </button>
                {error && <div className="text-red-600 font-semibold">{error}</div>}
                {success && <div className="text-green-600 font-semibold">{success}</div>}
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {images.length === 0 ? (
                    <div className="col-span-2 text-gray-400 text-lg font-semibold text-center">
                        No banner images found.
                    </div>
                ) : (
                    images.map((url, idx) => (
                        <div
                            key={idx}
                            className="rounded-xl overflow-hidden shadow-lg bg-white flex flex-col items-center justify-center p-4 border border-gray-200"
                        >
                            <img
                                src={url}
                                alt={`Banner ${idx + 1}`}
                                className="w-full h-48 object-cover rounded-xl mb-2 border"
                                style={{ background: "#f0f0f0" }}
                            />
                            <div className="font-mono text-sm text-blue-700 break-all text-center">
                                {url}
                            </div>
                        </div>
                    ))
                )}
            </div>
            {loading && <div className="mt-6 text-gray-500 text-lg font-semibold">Loading...</div>}
        </div>
    );
}
