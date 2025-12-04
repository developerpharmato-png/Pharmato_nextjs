"use client";
import React, { useEffect, useState } from "react";
import {
  CustomButton,
  ErrorMessageCom,
} from "../../../components/miniComponents";
import { MdAdd, MdDelete, MdArrowBack, MdSave } from "react-icons/md";
import { useParams } from "next/navigation";
import HeaderWithAction from "../../../components/HeaderWithAction";
import Swal from "sweetalert2";

type Medicine = any;

export default function EditFormClient({ id }: { id?: string }) {
  const params = useParams();
  const clientIdFromParams = (params as any)?.id;
  const effectiveId = id && id !== "undefined" ? id : clientIdFromParams;
  const [loading, setLoading] = useState(true);
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [apiError, setApiError] = useState<{
    status: number;
    body: any;
  } | null>(null);
  // For error display like MedicineForm
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    description: "",
    manufacturer: "",
    category: "Tablet",
    categoryId: "",
    subCategoryId: "",
    price: "",
    purchasePrice: "",
    mrp: "",
    discount: 0,
    stock: "",
    expiryDate: "",
    batchNumber: "",
    isOTC: false,
    requiresPrescription: true,
    images: [] as string[],
    coverImage: "" as string,
    highlights: [] as string[],
  });
  const [uploading, setUploading] = useState(false);
  const [composition, setComposition] = useState([{ name: "", value: "" }]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const usedId = effectiveId;
        if (!usedId || usedId === "undefined") {
          setMedicine(null);
          setApiError({
            status: 400,
            body: {
              success: false,
              error: "Invalid id passed to client",
              details: usedId,
            },
          });
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
            name: data.name ?? "",
            description: data.description ?? "",
            manufacturer: data.manufacturer ?? "",
            category: data.category ?? "Tablet",
            categoryId: data.categoryId ?? "",
            subCategoryId: data.subCategoryId ?? "",
            price: data.price ?? "",
            purchasePrice: data.purchasePrice ?? "",
            mrp: data.mrp ?? "",
            discount: data.discount ?? 0,
            stock: data.stock ?? "",
            expiryDate: data.expiryDate
              ? new Date(data.expiryDate).toISOString().slice(0, 10)
              : "",
            batchNumber: data.batchNumber ?? "",
            isOTC: data.isOTC ?? false,
            requiresPrescription: data.requiresPrescription ?? true,
            images: Array.isArray(data.images) ? data.images : [],
            coverImage:
              data.coverImage ||
              (Array.isArray(data.images) && data.images.length > 0
                ? data.images[0]
                : ""),
            highlights: Array.isArray(data.highlights) ? data.highlights : [],
          });
          setComposition(
            Array.isArray(data.composition)
              ? data.composition
              : [{ name: "", value: "" }]
          );
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
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  useEffect(() => {
    if (form.categoryId) {
      const filtered = subcategories.filter(
        (sub) => sub.categoryId?._id === form.categoryId
      );
      setFilteredSubcategories(filtered);
    } else {
      setFilteredSubcategories([]);
    }
  }, [form.categoryId, subcategories]);

  useEffect(() => {
    const cat = categories.find((c) => c._id === form.categoryId);
    const sub = subcategories.find((s) => s._id === form.subCategoryId);
    const derivedOTC = sub?.isOTC ?? cat?.isOTC ?? false;
    setForm((prev) => ({
      ...prev,
      isOTC: derivedOTC,
      requiresPrescription: !derivedOTC,
    }));
  }, [form.categoryId, form.subCategoryId, categories, subcategories]);

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
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    let newForm = {
      ...form,
      [name]: type === "checkbox" ? checked : value,
    };
    // Prevent negative stock (parity with add form)
    if (name === "stock") {
      const stockNum = Math.max(0, Number(value));
      newForm.stock = stockNum.toString();
    }
    if (name === "categoryId") {
      newForm.subCategoryId = "";
    }
    if (name === "price" || name === "mrp") {
      const priceNum = Number(name === "price" ? value : newForm.price);
      const mrpNum = Number(name === "mrp" ? value : newForm.mrp);
      if (mrpNum > 0 && priceNum >= 0 && mrpNum >= priceNum) {
        newForm.discount = Math.round(((mrpNum - priceNum) / mrpNum) * 100);
      } else {
        newForm.discount = 0;
      }
    }
    setForm(newForm);
    setTouched((prev: any) => ({ ...prev, [name]: true }));
  };
  // Simple validation for error messages (mimics Formik's behavior)
  useEffect(() => {
    const newErrors: any = {};
    if (!form.name.trim()) newErrors.name = "Medicine name is required.";
    if (!form.description.trim())
      newErrors.description = "Description is required.";
    if (!form.manufacturer.trim())
      newErrors.manufacturer = "Manufacturer is required.";
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0)
      newErrors.stock = "Stock must be a non-negative number.";
    if (!form.mrp || isNaN(Number(form.mrp)) || Number(form.mrp) <= 0)
      newErrors.mrp = "MRP must be a positive number.";
    if (
      !form.purchasePrice ||
      isNaN(Number(form.purchasePrice)) ||
      Number(form.purchasePrice) < 0
    )
      newErrors.purchasePrice = "Purchase price must be a non-negative number.";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
      newErrors.price = "Selling price must be a non-negative number.";
    if (!form.expiryDate) newErrors.expiryDate = "Expiry date is required.";
    if (!form.batchNumber.trim())
      newErrors.batchNumber = "Batch number is required.";
    setErrors(newErrors);
  }, [form]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    const maxSize = 5 * 1024 * 1024;
    const currentCount = form.images.length;
    if (currentCount >= 5) {
      Swal.fire({
        icon: "error",
        title: "Limit reached",
        text: "Maximum 5 images allowed",
      });
      (
        document.getElementById(
          "medicine-edit-image-input"
        ) as HTMLInputElement | null
      )?.value &&
        ((
          document.getElementById(
            "medicine-edit-image-input"
          ) as HTMLInputElement
        ).value = "");
      return;
    }
    setUploading(true);
    const newUrls: string[] = [];
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
      if (currentCount + newUrls.length >= 5) break;
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/cloudinary/upload-image", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (data.success && data.url) {
          newUrls.push(data.url);
        } else {
          Swal.fire({
            icon: "error",
            title: "Upload failed",
            text: data.error || "Failed to upload image",
          });
        }
      } catch (err) {
        Swal.fire({ icon: "error", title: "Upload failed", text: String(err) });
      }
    }
    setForm((prev) => {
      const updated = [...prev.images, ...newUrls].slice(0, 5);
      const cover = prev.coverImage || (updated.length > 0 ? updated[0] : "");
      return { ...prev, images: updated, coverImage: cover };
    });
    setUploading(false);
    const inp2 = document.getElementById(
      "medicine-edit-image-input"
    ) as HTMLInputElement | null;
    if (inp2) inp2.value = "";
    if (newUrls.length > 0) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `Uploaded ${newUrls.length} image(s)`,
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  const handleDeleteImage = async (url: string) => {
    const res = await fetch("/api/cloudinary/delete-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url }),
    });
    const data = await res.json();
    if (data.success) {
      setForm((prev) => {
        const updated = prev.images.filter((u) => u !== url);
        let newCover = prev.coverImage;
        if (prev.coverImage === url) {
          newCover = updated[0] || "";
        }
        return { ...prev, images: updated, coverImage: newCover };
      });
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

  const setPrimaryImage = (url: string) => {
    setForm((prev) => ({ ...prev, coverImage: url }));
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
    setForm((prev) => ({
      ...prev,
      highlights: prev.highlights.map((h, i) => (i === idx ? value : h)),
    }));
  };
  const addHighlightRow = () =>
    setForm((prev) => ({ ...prev, highlights: [...prev.highlights, ""] }));
  const removeHighlightRow = (idx: number) =>
    setForm((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== idx),
    }));

  function handleCancel() {
    if (typeof window !== "undefined") window.history.back();
  }

  // buildPayload removed; payload is built directly in handleSubmit

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // UI validation: Selling price must not exceed MRP
    const priceNum = Number(form.price);
    const mrpNum = Number(form.mrp);
    if (!form.name.trim()) {
      Swal.fire({
        icon: "error",
        title: "Name required",
        text: "Please enter the medicine name.",
      });
      setLoading(false);
      return;
    }
    if (!form.description.trim()) {
      Swal.fire({
        icon: "error",
        title: "Description required",
        text: "Please enter the medicine description.",
      });
      setLoading(false);
      return;
    }
    if (!form.manufacturer.trim()) {
      Swal.fire({
        icon: "error",
        title: "Manufacturer required",
        text: "Please enter the manufacturer.",
      });
      setLoading(false);
      return;
    }
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0) {
      Swal.fire({
        icon: "error",
        title: "Invalid stock",
        text: "Stock must be a non-negative number.",
      });
      setLoading(false);
      return;
    }
    if (!form.mrp || isNaN(Number(form.mrp)) || Number(form.mrp) <= 0) {
      Swal.fire({
        icon: "error",
        title: "Invalid MRP",
        text: "MRP must be a positive number.",
      });
      setLoading(false);
      return;
    }
    if (
      !form.purchasePrice ||
      isNaN(Number(form.purchasePrice)) ||
      Number(form.purchasePrice) < 0
    ) {
      Swal.fire({
        icon: "error",
        title: "Invalid purchase price",
        text: "Purchase price must be a non-negative number.",
      });
      setLoading(false);
      return;
    }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) {
      Swal.fire({
        icon: "error",
        title: "Invalid selling price",
        text: "Selling price must be a non-negative number.",
      });
      setLoading(false);
      return;
    }
    if (!Number.isNaN(priceNum) && !Number.isNaN(mrpNum) && priceNum > mrpNum) {
      Swal.fire({
        icon: "error",
        title: "Invalid price",
        text: "Selling price cannot be greater than MRP",
      });
      setLoading(false);
      return;
    }
    if (!form.expiryDate) {
      Swal.fire({
        icon: "error",
        title: "Expiry date required",
        text: "Please select an expiry date.",
      });
      setLoading(false);
      return;
    }
    // Images min/max validation
    if (!form.images || form.images.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Image required",
        text: "Please upload at least 1 image",
      });
      setLoading(false);
      return;
    }
    if (form.images.length > 5) {
      Swal.fire({
        icon: "error",
        title: "Too many images",
        text: "Maximum 5 images allowed",
      });
      setLoading(false);
      return;
    }
    // Ensure coverImage is among images
    const cover =
      form.coverImage && form.images.includes(form.coverImage)
        ? form.coverImage
        : form.images[0];
    // Expiry date: disallow past dates
    if (form.expiryDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const exp = new Date(form.expiryDate);
      exp.setHours(0, 0, 0, 0);
      if (exp < today) {
        Swal.fire({
          icon: "error",
          title: "Invalid Expiry Date",
          text: "Expiry date cannot be in the past",
        });
        setLoading(false);
        return;
      }
    }
    if (!form.batchNumber.trim()) {
      Swal.fire({
        icon: "error",
        title: "Batch number required",
        text: "Please enter the batch number.",
      });
      setLoading(false);
      return;
    }
    const payload = {
      ...form,
      composition,
      highlights: (form.highlights || [])
        .map((h) => (h || "").trim())
        .filter((h) => h.length > 0),
      price: Number(form.price),
      purchasePrice: Number(form.purchasePrice),
      mrp: Number(form.mrp),
      discount: Number(form.discount),
      stock: Number(form.stock),
      expiryDate: new Date(form.expiryDate),
      categoryId: form.categoryId || undefined,
      subCategoryId: form.subCategoryId || undefined,
      coverImage: cover,
      finalUpdate: true,
    };
    fetch(`/api/medicines/${effectiveId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const json = await res.json();
        if (json.success) {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Medicine updated successfully",
            showConfirmButton: false,
            timer: 2000,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Update failed",
            text: json.error || "Unknown error",
          });
        }
      })
      .catch((err) => {
        Swal.fire({ icon: "error", title: "Update failed", text: String(err) });
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
        <div className="text-sm text-gray-600 mt-2">
          Using id: <strong>{effectiveId ?? String(id)}</strong>
        </div>
        {apiError && (
          <div className="mt-3 text-sm text-red-600">
            <div>
              <strong>API status:</strong> {apiError.status}
            </div>
            <div>
              <strong>Response:</strong>{" "}
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(apiError.body, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="containerStyle">
      <HeaderWithAction
        title="Edit Medicine"
        subtitle="Update medicine details"
        showBack={true}
        showSearch={false}
      />

      <div className="">
        <form onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Medicine Images *
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Min 1, Max 5 images. Each ≤ 5MB.
            </p>
            <input
              id="medicine-edit-image-input"
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
                  document.getElementById("medicine-edit-image-input")?.click()
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
            {form.images.length > 0 && (
              <div className="mt-3 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2 justify-start w-fit">
                {form.images.map((url) => (
                  <div key={url} className="relative group h-24 w-24">
                    <img
                      src={url}
                      alt="Medicine"
                      className="h-24 w-24 object-cover rounded-md border"
                    />
                    {form.coverImage === url ? (
                      <span className="absolute top-1 left-1 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded-md shadow-sm">
                        Primary
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(url)}
                        className="absolute top-1 left-1 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded-md opacity-80 hover:opacity-100 shadow-sm"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(url)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-80 hover:opacity-100 shadow-sm"
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
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Medicine Name *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              onBlur={() =>
                setTouched((prev: any) => ({ ...prev, name: true }))
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white text-black"
              placeholder="Enter medicine name"
            />
            {touched.name && errors.name && (
              <ErrorMessageCom error={errors.name} />
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              onBlur={() =>
                setTouched((prev: any) => ({ ...prev, description: true }))
              }
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white text-black"
              placeholder="Enter medicine description and usage"
            />
            {touched.description && errors.description && (
              <ErrorMessageCom error={errors.description} />
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Manufacturer *
              </label>
              <input
                name="manufacturer"
                value={form.manufacturer}
                onChange={handleChange}
                onBlur={() =>
                  setTouched((prev: any) => ({ ...prev, manufacturer: true }))
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white text-black"
                placeholder="Manufacturer name"
              />
              {touched.manufacturer && errors.manufacturer && (
                <ErrorMessageCom error={errors.manufacturer} />
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Form Type *
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
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
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name} {cat.isOTC ? "(OTC)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subcategory
              </label>
              <select
                name="subCategoryId"
                value={form.subCategoryId}
                onChange={handleChange}
                disabled={!form.categoryId}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition disabled:bg-gray-100"
              >
                <option value="">Select a subcategory</option>
                {filteredSubcategories.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name} {sub.isOTC ? "(OTC)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stock Quantity *
              </label>
              <input
                name="stock"
                type="text"
                value={form.stock}
                onChange={handleChange}
                onBlur={() =>
                  setTouched((prev: any) => ({ ...prev, stock: true }))
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white text-black"
                placeholder="0"
              />
              {touched.stock && errors.stock && (
                <ErrorMessageCom error={errors.stock} />
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                MRP (₹) *
              </label>
              <input
                name="mrp"
                type="text"
                step="0.01"
                value={form.mrp}
                onChange={handleChange}
                onBlur={() =>
                  setTouched((prev: any) => ({ ...prev, mrp: true }))
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white text-black"
                placeholder="MRP"
              />
              {touched.mrp && errors.mrp && (
                <ErrorMessageCom error={errors.mrp} />
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Purchase Price (₹) *
              </label>
              <input
                name="purchasePrice"
                type="text"
                step="0.01"
                value={form.purchasePrice}
                onChange={handleChange}
                onBlur={() =>
                  setTouched((prev: any) => ({ ...prev, purchasePrice: true }))
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition bg-white text-black"
                placeholder="Purchase Price"
              />
              {touched.purchasePrice && errors.purchasePrice && (
                <ErrorMessageCom error={errors.purchasePrice} />
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Selling Price (₹) *
              </label>
              <input
                name="price"
                type="text"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                onBlur={() =>
                  setTouched((prev: any) => ({ ...prev, price: true }))
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white text-black"
                placeholder="Selling Price"
              />
              {touched.price && errors.price && (
                <ErrorMessageCom error={errors.price} />
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Discount (%)
              </label>
              <input
                name="discount"
                type="text"
                value={form.discount}
                readOnly
                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-100 text-gray-700"
                placeholder="Discount %"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Expiry Date *
              </label>
              <input
                name="expiryDate"
                type="date"
                value={form.expiryDate}
                onChange={handleChange}
                onBlur={() =>
                  setTouched((prev: any) => ({ ...prev, expiryDate: true }))
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white text-black"
                min={(() => {
                  const d = new Date();
                  const y = d.getFullYear();
                  const m = String(d.getMonth() + 1).padStart(2, "0");
                  const day = String(d.getDate()).padStart(2, "0");
                  return `${y}-${m}-${day}`;
                })()}
              />
              {touched.expiryDate && errors.expiryDate && (
                <ErrorMessageCom error={errors.expiryDate} />
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Batch Number *
              </label>
              <input
                name="batchNumber"
                value={form.batchNumber}
                onChange={handleChange}
                onBlur={() =>
                  setTouched((prev: any) => ({ ...prev, batchNumber: true }))
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white text-black"
                placeholder="Batch number"
              />
              {touched.batchNumber && errors.batchNumber && (
                <ErrorMessageCom error={errors.batchNumber} />
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Composition
            </label>
            <div className="flex flex-col gap-2">
              {composition.map((c, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row gap-2 items-center w-full"
                >
                  <input
                    type="text"
                    placeholder="Name"
                    value={c.name}
                    onChange={(e) =>
                      handleCompositionChange(idx, "name", e.target.value)
                    }
                    className="border rounded px-2 py-2 flex-1 w-full sm:w-auto"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={c.value}
                    onChange={(e) =>
                      handleCompositionChange(idx, "value", e.target.value)
                    }
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Highlights
            </label>
            {form.highlights.length === 0 && (
              <p className="text-xs text-gray-500 mb-2">
                Add short bullet points to highlight key info.
              </p>
            )}
            <div className="flex flex-col gap-2">
              {form.highlights.map((h, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row gap-2 items-center w-full"
                >
                  <input
                    type="text"
                    placeholder={`Highlight #${idx + 1}`}
                    value={h}
                    onChange={(e) => handleHighlightChange(idx, e.target.value)}
                    className="border rounded px-2 py-2 flex-1 w-full sm:w-auto"
                  />
                  <button
                    type="button"
                    onClick={() => removeHighlightRow(idx)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full flex items-center justify-center"
                    aria-label="Remove highlight"
                  >
                    <MdDelete size={20} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addHighlightRow}
              className="text-green-600 mt-2 flex items-center gap-2 font-semibold"
            >
              <MdAdd size={20} /> Add Highlight
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
                  checked={form.requiresPrescription}
                  onChange={handleChange}
                  className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                />
                <label
                  htmlFor="requiresPrescription"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
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

          <div className="mt-3 flex w-[400px] justify-center">
            <CustomButton type="submit" disabled={loading} width="300px">
              <MdSave size={22} /> {loading ? "Saving..." : "Save Medicine"}
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
}
