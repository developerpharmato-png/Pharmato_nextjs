"use client";
import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import { ErrorMessageCom } from "../../components/miniComponents";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MdArrowBack } from "react-icons/md";
import HeaderWithAction from "../../components/HeaderWithAction";
import Swal from "sweetalert2";
import { initialMedicineFormValues, medicineFormValidationSchema } from "./medicineFormUtil";

export default function MedicineForm() {
    const router = useRouter();
    // Removed duplicate uploading state declaration
    const formik = useFormik({
        initialValues: initialMedicineFormValues,
        validationSchema: medicineFormValidationSchema,
        onSubmit: async (values, { setSubmitting, setErrors }) => {
            setLoading(true);
            setError(null);
            try {
                // UI validation: Selling price must not exceed MRP
                const priceNum = Number(values.price);
                const mrpNum = Number(values.mrp);
                if (
                    !Number.isNaN(priceNum) &&
                    !Number.isNaN(mrpNum) &&
                    priceNum > mrpNum
                ) {
                    Swal.fire({
                        icon: "error",
                        title: "Invalid price",
                        text: "Selling price cannot be greater than MRP",
                    });
                    setLoading(false);
                    setSubmitting(false);
                    return;
                }
                // UI validation: Expiry date must not be in the past
                if (values.expiryDate) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const exp = new Date(values.expiryDate);
                    exp.setHours(0, 0, 0, 0);
                    if (exp < today) {
                        Swal.fire({
                            icon: "error",
                            title: "Invalid expiry date",
                            text: "Expiry Date cannot be a past date",
                        });
                        setLoading(false);
                        setSubmitting(false);
                        return;
                    }
                }
                if (!values.images || values.images.length === 0) {
                    Swal.fire({
                        icon: "error",
                        title: "Image required",
                        text: "Please upload a medicine image before submitting",
                    });
                    setLoading(false);
                    setSubmitting(false);
                    return;
                }
                if (values.images.length > 5) {
                    Swal.fire({
                        icon: "error",
                        title: "Too many images",
                        text: "You can upload up to 5 images only",
                    });
                    setLoading(false);
                    setSubmitting(false);
                    return;
                }
                const res = await fetch("/api/medicines", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...values,
                        composition,
                        highlights: (values.highlights || [])
                            .map((h) => (h || "").trim())
                            .filter((h) => h.length > 0),
                        price: Number(values.price),
                        purchasePrice: Number(values.purchasePrice),
                        mrp: Number(values.mrp),
                        discount: Number(values.discount),
                        stock: Number(values.stock),
                        expiryDate: new Date(values.expiryDate),
                        categoryId: values.categoryId || undefined,
                        subCategoryId: values.subCategoryId || undefined,
                        coverImage: values.coverImage || (values.images[0] ?? undefined),
                    }),
                });
                const data = await res.json();
                if (!data.success) {
                    setError(
                        Array.isArray(data.error) ? data.error.join(", ") : data.error
                    );
                } else {
                    Swal.fire({
                        toast: true,
                        position: "top-end",
                        icon: "success",
                        title: "Medicine created successfully",
                        showConfirmButton: false,
                        timer: 2000,
                    });
                    setTimeout(() => router.push("/dashboard/medicines"), 1000);
                }
            } catch (err) {
                setError("Failed to create medicine");
            } finally {
                setLoading(false);
                setSubmitting(false);
            }
        },
        validateOnChange: true,
        validateOnBlur: true,
    });
    const [uploading, setUploading] = useState(false);
    useEffect(() => {
        console.log(formik?.values, "formik");
        console.log(formik.errors, "formik");

    }, [formik]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length === 0) return;

        const currentCount = formik.values.images.length;
        if (currentCount + files.length > 5) {
            Swal.fire({
                icon: "error",
                title: "Too many images",
                text: `You can upload up to 5 images. Currently ${currentCount} uploaded.`,
            });
            const inp = document.getElementById(
                "medicine-image-input"
            ) as HTMLInputElement | null;
            if (inp) inp.value = "";
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

        setUploading(true);
        const uploadedUrls: string[] = [];
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
                if (data.success && data.url) uploadedUrls.push(data.url);
            } catch { }
        }
        setUploading(false);

        if (uploadedUrls.length > 0) {
            const newImages = [...formik.values.images, ...uploadedUrls];
            const nextCover =
                formik.values.coverImage && newImages.includes(formik.values.coverImage)
                    ? formik.values.coverImage
                    : formik.values.coverImage ?? newImages[0];
            formik.setFieldValue("images", newImages);
            formik.setFieldValue("coverImage", nextCover);
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: `Uploaded ${uploadedUrls.length} image(s)`,
                showConfirmButton: false,
                timer: 2000,
            });
        }
        const inp2 = document.getElementById(
            "medicine-image-input"
        ) as HTMLInputElement | null;
        if (inp2) inp2.value = "";
    };

    const handleDeleteImage = async (url: string) => {
        const res = await fetch("/api/cloudinary/delete-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: url }),
        });
        const data = await res.json();
        if (data.success) {
            const remaining = formik.values.images.filter((i) => i !== url);
            const nextCover =
                formik.values.coverImage === url
                    ? remaining[0] ?? undefined
                    : formik.values.coverImage;
            formik.setFieldValue("images", remaining);
            formik.setFieldValue("coverImage", nextCover);
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Image deleted",
                showConfirmButton: false,
                timer: 2000,
            });
        } else {
            Swal.fire({
                icon: "error",
                title: "Delete failed",
                text: data.error || "Failed to delete image",
            });
        }
    };
    const [composition, setComposition] = useState([{ name: "", value: "" }]);
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
        if (formik.values.categoryId) {
            const filtered = subcategories.filter(
                (sub) => sub.categoryId?._id === formik.values.categoryId
            );
            setFilteredSubcategories(filtered);
        } else {
            setFilteredSubcategories([]);
        }
    }, [formik.values.categoryId, subcategories]);

    useEffect(() => {
        const cat = categories.find((c) => c._id === formik.values.categoryId);
        const sub = subcategories.find(
            (s) => s._id === formik.values.subCategoryId
        );
        const derivedOTC = sub?.isOTC ?? cat?.isOTC ?? false;
        formik.setFieldValue("isOTC", derivedOTC);
        formik.setFieldValue("requiresPrescription", !derivedOTC);
    }, [
        formik.values.categoryId,
        formik.values.subCategoryId,
        categories,
        subcategories,
    ]);

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            setCategories(data.data || []);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const fetchSubcategories = async () => {
        try {
            const res = await fetch("/api/subcategories");
            const data = await res.json();
            setSubcategories(data.data || []);
        } catch (error) {
            console.error("Failed to fetch subcategories:", error);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        formik.handleChange(e);
        const { name, value, type } = e.target;
        // Prevent negative stock
        if (name === "stock") {
            const stockNum = Math.max(0, Number(value));
            formik.setFieldValue("stock", stockNum.toString());
        }
        // Reset subcategory when category changes
        if (name === "categoryId") {
            formik.setFieldValue("subCategoryId", "");
        }
        // Auto-calculate discount when price or mrp changes
        if (name === "price" || name === "mrp") {
            const priceNum = Number(name === "price" ? value : formik.values.price);
            const mrpNum = Number(name === "mrp" ? value : formik.values.mrp);
            if (mrpNum > 0 && priceNum >= 0 && mrpNum >= priceNum) {
                formik.setFieldValue(
                    "discount",
                    Math.round(((mrpNum - priceNum) / mrpNum) * 100)
                );
            } else {
                formik.setFieldValue("discount", 0);
            }
        }
    };

    const handleCompositionChange = (
        idx: number,
        field: string,
        value: string
    ) => {
        setComposition((prev) =>
            prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
        );
    };
    const addCompositionRow = () =>
        setComposition((prev) => [...prev, { name: "", value: "" }]);
    const removeCompositionRow = (idx: number) =>
        setComposition((prev) => prev.filter((_, i) => i !== idx));

    const handleHighlightChange = (idx: number, value: string) => {
        const newHighlights = [...formik.values.highlights];
        newHighlights[idx] = value;
        formik.setFieldValue("highlights", newHighlights);
    };
    const addHighlightRow = () =>
        formik.setFieldValue("highlights", [...formik.values.highlights, ""]);
    const removeHighlightRow = (idx: number) =>
        formik.setFieldValue(
            "highlights",
            formik.values.highlights.filter((_, i) => i !== idx)
        );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // UI validation: Selling price must not exceed MRP
            const priceNum = Number(formik.values.price);
            const mrpNum = Number(formik.values.mrp);
            if (
                !Number.isNaN(priceNum) &&
                !Number.isNaN(mrpNum) &&
                priceNum > mrpNum
            ) {
                Swal.fire({
                    icon: "error",
                    title: "Invalid price",
                    text: "Selling price cannot be greater than MRP",
                });
                setLoading(false);
                return;
            }
            // UI validation: Expiry date must not be in the past
            if (formik.values.expiryDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const exp = new Date(formik.values.expiryDate);
                exp.setHours(0, 0, 0, 0);
                if (exp < today) {
                    Swal.fire({
                        icon: "error",
                        title: "Invalid expiry date",
                        text: "Expiry Date cannot be a past date",
                    });
                    setLoading(false);
                    return;
                }
            }
            if (!formik.values.images || formik.values.images.length === 0) {
                Swal.fire({
                    icon: "error",
                    title: "Image required",
                    text: "Please upload a medicine image before submitting",
                });
                setLoading(false);
                return;
            }
            if (formik.values.images.length > 5) {
                Swal.fire({
                    icon: "error",
                    title: "Too many images",
                    text: "You can upload up to 5 images only",
                });
                setLoading(false);
                return;
            }
            const res = await fetch("/api/medicines", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formik.values,
                    composition,
                    highlights: (formik.values.highlights || [])
                        .map((h) => (h || "").trim())
                        .filter((h) => h.length > 0),
                    price: Number(formik.values.price),
                    purchasePrice: Number(formik.values.purchasePrice),
                    mrp: Number(formik.values.mrp),
                    discount: Number(formik.values.discount),
                    stock: Number(formik.values.stock),
                    expiryDate: new Date(formik.values.expiryDate),
                    categoryId: formik.values.categoryId || undefined,
                    subCategoryId: formik.values.subCategoryId || undefined,
                    coverImage:
                        formik.values.coverImage || (formik.values.images[0] ?? undefined),
                }),
            });
            const data = await res.json();
            if (!data.success) {
                setError(
                    Array.isArray(data.error) ? data.error.join(", ") : data.error
                );
            } else {
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Medicine created successfully",
                    showConfirmButton: false,
                    timer: 2000,
                });
                setTimeout(() => router.push("/dashboard/medicines"), 1000);
            }
        } catch (err) {
            setError("Failed to create medicine");
        } finally {
            setLoading(false);
        }
    };

    const selectedCategory = categories.find(
        (cat) => cat._id === formik.values.categoryId
    );
    const selectedSubcategory = subcategories.find(
        (sub) => sub._id === formik.values.subCategoryId
    );
    const todayStr = new Date().toISOString().split("T")[0];

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
                <form onSubmit={formik.handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                            Medicine Images *
                            <p className="text-xs text-gray-500">
                                Min 1, Max 5 images. Each ≤ 5MB.
                            </p>
                        </label>
                        <input
                            id="medicine-image-input"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            style={{ display: "none" }}
                        />
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    document.getElementById("medicine-image-input")?.click()
                                }
                                className="h-24 w-24 flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-md hover:bg-gray-200 transition"
                                title="Upload photos"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-8 h-8 text-gray-500"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3 16.5V7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8.25 12.75l2.25 3 3-4.5 4.5 6"
                                    />
                                </svg>
                            </button>
                            {uploading && <span className="text-blue-600">Uploading...</span>}
                        </div>
                        {formik.values.images.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1 justify-start w-fit">
                                {formik.values.images.map((img, idx) => (
                                    <div key={img} className="relative group h-24 w-24">
                                        <img
                                            src={img}
                                            alt={`Medicine ${idx + 1}`}
                                            className="h-24 w-24 object-cover rounded-md"
                                        />
                                        {formik.values.coverImage === img ? (
                                            <span className="absolute top-1 left-1 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded-md shadow-sm">
                                                Primary
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => formik.setFieldValue("coverImage", img)}
                                                className="absolute top-1 left-1 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded-md opacity-80 hover:opacity-100 shadow-sm"
                                                title="Set as primary"
                                            >
                                                Set Primary
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteImage(img)}
                                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-80 group-hover:opacity-100 shadow-sm"
                                            title="Delete image"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2}
                                                stroke="currentColor"
                                                className="w-3.5 h-3.5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-2 flex items-center gap-3"></div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                            Medicine Name *
                        </label>
                        <input
                            name="name"
                            value={formik.values.name}
                            onChange={handleChange}
                            onBlur={formik.handleBlur}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white text-black bg-white text-black"
                            placeholder="Enter medicine name"
                        />
                        {formik.touched.name && formik.errors.name && (
                            <ErrorMessageCom error={formik.errors.name} />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                            Description *
                        </label>
                        <textarea
                            name="description"
                            value={formik.values.description}
                            onChange={handleChange}
                            onBlur={formik.handleBlur}
                            rows={4}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white text-black"
                            placeholder="Enter medicine description and usage"
                        />
                        {formik.touched.description && formik.errors.description && (
                            <ErrorMessageCom error={formik.errors.description} />
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-black mb-2">
                                Manufacturer *
                            </label>
                            <input
                                name="manufacturer"
                                value={formik.values.manufacturer}
                                onChange={handleChange}
                                onBlur={formik.handleBlur}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white text-black"
                                placeholder="Manufacturer name"
                            />
                            {formik.touched.manufacturer && formik.errors.manufacturer && (
                                <ErrorMessageCom error={formik.errors.manufacturer} />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-black mb-2">
                                Form Type *
                            </label>
                            <select
                                name="category"
                                value={formik.values.category}
                                onChange={handleChange}
                                onBlur={formik.handleBlur}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white text-black"
                            >
                                {[
                                    "Tablet",
                                    "Capsule",
                                    "Syrup",
                                    "Injection",
                                    "Cream",
                                    "Drops",
                                    "Other",
                                ].map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                            {formik.touched.category && formik.errors.category && (
                                <ErrorMessageCom error={formik.errors.category} />
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-black mb-2">
                                Category
                            </label>
                            <select
                                name="categoryId"
                                value={formik.values.categoryId}
                                onChange={handleChange}
                                onBlur={formik.handleBlur}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white text-black"
                            >
                                <option value="">Select a category</option>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>
                                        {cat.name} {cat.isOTC ? "(OTC)" : ""}
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
                            <label className="block text-sm font-semibold text-black mb-2">
                                Subcategory
                            </label>
                            <select
                                name="subCategoryId"
                                value={formik.values.subCategoryId}
                                onChange={handleChange}
                                onBlur={formik.handleBlur}
                                disabled={!formik.values.categoryId}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white text-black disabled:bg-gray-100"
                            >
                                <option value="">Select a subcategory</option>
                                {filteredSubcategories.map((sub) => (
                                    <option key={sub._id} value={sub._id}>
                                        {sub.name} {sub.isOTC ? "(OTC)" : ""}
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
                            <label className="block text-sm font-semibold text-black mb-2">
                                Stock Quantity *
                            </label>
                            <input
                                name="stock"
                                type="text"
                                value={formik.values.stock}
                                onChange={handleChange}
                                onBlur={formik.handleBlur}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white text-black"
                                placeholder="0"
                            />
                            {formik.touched.stock && formik.errors.stock && (
                                <ErrorMessageCom error={formik.errors.stock} />
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-black mb-2">
                                MRP (₹) *
                            </label>
                            <input
                                name="mrp"
                                type="text"
                                step="0.01"
                                value={formik.values.mrp}
                                onChange={handleChange}
                                onBlur={formik.handleBlur}
                                className="w-full border bg-white text-black border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="MRP"
                            />
                            {formik.touched.mrp && formik.errors.mrp && (
                                <ErrorMessageCom error={formik.errors.mrp} />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-black mb-2">
                                Purchase Price (₹) *
                            </label>
                            <input
                                name="purchasePrice"
                                type="text"
                                step="0.01"
                                value={formik.values.purchasePrice}
                                onChange={handleChange}
                                onBlur={formik.handleBlur}
                                className="w-full border bg-white text-black border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                                placeholder="Purchase Price"
                            />
                            {formik.touched.purchasePrice && formik.errors.purchasePrice && (
                                <ErrorMessageCom error={formik.errors.purchasePrice} />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-black mb-2">
                                Selling Price (₹) *
                            </label>
                            <input
                                name="price"
                                type="text"
                                step="0.01"
                                value={formik.values.price}
                                onChange={handleChange}
                                onBlur={formik.handleBlur}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white text-black"
                                placeholder="Selling Price"
                            />
                            {formik.touched.price && formik.errors.price && (
                                <ErrorMessageCom error={formik.errors.price} />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-black mb-2">
                                Discount (%)
                            </label>
                            <input
                                name="discount"
                                type="text"
                                value={formik.values.discount}
                                readOnly
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-100 text-black"
                                placeholder="Discount %"
                            />
                        </div>
                    </div>
                    {/* ...existing fields below... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-black mb-2">
                                Expiry Date *
                            </label>
                            <input
                                name="expiryDate"
                                type="date"
                                value={formik.values.expiryDate}
                                onChange={handleChange}
                                onBlur={formik.handleBlur}
                                min={todayStr}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white text-black"
                            />
                            {formik.touched.expiryDate && formik.errors.expiryDate && (
                                <ErrorMessageCom error={formik.errors.expiryDate} />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-black mb-2">
                                Batch Number *
                            </label>
                            <input
                                name="batchNumber"
                                value={formik.values.batchNumber}
                                onChange={handleChange}
                                onBlur={formik.handleBlur}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white text-black"
                                placeholder="Batch number"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                            Composition
                        </label>
                        {composition.map((c, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={c.name}
                                    onChange={(e) =>
                                        handleCompositionChange(idx, "name", e.target.value)
                                    }
                                    className="border bg-white text-black rounded px-2 py-1 flex-1"
                                />
                                <input
                                    type="text"
                                    placeholder="Value"
                                    value={c.value}
                                    onChange={(e) =>
                                        handleCompositionChange(idx, "value", e.target.value)
                                    }
                                    className="border  bg-white text-black rounded px-2 py-1 flex-1"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeCompositionRow(idx)}
                                    className="text-red-500"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addCompositionRow}
                            className="text-green-600 mt-2"
                        >
                            + Add Composition
                        </button>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-black mb-2">
                            Highlights
                        </label>
                        {formik.values.highlights.length === 0 && (
                            <p className="text-xs text-gray-500 mb-2">
                                Add short bullet points to highlight key info.
                            </p>
                        )}
                        {formik.values.highlights.map((h, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder={`Highlight #${idx + 1}`}
                                    value={h}
                                    onChange={(e) => handleHighlightChange(idx, e.target.value)}
                                    onBlur={formik.handleBlur}
                                    className="border bg-white text-black rounded px-2 py-1 flex-1"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeHighlightRow(idx)}
                                    className="text-red-500"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addHighlightRow}
                            className="text-green-600 mt-2"
                        >
                            + Add Highlight
                        </button>
                    </div>
                    <div className="space-y-4 border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Medicine Classification
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="requiresPrescription"
                                    name="requiresPrescription"
                                    checked={formik.values.requiresPrescription}
                                    onChange={handleChange}
                                    onBlur={formik.handleBlur}
                                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                                />
                                <label
                                    htmlFor="requiresPrescription"
                                    className="text-sm font-medium text-black cursor-pointer"
                                >
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
                            {loading ? "Saving..." : "Save Medicine"}
                        </button>
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="px-6 py-3 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition font-medium flex items-center gap-2"
                        >
                            <MdArrowBack size={20} /> Back
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}