
"use client";
import React, { useEffect, useState, useRef } from "react";
// Simple modal for editing image metadata
function EditImageModal({ open, image, onSave, onClose }: { open: boolean, image: any, onSave: (img: any) => void, onClose: () => void }) {
    const [alt, setAlt] = useState(image?.alt || "");
    const [targetScreen, setTargetScreen] = useState(image?.targetScreen || "");
    useEffect(() => {
        setAlt(image?.alt || "");
        setTargetScreen(image?.targetScreen || "");
    }, [image]);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-xl p-6 w-80 relative">
                <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={onClose}>&times;</button>
                <h3 className="text-lg font-bold mb-4">Edit Banner Image</h3>
                <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Alt Text</label>
                    <input type="text" className="w-full border rounded px-2 py-1" value={alt} onChange={e => setAlt(e.target.value)} />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Target Screen/URL</label>
                    <input type="text" className="w-full border rounded px-2 py-1" value={targetScreen} onChange={e => setTargetScreen(e.target.value)} />
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded font-semibold w-full" onClick={() => onSave({ ...image, alt, targetScreen })}>Save</button>
            </div>
        </div>
    );
}
import axios from "axios";
import Swal from 'sweetalert2';


export default function BannerImagesDashboard() {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    // images: { url, targetScreen, alt, ... }
    const [images, setImages] = useState<any[]>([]);
    const [editModal, setEditModal] = useState<{ open: boolean, idx: number | null }>({ open: false, idx: null });
    const [inputImages, setInputImages] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Image upload handler (max 3 images, show size, cancel/delete button)
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length === 0) return;

        // Validate count (max 3)
        if (images.length + files.length > 3) {
            Swal.fire({
                icon: "error",
                title: "Too many images",
                text: `You can upload up to 3 images. Currently ${images.length} uploaded.`,
            });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
        ];
        const maxSize = 5 * 1024 * 1024;

        setLoading(true);
        let uploadedObjs: any[] = [];
        for (const file of files) {
            if (!allowedTypes.includes(file.type)) {
                Swal.fire({
                    icon: "error",
                    title: "Invalid file type",
                    text: "Please upload only image files (JPEG, PNG, GIF, WebP, SVG)",
                });
                continue;
            }
            if (file.size > maxSize) {
                Swal.fire({
                    icon: "error",
                    title: "File too large",
                    text: "Please upload an image smaller than 5MB",
                });
                continue;
            }
            const uploadFormData = new FormData();
            uploadFormData.append("file", file);
            try {
                const res = await fetch("/api/cloudinary/upload-image", {
                    method: "POST",
                    body: uploadFormData,
                });
                const data = await res.json();
                if (data.success && data.url) {
                    uploadedObjs.push({ url: data.url });
                }
            } catch { }
        }
        setLoading(false);

        if (uploadedObjs.length > 0) {
            // Update images array and backend
            const newImages = [...images, ...uploadedObjs];
            setImages(newImages);
            try {
                await axios.post("/api/admin/banner-images", { images: newImages });
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: `Uploaded ${uploadedObjs.length} image(s)`,
                    showConfirmButton: false,
                    timer: 2000,
                });
            } catch {
                Swal.fire({
                    icon: "error",
                    title: "Failed to update images",
                    text: "Could not update images on server.",
                });
            }
        }
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = "";
    };


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


    // Optionally, you can update handleUpdate to accept JSON input for advanced editing
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        let parsed: any[] = [];
        try {
            parsed = JSON.parse(inputImages);
            if (!Array.isArray(parsed)) throw new Error();
        } catch {
            setError("Input must be a valid JSON array of objects");
            setLoading(false);
            return;
        }
        try {
            const res = await axios.post("/api/admin/banner-images", { images: parsed });
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
            const apiMsg = err?.response?.data?.message || err?.response?.data?.error;
            setError(apiMsg || "Error updating banner images");
            Swal.fire({
                icon: 'error',
                title: 'Failed to update images',
                text: apiMsg || 'Unknown error',
            });
        }
        setLoading(false);
    };


    const handleDeleteImage = async (imageObj: any) => {
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
            // Delete from Cloudinary
            const resCloud = await fetch("/api/cloudinary/delete-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: imageObj.url }),
            });
            const dataCloud = await resCloud.json();
            if (!dataCloud.success) {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to delete image from Cloudinary',
                    text: dataCloud.error || 'Unknown error',
                });
                setLoading(false);
                return;
            }
            // Remove from images array and update backend
            const newImages = images.filter(img => img.url !== imageObj.url);
            setImages(newImages);
            await axios.post("/api/admin/banner-images", { images: newImages });
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Image deleted',
                showConfirmButton: false,
                timer: 2000
            });
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
        <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-8 px-2 sm:px-6">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 sm:p-10 relative">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight flex items-center gap-2">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 5 9-5" /></svg>
                    Banner Images
                </h2>
                <form
                    onSubmit={e => e.preventDefault()}
                    className="mb-8 flex flex-col gap-6 relative bg-gray-50 rounded-xl shadow p-6"
                >
                    <button
                        type="button"
                        className="px-5 py-2 rounded-full font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors absolute top-0 right-0 mt-4 mr-4 z-10 shadow-lg flex items-center gap-2"
                        disabled={loading}
                        aria-label="Update Banner Images"
                        onClick={async () => {
                            setLoading(true);
                            setError("");
                            setSuccess("");
                            try {
                                await axios.post("/api/admin/banner-images", { images });
                                setSuccess("Banner images updated successfully");
                                Swal.fire({
                                    toast: true,
                                    position: 'top-end',
                                    icon: 'success',
                                    title: 'Banner images updated',
                                    showConfirmButton: false,
                                    timer: 2000
                                });
                            } catch (err) {
                                setError("Error updating banner images");
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Failed to update images',
                                    text: 'Unknown error',
                                });
                            }
                            setLoading(false);
                        }}
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Update Banner Images
                    </button>
                    <div className="flex items-center gap-4 mb-2 mt-10">
                        <input
                            ref={fileInputRef}
                            id="banner-image-input"
                            type="file"
                            accept="image/*"
                            multiple
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-12 w-44 flex items-center justify-center bg-blue-50 border-2 border-dashed border-blue-400 rounded-xl hover:bg-blue-100 transition duration-150 shadow font-semibold text-blue-700 gap-2"
                            aria-label="Upload Images"
                        >
                            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 12.75l2.25 3 3-4.5 4.5 6" /></svg>
                            Upload Images
                        </button>
                        {loading && <span className="ml-2"><svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg></span>}
                    </div>
                </form>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                    {images.length === 0 ? (
                        <div className="col-span-3 text-gray-400 text-base font-semibold text-center">
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
                        images.map((img, idx) => (
                            <div
                                key={idx}
                                className="relative group h-44 w-full flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden"
                            >
                                <img
                                    src={img.url}
                                    alt={img.alt || `Banner ${idx + 1}`}
                                    className="h-36 w-full object-cover rounded-xl border border-gray-100 shadow-sm transition-transform duration-200 group-hover:scale-105"
                                />
                                <span className="absolute bottom-2 left-2 bg-blue-700 text-white text-xs px-2 py-0.5 rounded-full shadow font-semibold opacity-90">
                                    {`Image ${idx + 1}`}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteImage(img)}
                                    disabled={loading}
                                    className="absolute top-2 right-2 bg-white border border-red-400 text-red-600 rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg transition duration-200 hover:bg-red-600 hover:text-white"
                                    title="Delete image"
                                    aria-label="Delete image"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditModal({ open: true, idx })}
                                    className="absolute bottom-2 right-2 bg-white border border-blue-400 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg transition duration-200 hover:bg-blue-600 hover:text-white"
                                    title="Edit image"
                                    aria-label="Edit image"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 113 3L7 19.5 3 21l1.5-4L16.5 3.5z" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
                {/* Edit Modal */}
                <EditImageModal
                    open={editModal.open}
                    image={editModal.idx !== null ? images[editModal.idx] : null}
                    onSave={async (updatedImg) => {
                        if (editModal.idx === null) return;
                        const newImages = images.map((img, i) => i === editModal.idx ? updatedImg : img);
                        setImages(newImages);
                        setEditModal({ open: false, idx: null });
                        setLoading(true);
                        try {
                            await axios.post("/api/admin/banner-images", { images: newImages });
                            Swal.fire({
                                toast: true,
                                position: 'top-end',
                                icon: 'success',
                                title: 'Banner image updated',
                                showConfirmButton: false,
                                timer: 2000
                            });
                        } catch {
                            Swal.fire({
                                icon: 'error',
                                title: 'Failed to update image',
                                text: 'Could not update image on server.',
                            });
                        }
                        setLoading(false);
                    }}
                    onClose={() => setEditModal({ open: false, idx: null })}
                />
            </div>
        </div>
    );
}
