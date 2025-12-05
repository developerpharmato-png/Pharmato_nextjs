"use client";
import React, { useEffect, useState } from "react";
import {
  CustomButton,
  ErrorMessageCom,
} from "../../../components/miniComponents";
import {
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TextField,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { MdAdd, MdDelete, MdArrowBack, MdSave } from "react-icons/md";
import { useParams } from "next/navigation";
import HeaderWithAction from "../../../components/HeaderWithAction";
import Swal from "sweetalert2";
import SkeltonEditMedicine from "./SkeltonEditMedicine";
import { Delete } from "lucide-react";

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
    unitInput: "",
    unit: "",
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
          // Prefill unitInput and unit from data.unit
          let unitInput = "";
          let unit = "";
          if (data.unit) {
            // Try to split suffix based on category
            let suffix = "";
            switch (data.category) {
              case "Tablet":
                suffix = " Tablets";
                break;
              case "Capsule":
                suffix = " Capsules";
                break;
              case "Syrup":
              case "Drops":
              case "Injection":
                suffix = " ml";
                break;
              case "Cream":
                suffix = " g";
                break;
              case "Other":
                suffix = "";
                break;
            }
            if (data.unit.endsWith(suffix)) {
              unitInput = data.unit.slice(0, -suffix.length);
              unit = data.unit;
            } else {
              unitInput = data.unit;
              unit = data.unit;
            }
          }
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
            unitInput,
            unit,
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

  if (loading)
    return (
      <div className="p-6">
        <SkeltonEditMedicine />
      </div>
    );
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
    <>
      <div className="containerStyle scrollbar-hide">
        <div className="mb-8 relative">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="absolute left-0 top-0 inline-flex items-center justify-center w-10 h-10 text-gray-700 bg-white border border-gray-300 rounded-full shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-150"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="pl-14">
            <HeaderWithAction
              title="Edit Medicine"
              subtitle="Update medicine details"
              showBack={false}
              showSearch={false}
            />
          </div>
        </div>

        <div>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* --- Image Upload Section --- */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Medicine Images *
                <p className="text-xs text-gray-500 font-normal">
                  Min 1, Max 5 images. Each ≤ 5MB.
                </p>
              </label>
              <input
                id="medicine-edit-image-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("medicine-edit-image-input")
                      ?.click()
                  }
                  // Enhanced file upload button styling
                  className="h-28 w-28 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-400 rounded-lg hover:bg-gray-100 transition duration-150 shadow-inner"
                  title="Upload photos"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-9 h-9 text-gray-500"
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
                {uploading && (
                  <span className="text-blue-600 font-medium">
                    Uploading...
                  </span>
                )}
              </div>
              {form.images.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3 justify-start w-fit">
                  {form.images.map((url) => (
                    <div key={url} className="relative group h-24 w-24">
                      <img
                        src={url}
                        alt="Medicine"
                        className="h-24 w-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                      />
                      {form.coverImage === url ? (
                        <span className="absolute top-1 left-1 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg font-semibold">
                          Primary
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(url)}
                          // Set Primary button style enhanced
                          className="absolute top-1 left-1 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 shadow-lg transition duration-200 font-semibold"
                        >
                          Set Primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(url)}
                        // Delete button style enhanced
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg transition duration-200 hover:bg-red-700"
                        title="Delete image"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-4 h-4"
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

            {/* --- Medicine Details Section --- */}
            <div>
              <TextField
                name="name"
                label="Medicine Name *"
                value={form.name}
                onChange={handleChange}
                onBlur={() =>
                  setTouched((prev: any) => ({ ...prev, name: true }))
                }
                fullWidth
                variant="outlined"
                placeholder="Enter medicine name"
                error={touched.name && Boolean(errors.name)}
                InputProps={{
                  style: {
                    borderRadius: "0.75rem",
                    background: "#fff",
                  },
                }}
              />
              {touched.name && errors.name && (
                <ErrorMessageCom error={errors.name} />
              )}
            </div>

            <div>
              <TextField
                name="description"
                label="Description *"
                value={form.description}
                onChange={handleChange}
                onBlur={() =>
                  setTouched((prev: any) => ({ ...prev, description: true }))
                }
                multiline
                rows={4}
                fullWidth
                variant="outlined"
                placeholder="Enter medicine description and usage"
                error={touched.description && Boolean(errors.description)}
                InputProps={{
                  style: {
                    borderRadius: "0.75rem",
                    background: "#fff",
                  },
                }}
              />
              {touched.description && errors.description && (
                <ErrorMessageCom error={errors.description} />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <TextField
                  name="manufacturer"
                  label="Manufacturer *"
                  value={form.manufacturer}
                  onChange={handleChange}
                  onBlur={() =>
                    setTouched((prev: any) => ({ ...prev, manufacturer: true }))
                  }
                  fullWidth
                  variant="outlined"
                  placeholder="Manufacturer name"
                  error={touched.manufacturer && Boolean(errors.manufacturer)}
                  InputProps={{
                    style: {
                      borderRadius: "0.75rem",
                      background: "#fff",
                    },
                  }}
                />
                {touched.manufacturer && errors.manufacturer && (
                  <ErrorMessageCom error={errors.manufacturer} />
                )}
              </div>
              <div className="flex gap-4 items-end">
                <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                  <InputLabel id="form-type-label">Form Type *</InputLabel>
                  <Select
                    labelId="form-type-label"
                    name="category"
                    value={form.category}
                    onChange={(event) => {
                      handleChange({
                        target: {
                          name: "category",
                          value: event.target.value,
                          type: "select-one",
                        },
                      } as React.ChangeEvent<HTMLSelectElement>);
                      // Reset unit when category changes
                      setForm((prev) => ({ ...prev, unitInput: "", unit: "" }));
                    }}
                    label="Form Type *"
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
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>


            {/* Unit and Expiry Date in one row, like MedicineForm */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {form.category && (
                <TextField
                  name="unitInput"
                  label="Unit"
                  value={form.unitInput || ""}
                  onChange={(e) => {
                    let val = e.target.value;
                    let suffix = "";
                    switch (form.category) {
                      case "Tablet":
                        suffix = " Tablets";
                        break;
                      case "Capsule":
                        suffix = " Capsules";
                        break;
                      case "Syrup":
                      case "Drops":
                      case "Injection":
                        suffix = " ml";
                        break;
                      case "Cream":
                        suffix = " g";
                        break;
                      case "Other":
                        suffix = "";
                        break;
                    }
                    if (val.endsWith(suffix)) val = val.slice(0, -suffix.length);
                    setForm((prev) => ({ ...prev, unitInput: val, unit: val + suffix }));
                  }}
                  variant="outlined"
                  placeholder={(() => {
                    switch (form.category) {
                      case "Tablet": return "e.g. 10";
                      case "Capsule": return "e.g. 10";
                      case "Syrup": return "e.g. 250";
                      case "Cream": return "e.g. 15";
                      case "Drops": return "e.g. 10";
                      case "Injection": return "e.g. 5";
                      default: return "e.g. 1 Unit";
                    }
                  })()}
                  InputProps={{
                    endAdornment: (() => {
                      switch (form.category) {
                        case "Tablet": return <span style={{ marginLeft: 8 }}>Tablets</span>;
                        case "Capsule": return <span style={{ marginLeft: 8 }}>Capsules</span>;
                        case "Syrup": return <span style={{ marginLeft: 8 }}>ml</span>;
                        case "Cream": return <span style={{ marginLeft: 8 }}>g</span>;
                        case "Drops": return <span style={{ marginLeft: 8 }}>ml</span>;
                        case "Injection": return <span style={{ marginLeft: 8 }}>ml</span>;
                        default: return null;
                      }
                    })(),
                    style: {
                      borderRadius: "0.75rem",
                      background: "#fff",
                    },
                  }}
                />
              )}
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Expiry Date *"
                  value={form.expiryDate ? new Date(form.expiryDate) : null}
                  onChange={(date) => {
                    setForm((prev) => ({
                      ...prev,
                      expiryDate: date ? new Date(date).toISOString().slice(0, 10) : "",
                    }));
                    setTouched((prev: any) => ({ ...prev, expiryDate: true }));
                  }}
                  minDate={new Date()}
                  slotProps={{
                    textField: {
                      name: "expiryDate",
                      fullWidth: true,
                      variant: "outlined",
                      error: touched.expiryDate && Boolean(errors.expiryDate),
                      helperText: touched.expiryDate && errors.expiryDate,
                      InputProps: {
                        style: {
                          borderRadius: "0.75rem",
                          background: "#fff",
                        },
                      },
                    },
                  }}
                />
              </LocalizationProvider>
            </div>

            {/* Stock and Batch Number in the next row, like MedicineForm */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <TextField
                name="stock"
                label="Stock Quantity *"
                type="text"
                value={form.stock}
                onChange={handleChange}
                onBlur={() => setTouched((prev: any) => ({ ...prev, stock: true }))}
                fullWidth
                variant="outlined"
                placeholder="0"
                error={touched.stock && Boolean(errors.stock)}
                InputProps={{
                  style: {
                    borderRadius: "0.75rem",
                    background: "#fff",
                  },
                }}
              />
              <TextField
                name="batchNumber"
                label="Batch Number *"
                value={form.batchNumber}
                onChange={handleChange}
                onBlur={() => setTouched((prev: any) => ({ ...prev, batchNumber: true }))}
                fullWidth
                variant="outlined"
                placeholder="Batch number"
                error={touched.batchNumber && Boolean(errors.batchNumber)}
                InputProps={{
                  style: {
                    borderRadius: "0.75rem",
                    background: "#fff",
                  },
                }}
              />
            </div>

            {/* --- Category/Subcategory Section --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                  <InputLabel id="category-label">Category</InputLabel>
                  <Select
                    labelId="category-label"
                    name="categoryId"
                    value={form.categoryId}
                    onChange={(event) => {
                      handleChange({
                        target: {
                          name: "categoryId",
                          value: event.target.value,
                          type: "select-one",
                        },
                      } as React.ChangeEvent<HTMLSelectElement>);
                    }}
                    label="Category"
                  >
                    <MenuItem value="">Select a category</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat._id} value={cat._id}>
                        {cat.name} {cat.isOTC ? "(OTC)" : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              <div>
                <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                  <InputLabel id="subcategory-label">Subcategory</InputLabel>
                  <Select
                    labelId="subcategory-label"
                    name="subCategoryId"
                    value={form.subCategoryId}
                    onChange={(event) => {
                      handleChange({
                        target: {
                          name: "subCategoryId",
                          value: event.target.value,
                          type: "select-one",
                        },
                      } as React.ChangeEvent<HTMLSelectElement>);
                    }}
                    label="Subcategory"
                    disabled={!form.categoryId}
                  >
                    <MenuItem value="">Select a subcategory</MenuItem>
                    {filteredSubcategories.map((sub) => (
                      <MenuItem key={sub._id} value={sub._id}>
                        {sub.name} {sub.isOTC ? "(OTC)" : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>

            {/* --- Stock/Batch/Expiry Section --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <TextField
                  name="stock"
                  label="Stock Quantity *"
                  type="text"
                  value={form.stock}
                  onChange={handleChange}
                  onBlur={() =>
                    setTouched((prev: any) => ({ ...prev, stock: true }))
                  }
                  fullWidth
                  variant="outlined"
                  placeholder="0"
                  error={touched.stock && Boolean(errors.stock)}
                  InputProps={{
                    style: {
                      borderRadius: "0.75rem",
                      background: "#fff",
                    },
                  }}
                />
                {touched.stock && errors.stock && (
                  <ErrorMessageCom error={errors.stock} />
                )}
              </div>
              <div>
                <TextField
                  name="batchNumber"
                  label="Batch Number *"
                  value={form.batchNumber}
                  onChange={handleChange}
                  onBlur={() =>
                    setTouched((prev: any) => ({ ...prev, batchNumber: true }))
                  }
                  fullWidth
                  variant="outlined"
                  placeholder="Batch number"
                  error={touched.batchNumber && Boolean(errors.batchNumber)}
                  InputProps={{
                    style: {
                      borderRadius: "0.75rem",
                      background: "#fff",
                    },
                  }}
                />
                {touched.batchNumber && errors.batchNumber && (
                  <ErrorMessageCom error={errors.batchNumber} />
                )}
              </div>
            </div>

            {/* Expiry Date moved into its own section for separation/style consistency, assuming a 4-column layout is not needed here */}

            {/* --- Price Section (4 columns) --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <TextField
                  name="mrp"
                  label="MRP (₹) *"
                  type="text"
                  value={form.mrp}
                  onChange={handleChange}
                  onBlur={() =>
                    setTouched((prev: any) => ({ ...prev, mrp: true }))
                  }
                  fullWidth
                  variant="outlined"
                  placeholder="MRP"
                  error={touched.mrp && Boolean(errors.mrp)}
                  InputProps={{
                    style: {
                      borderRadius: "0.75rem",
                      background: "#fff",
                    },
                  }}
                />
                {touched.mrp && errors.mrp && (
                  <ErrorMessageCom error={errors.mrp} />
                )}
              </div>
              <div>
                <TextField
                  name="purchasePrice"
                  label="Purchase Price (₹) *"
                  type="text"
                  value={form.purchasePrice}
                  onChange={handleChange}
                  onBlur={() =>
                    setTouched((prev: any) => ({
                      ...prev,
                      purchasePrice: true,
                    }))
                  }
                  fullWidth
                  variant="outlined"
                  placeholder="Purchase Price"
                  error={touched.purchasePrice && Boolean(errors.purchasePrice)}
                  InputProps={{
                    style: {
                      borderRadius: "0.75rem",
                      background: "#fff",
                    },
                  }}
                />
                {touched.purchasePrice && errors.purchasePrice && (
                  <ErrorMessageCom error={errors.purchasePrice} />
                )}
              </div>
              <div>
                <TextField
                  name="price"
                  label="Selling Price (₹) *"
                  type="text"
                  value={form.price}
                  onChange={handleChange}
                  onBlur={() =>
                    setTouched((prev: any) => ({ ...prev, price: true }))
                  }
                  fullWidth
                  variant="outlined"
                  placeholder="Selling Price"
                  error={touched.price && Boolean(errors.price)}
                  InputProps={{
                    style: {
                      borderRadius: "0.75rem",
                      background: "#fff",
                    },
                  }}
                />
                {touched.price && errors.price && (
                  <ErrorMessageCom error={errors.price} />
                )}
              </div>
              <div>
                <TextField
                  name="discount"
                  label="Discount (%)"
                  type="text"
                  value={form.discount}
                  InputProps={{
                    readOnly: true,
                    style: {
                      borderRadius: "0.75rem",
                      background: "#f3f4f6",
                      color: "#374151",
                      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
                    },
                  }}
                  fullWidth
                  variant="outlined"
                  placeholder="Discount %"
                />
              </div>
            </div>

            {/* --- Composition Section --- */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Composition
              </label>
              {composition.map((c, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 mb-3 items-center p-3 border border-gray-200 rounded-lg bg-gray-50 shadow-sm"
                >
                  <input
                    type="text"
                    placeholder="Name"
                    value={c.name}
                    onChange={(e) =>
                      handleCompositionChange(idx, "name", e.target.value)
                    }
                    className="border bg-white text-gray-900 rounded-lg px-3 py-2 flex-1 focus:ring-green-500 focus:border-green-500 transition"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={c.value}
                    onChange={(e) =>
                      handleCompositionChange(idx, "value", e.target.value)
                    }
                    className="border bg-white text-gray-900 rounded-lg px-3 py-2 flex-1 focus:ring-green-500 focus:border-green-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => removeCompositionRow(idx)}
                    className="text-red-600 hover:text-red-800 font-medium p-1 transition"
                    aria-label="Remove composition"
                  >
                    <Delete />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addCompositionRow}
                className="text-green-600 hover:text-green-700 font-semibold mt-2 inline-flex items-center gap-1 transition"
              >
                <span className="text-xl">+</span> Add Composition
              </button>
            </div>

            {/* --- Highlights Section --- */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Highlights
              </label>
              {form.highlights.length === 0 && (
                <p className="text-xs text-gray-500 mb-2">
                  Add short bullet points to highlight key info.
                </p>
              )}
              {form.highlights.map((h, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 mb-3 items-center p-3 border border-gray-200 rounded-lg bg-yellow-50 shadow-sm"
                >
                  <input
                    type="text"
                    placeholder={`Highlight #${idx + 1}`}
                    value={h}
                    onChange={(e) => handleHighlightChange(idx, e.target.value)}
                    className="border bg-white text-gray-900 rounded-lg px-3 py-2 flex-1 focus:ring-yellow-500 focus:border-yellow-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => removeHighlightRow(idx)}
                    className="text-red-600 hover:text-red-800 font-medium p-1 transition"
                    aria-label="Remove highlight"
                  >
                    <Delete />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addHighlightRow}
                className="text-green-600 hover:text-green-700 font-semibold mt-2 inline-flex items-center gap-1 transition"
              >
                <span className="text-xl">+</span> Add Highlight
              </button>
            </div>

            {/* --- Classification Section --- */}
            <div className="space-y-4 border-t pt-8">
              <h3 className="text-xl font-bold text-gray-800">
                Medicine Classification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-300 rounded-xl shadow-md">
                  <input
                    type="checkbox"
                    id="requiresPrescription"
                    name="requiresPrescription"
                    checked={form.requiresPrescription}
                    onChange={handleChange}
                    className="w-6 h-6 text-orange-600 bg-white border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label
                    htmlFor="requiresPrescription"
                    className="text-base font-medium text-gray-900 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span>📋 Requires Prescription</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 font-normal">
                      Prescription needed for purchase
                    </p>
                  </label>
                </div>
              </div>
            </div>

            {/* --- Submission Button --- */}
            <div className="mt-8 flex justify-center w-full">
              <div className="flex justify-center w-full max-w-sm">
                <CustomButton type="submit" disabled={loading} width="100%">
                  <MdSave size={22} /> {loading ? "Saving..." : "Save Medicine"}
                </CustomButton>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
