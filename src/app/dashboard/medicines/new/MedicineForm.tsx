"use client";
import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import { CustomButton, ErrorMessageCom } from "../../components/miniComponents";
import { TextField, Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MdArrowBack, MdSave } from "react-icons/md";
import HeaderWithAction from "../../components/HeaderWithAction";
import Swal from "sweetalert2";
import {
  initialMedicineFormValues,
  medicineFormValidationSchema,
} from "./medicineFormUtil";
import { Delete } from "lucide-react";


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
      } catch {}
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
    <>
      <div className="containerStyle scrollbar-hide">
        <HeaderWithAction
          title="Add New Medicine"
          subtitle="Enter medicine details to add to inventory"
          showBack={true}
          showSearch={false}
        />

        <div>
          <form onSubmit={formik.handleSubmit} className="space-y-8">
            {" "}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                {" "}
                Medicine Images *
                <p className="text-xs text-gray-500 font-normal">
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
              <div className="flex items-center gap-4">
                {" "}
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("medicine-image-input")?.click()
                  }
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
              {formik.values.images.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3 justify-start w-fit">
                  {formik.values.images.map((img, idx) => (
                    <div key={img} className="relative group h-24 w-24">
                      <img
                        src={img}
                        alt={`Medicine ${idx + 1}`}
                        className="h-24 w-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                      />
                      {formik.values.coverImage === img ? (
                        <span className="absolute top-1 left-1 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg font-semibold">
                          Primary
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            formik.setFieldValue("coverImage", img)
                          }
                          className="absolute top-1 left-1 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 shadow-lg transition duration-200 font-semibold"
                          title="Set as primary"
                        >
                          Set Primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img)}
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
              <div className="mt-2 flex items-center gap-3"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="">
               <TextField
                name="name"
                label="Medicine Name *"
                value={formik.values.name}
                onChange={handleChange}
                onBlur={formik.handleBlur}
                fullWidth
                variant="outlined"
                placeholder="Enter medicine name"
                error={formik.touched.name && Boolean(formik.errors.name)}
                InputProps={{
                  style: {
                    borderRadius: "0.75rem",
                    background: "#fff",
                  },
                }}
              />
              {formik.touched.name && formik.errors.name && (
                <ErrorMessageCom error={formik.errors.name} />
              )}
             </div>
            </div>
            <div>
              <TextField
                name="description"
                label="Description *"
                value={formik.values.description}
                onChange={handleChange}
                onBlur={formik.handleBlur}
                multiline
                rows={4}
                fullWidth
                variant="outlined"
                placeholder="Enter medicine description and usage"
                error={formik.touched.description && Boolean(formik.errors.description)}
                InputProps={{
                  style: {
                    borderRadius: "0.75rem",
                    background: "#fff",
                  },
                }}
              />
              {formik.touched.description && formik.errors.description && (
                <ErrorMessageCom error={formik.errors.description} />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <TextField
                  name="manufacturer"
                  label="Manufacturer *"
                  value={formik.values.manufacturer}
                  onChange={handleChange}
                  onBlur={formik.handleBlur}
                  fullWidth
                  variant="outlined"
                  placeholder="Manufacturer name"
                  error={formik.touched.manufacturer && Boolean(formik.errors.manufacturer)}
                  InputProps={{
                    style: {
                      borderRadius: "0.75rem",
                      background: "#fff",
                    },
                  }}
                />
                {formik.touched.manufacturer && formik.errors.manufacturer && (
                  <ErrorMessageCom error={formik.errors.manufacturer} />
                )}
              </div>
              {/* Form Type */}
              <div>
                <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                  <InputLabel id="form-type-label">Form Type *</InputLabel>
                  <Select
                    labelId="form-type-label"
                    name="category"
                    value={formik.values.category}
                    onChange={(event) => {
                      handleChange({
                        target: {
                          name: "category",
                          value: event.target.value,
                          type: "select-one",
                        },
                      } as React.ChangeEvent<HTMLSelectElement>);
                    }}
                    onBlur={formik.handleBlur}
                    label="Form Type *"
                  >
                    {["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Drops", "Other"].map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {formik.touched.category && formik.errors.category && (
                  <ErrorMessageCom error={formik.errors.category} />
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {" "}
              {/* Increased grid gap */}
              {/* Category */}
              <div>
                <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                  <InputLabel id="category-label">Category</InputLabel>
                  <Select
                    labelId="category-label"
                    name="categoryId"
                    value={formik.values.categoryId}
                    onChange={(event) => {
                      handleChange({
                        target: {
                          name: "categoryId",
                          value: event.target.value,
                          type: "select-one",
                        },
                      } as React.ChangeEvent<HTMLSelectElement>);
                    }}
                    onBlur={formik.handleBlur}
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
                {selectedCategory && (
                  <div className="mt-2">
                    {/* Tags colors enhanced */}
                    {selectedCategory.isOTC ? (
                      <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 font-semibold rounded-full">
                        🟢 OTC Category
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 bg-orange-100 text-orange-700 font-semibold rounded-full">
                        📋 Prescription Category
                      </span>
                    )}
                  </div>
                )}
              </div>
              {/* Subcategory */}
              <div>
                <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                  <InputLabel id="subcategory-label">Subcategory</InputLabel>
                  <Select
                    labelId="subcategory-label"
                    name="subCategoryId"
                    value={formik.values.subCategoryId}
                    onChange={(event) => {
                      handleChange({
                        target: {
                          name: "subCategoryId",
                          value: event.target.value,
                          type: "select-one",
                        },
                      } as React.ChangeEvent<HTMLSelectElement>);
                    }}
                    onBlur={formik.handleBlur}
                    label="Subcategory"
                    disabled={!formik.values.categoryId}
                  >
                    <MenuItem value="">Select a subcategory</MenuItem>
                    {filteredSubcategories.map((sub) => (
                      <MenuItem key={sub._id} value={sub._id}>
                        {sub.name} {sub.isOTC ? "(OTC)" : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {selectedSubcategory && (
                  <div className="mt-2">
                    {/* Tags colors enhanced */}
                    {selectedSubcategory.isOTC ? (
                      <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 font-semibold rounded-full">
                        🟢 OTC Subcategory
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 bg-orange-100 text-orange-700 font-semibold rounded-full">
                        📋 Prescription Subcategory
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {" "}
              {/* Increased grid gap */}
              {/* Stock Quantity */}
              <div>
                <TextField
                  name="stock"
                  label="Stock Quantity *"
                  type="text"
                  value={formik.values.stock}
                  onChange={handleChange}
                  onBlur={formik.handleBlur}
                  fullWidth
                  variant="outlined"
                  placeholder="0"
                  error={formik.touched.stock && Boolean(formik.errors.stock)}
                  InputProps={{
                    style: {
                      borderRadius: "0.75rem",
                      background: "#fff",
                    },
                  }}
                />
                {formik.touched.stock && formik.errors.stock && (
                  <ErrorMessageCom error={formik.errors.stock} />
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {" "}
              {/* Price grid kept at 4 columns */}
              {/* MRP */}
              <div>
                <TextField
                  name="mrp"
                  label="MRP (₹) *"
                  type="text"
                  value={formik.values.mrp}
                  onChange={handleChange}
                  onBlur={formik.handleBlur}
                  fullWidth
                  variant="outlined"
                  placeholder="MRP"
                  error={formik.touched.mrp && Boolean(formik.errors.mrp)}
                  InputProps={{
                    style: {
                      borderRadius: "0.75rem",
                      background: "#fff",
                    },
                  }}
                />
                {formik.touched.mrp && formik.errors.mrp && (
                  <ErrorMessageCom error={formik.errors.mrp} />
                )}
              </div>
              {/* Purchase Price */}
              <div>
                <TextField
                  name="purchasePrice"
                  label="Purchase Price (₹) *"
                  type="text"
                  value={formik.values.purchasePrice}
                  onChange={handleChange}
                  onBlur={formik.handleBlur}
                  fullWidth
                  variant="outlined"
                  placeholder="Purchase Price"
                  error={formik.touched.purchasePrice && Boolean(formik.errors.purchasePrice)}
                  InputProps={{
                    style: {
                      borderRadius: "0.75rem",
                      background: "#fff",
                    },
                  }}
                />
                {formik.touched.purchasePrice && formik.errors.purchasePrice && (
                  <ErrorMessageCom error={formik.errors.purchasePrice} />
                )}
              </div>
              {/* Selling Price */}
              <div>
                <TextField
                  name="price"
                  label="Selling Price (₹) *"
                  type="text"
                  value={formik.values.price}
                  onChange={handleChange}
                  onBlur={formik.handleBlur}
                  fullWidth
                  variant="outlined"
                  placeholder="Selling Price"
                  error={formik.touched.price && Boolean(formik.errors.price)}
                  InputProps={{
                    style: {
                      borderRadius: "0.75rem",
                      background: "#fff",
                    },
                  }}
                />
                {formik.touched.price && formik.errors.price && (
                  <ErrorMessageCom error={formik.errors.price} />
                )}
              </div>
              {/* Discount */}
              <div>
                <TextField
                  name="discount"
                  label="Discount (%)"
                  type="text"
                  value={formik.values.discount}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {" "}
              {/* Increased grid gap */}
              {/* Expiry Date */}
              <div>
                <TextField
                  name="expiryDate"
                  label="Expiry Date *"
                  type="date"
                  value={formik.values.expiryDate}
                  onChange={handleChange}
                  onBlur={formik.handleBlur}
                  inputProps={{ min: todayStr }}
                  fullWidth
                  variant="outlined"
                  error={formik.touched.expiryDate && Boolean(formik.errors.expiryDate)}
                  InputProps={{
                    style: {
                      borderRadius: "0.75rem",
                      background: "#fff",
                    },
                  }}
                />
                {formik.touched.expiryDate && formik.errors.expiryDate && (
                  <ErrorMessageCom error={formik.errors.expiryDate} />
                )}
              </div>
              {/* Batch Number */}
              <div>
                <TextField
                  name="batchNumber"
                  label="Batch Number *"
                  value={formik.values.batchNumber}
                  onChange={handleChange}
                  onBlur={formik.handleBlur}
                  fullWidth
                  variant="outlined"
                  placeholder="Batch number"
                  InputProps={{
                    style: {
                      borderRadius: "0.75rem",
                      background: "#fff",
                    },
                  }}
                />
              </div>
            </div>
            {/* Composition Section Styling */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Composition
              </label>
              {composition.map((c, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 mb-3 items-center p-3 border border-gray-200 rounded-lg bg-gray-50 shadow-sm"
                >
                  {" "}
                  {/* Added box styling */}
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
            {/* Highlights Section Styling */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Highlights
              </label>
              {formik.values.highlights.length === 0 && (
                <p className="text-xs text-gray-500 mb-2">
                  Add short bullet points to highlight key info.
                </p>
              )}
              {formik.values.highlights.map((h, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 mb-3 items-center p-3 border border-gray-200 rounded-lg bg-yellow-50 shadow-sm"
                >
                  {" "}
                  {/* Added box styling with yellow tint */}
                  <input
                    type="text"
                    placeholder={`Highlight #${idx + 1}`}
                    value={h}
                    onChange={(e) => handleHighlightChange(idx, e.target.value)}
                    onBlur={formik.handleBlur}
                    className="border bg-white text-gray-900 rounded-lg px-3 py-2 flex-1 focus:ring-yellow-500 focus:border-yellow-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => removeHighlightRow(idx)}
                    className="text-red-600 hover:text-red-800 font-medium p-1 transition"
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
            <div className="space-y-4 border-t pt-8">
              {" "}
              {/* Increased padding top */}
              <h3 className="text-xl font-bold text-gray-800">
                {" "}
                {/* Header bold and larger */}
                Medicine Classification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-300 rounded-xl shadow-md">
                  {" "}
                  {/* Enhanced checkbox styling */}
                  <input
                    type="checkbox"
                    id="requiresPrescription"
                    name="requiresPrescription"
                    checked={formik.values.requiresPrescription}
                    onChange={handleChange}
                    onBlur={formik.handleBlur}
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
            {error && (
              <div className="bg-red-50 border border-red-300 rounded-xl p-4 shadow-sm">
                {" "}
                {/* Error box enhanced */}
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}
            <div className="mt-8 flex justify-center w-full">
              {" "}
              {/* Centered submission area */}
              <div className="flex justify-center w-full max-w-sm">
                {" "}
                {/* Constrained width for button */}
                {/* CustomButton component styling is assumed to be handled internally but uses a green primary color for "Add Medicine" */}
                <CustomButton type="submit" disabled={loading} width="100%">
                  <MdSave size={22} /> {loading ? "Saving..." : "Add Medicine"}
                </CustomButton>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
