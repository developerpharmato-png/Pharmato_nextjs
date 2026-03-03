"use client";
import React, { useState, useEffect } from "react";
import { useFormik } from "formik";

import {
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MdArrowBack, MdSave } from "react-icons/md";

import Swal from "sweetalert2";
import { ToastMessages } from "@/utils/ToasterMessage";

import DeleteIcon from "@mui/icons-material/Delete";
import MedicineImageUploader from "../../Imageuplod";
import HeaderWithAction from "@/app/dashboard/components/HeaderWithAction";
import {
  CustomButton,
  ErrorMessageCom,
} from "@/app/dashboard/components/miniComponents";

import { useParams } from "next/navigation";
import { initialMedicineFormValues } from "@/utils/initCategory";
import { medicineFormValidationSchema } from "@/utils/validateCategory";
import TextareaField from "@/app/dashboard/components/skeleton/FieldCom";
import MedicineAddEditSkeleton from "@/app/dashboard/components/Skelton/MedicineAddEditSkeleton";

export default function MedicineAddEditForm({ id }: { id?: string }) {
  const router = useRouter();
  const params = useParams();
  const usedId = id && id !== "undefined" ? id : (params as any)?.id;

  const [initialValues, setInitialValues] = useState(initialMedicineFormValues);
  const [isEdit, setIsEdit] = useState(false);
  const [getByidLoading, setGetByidLoading] = useState(true);
  // Fetch medicine if id is present
  console.log(getByidLoading, "getByidLoading");

  useEffect(() => {
    if (usedId) {
      setGetByidLoading(true);
      setIsEdit(true);
      fetch(`/api/admin/medicines/${usedId}`)
        .then(async (res) => {
          const data = await res.json();
          if (data.success && data.data) {
            const med = data.data;
            let unitInput = med.unitInput || "";
            if (!unitInput && med.unit) {
              let suffix = "";
              switch (med.category) {
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
              if (med.unit.endsWith(suffix)) {
                unitInput = med.unit.slice(0, -suffix.length);
              }
            }
            enableReinitialize: false;
            setInitialValues({
              ...initialMedicineFormValues,
              ...med,
              expiryDate: med.expiryDate
                ? new Date(med.expiryDate).toISOString().slice(0, 10)
                : "",
              images: Array.isArray(med.images) ? med.images : [],
              coverImage:
                med.coverImage ||
                (Array.isArray(med.images) && med.images.length > 0
                  ? med.images[0]
                  : ""),
              highlights: Array.isArray(med.highlights) ? med.highlights : [],
              unitInput: unitInput,
              unit: med.unit || "",
            });

            setComposition(
              Array.isArray(med.composition)
                ? med.composition
                : [{ name: "", value: "" }]
            );
          } else {
            setError("Medicine not found");
          }
        })
        .catch(() => setError("Failed to fetch medicine"))
        .finally(() => setGetByidLoading(false));
    } else {
      setIsEdit(false);
      setInitialValues(initialMedicineFormValues);
      setComposition([{ name: "", value: "" }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usedId]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
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
            text: ToastMessages.INVALID_PRICE,
          });
          setLoading(false);
          setSubmitting(false);
          return;
        }
        if (values.images.length > 5) {
          Swal.fire({
            icon: "error",
            title: "Too many images",
            text: ToastMessages.TOO_MANY_IMAGES,
          });
          setLoading(false);
          setSubmitting(false);
          return;
        }
        // If editing, call PUT, else POST
        let apiUrl = "/api/admin/medicines";
        let method = "POST";
        if (isEdit && usedId) {
          apiUrl = `/api/admin/medicines/${usedId}`;
          method = "PUT";
        }
        const res = await fetch(apiUrl, {
          method,
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
            title: isEdit ? ToastMessages.MEDICINE_UPDATED : ToastMessages.MEDICINE_CREATED,
            showConfirmButton: false,
            timer: 2000,
          });
          setTimeout(() => router.push("/dashboard/medicines"), 1000);
        }
      } catch (err) {
        setError(isEdit ? "Failed to update medicine" : "Failed to create medicine");
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
    if (formik.submitCount > 0 && Object.keys(formik.errors).length > 0) {
      const firstErrorKey = Object.keys(formik.errors)[0];

      // Give a tiny delay for MUI and animations to settle
      setTimeout(() => {
        // Prioritize ID as it's more specific than Name (which can collide with meta tags like 'description')
        const element = document.getElementById(firstErrorKey) || document.getElementsByName(firstErrorKey)[0];

        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });

          // Comprehensive focus logic to find the actual interactive element
          const focusableElement = (
            element.tagName === 'INPUT' ||
            element.tagName === 'TEXTAREA' ||
            element.tagName === 'SELECT' ||
            element.hasAttribute('tabindex')
          ) ? element : (
            element.querySelector('input:not([type="hidden"]), textarea, select, button, [tabindex="0"]') as HTMLElement
          );

          if (focusableElement) {
            (focusableElement as HTMLElement).focus({ preventScroll: true });
          }
        }
      }, 100);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Please fill all the required field",
        showConfirmButton: false,
        timer: 3000,
      });
    }
  }, [formik.submitCount, formik.errors]);

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
        text: ToastMessages.TOO_MANY_IMAGES_CURRENT(currentCount),
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
          text: ToastMessages.INVALID_FILE_TYPE,
        });
        continue;
      }
      if (file.size > maxSize) {
        Swal.fire({
          icon: "error",
          title: "File too large",
          text: ToastMessages.FILE_TOO_LARGE,
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
        title: ToastMessages.IMAGES_UPLOADED(uploadedUrls.length),
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
    setUploading(true);

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
      setUploading(false);

      formik.setFieldValue("coverImage", nextCover);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: ToastMessages.IMAGE_DELETED,
        showConfirmButton: false,
        timer: 2000,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: ToastMessages.IMAGE_DELETE_FAILED(data.error),
      });
    }
  };
  const [composition, setComposition] = useState([{ name: "", value: "" }]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
    fetchStores();
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
    // formik.setFieldValue("isPrescription", !derivedOTC);
  }, [
    formik.values.categoryId,
    formik.values.subCategoryId,
    categories,
    subcategories,
  ]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(data.data || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const res = await fetch("/api/admin/subcategories");
      const data = await res.json();
      setSubcategories(data.data || []);
    } catch (error) {
      console.error("Failed to fetch subcategories:", error);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await fetch("/api/admin/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isListRequest: true }),
      });
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        // only active stores (status === 1)
        const active = data.data.filter((s: any) => Number(s.status) === 1);
        setStores(active);
        // If there's exactly one active store and no store selected yet, select it by default
        try {
          if (Array.isArray(active) && active.length === 1 && !formik.values.storeId) {
            formik.setFieldValue("storeId", String(active[0]._id));
          }
        } catch (e) {
          // formik might not be ready in some render timing — ignore safely
        }
      } else {
        setStores([]);
      }
    } catch (e) {
      console.error("Failed to fetch stores", e);
      setStores([]);
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
  const addCompositionRow = () => {
    if ((composition || []).length >= 5) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: ToastMessages.COMPOSITION_LIMIT,
      });
      return;
    }
    setComposition((prev) => [...prev, { name: "", value: "" }]);
  };
  const removeCompositionRow = (idx: number) =>
    setComposition((prev) => prev.filter((_, i) => i !== idx));

  const handleHighlightChange = (idx: number, value: string) => {
    const newHighlights = [...formik.values.highlights];
    newHighlights[idx] = value;
    formik.setFieldValue("highlights", newHighlights);
  };
  const addHighlightRow = () => {
    if ((formik.values.highlights || []).length >= 5) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: ToastMessages.HIGHLIGHTS_LIMIT,
      });
      return;
    }
    formik.setFieldValue("highlights", [...formik.values.highlights, ""]);
  };
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
          text: ToastMessages.INVALID_PRICE,
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
            text: ToastMessages.INVALID_EXPIRY_DATE,
          });
          setLoading(false);
          return;
        }
      }
      if (!formik.values.images || formik.values.images.length === 0) {
        Swal.fire({
          icon: "error",
          title: "Image required",
          text: ToastMessages.IMAGE_REQUIRED,
        });
        setLoading(false);
        return;
      }
      if (formik.values.images.length > 5) {
        Swal.fire({
          icon: "error",
          title: "Too many images",
          text: ToastMessages.TOO_MANY_IMAGES,
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
          isPrescription: formik.values.isPrescription,
          categoryId: formik.values.categoryId || undefined,
          subCategoryId: formik.values.subCategoryId || undefined,
          storeId: formik.values.storeId || undefined,
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
          title: ToastMessages.MEDICINE_CREATED,
          showConfirmButton: false,
          timer: 2000,
        });
        setTimeout(() => {
          try {
            router.back();
          } catch (e) {
            if (typeof window !== "undefined") window.history.back();
          }
        }, 1000);
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
  console.log(formik.dirty, "formik.dirtyformik.dirty");

  return (
    <>
      {getByidLoading && isEdit ? (
        <>
          <div className="containerStyle scrollbar-hide">

            <MedicineAddEditSkeleton />
          </div>
        </>
      ) :
        (
          <>

            <div className="containerStyle scrollbar-hide">
              <HeaderWithAction
                title={isEdit ? `Edit ${formik.values.name}` : "Add New Medicine"}
                subtitle={
                  isEdit
                    ? "Update medicine details"
                    : "Enter medicine details to add to inventory"
                }
                showBack={true}
                isunsaved={formik.dirty}
                showSearch={false}
              />

              <div>
                <form onSubmit={formik.handleSubmit} className="space-y-8">
                  <MedicineImageUploader
                    id="images"
                    form={{
                      images: formik.values.images,
                      coverImage: formik.values.coverImage || "",
                    }}
                    touched={{ images: Array.isArray(formik.touched.images) }} // Convert to boolean explicitly
                    errors={formik.errors}
                    uploading={uploading}
                    handleFileChange={handleFileChange}
                    setPrimaryImage={(url) => {
                      // Move the selected image to index 0
                      const imgs = formik.values.images || [];
                      const newImages = [url, ...imgs.filter((img) => img !== url)];
                      formik.setFieldValue("images", newImages);
                      formik.setFieldValue("coverImage", url);
                    }}
                    handleDeleteImage={handleDeleteImage}
                    openSlider={() => { }} // Provided a no-op function
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="">
                      <TextField
                        name="name"
                        id="name"
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

                    <div>
                      <FormControl
                        fullWidth
                        variant="outlined"
                        error={formik.touched.storeId && Boolean(formik.errors.storeId)}
                      >
                        <InputLabel id="store-select-label">Store</InputLabel>
                        <Select
                          labelId="store-select-label"
                          name="storeId"
                          id="storeId"
                          value={formik.values.storeId}
                          label="Store"
                          onBlur={formik.handleBlur}
                          onChange={(e) => {
                            handleChange({
                              target: {
                                name: "storeId",
                                value: e.target.value,
                                type: "select-one",
                              },
                            } as React.ChangeEvent<HTMLSelectElement>);
                          }}
                        >

                          {stores.map((s) => (
                            <MenuItem key={String(s._id)} value={String(s._id)}>
                              {s.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {formik.touched.storeId && formik.errors.storeId && (
                          <ErrorMessageCom error={formik.errors.storeId} />
                        )}
                      </FormControl>
                    </div>
                  </div>

                  <div>
                    <TextareaField
                      id="description"
                      name="description"
                      label="Description *"
                      value={formik.values.description}
                      onChange={(e) => {
                        console.log("Description updated:", e.target.value); // Debugging log
                        formik.setFieldValue("description", e.target.value);
                      }}
                      onBlur={formik.handleBlur}
                      placeholder="Enter description here"
                      maxLength={400}
                      rows={5}
                      showCount={true}
                      error={formik.touched.description && formik.errors.description}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <TextField
                        name="manufacturer"
                        id="manufacturer"
                        label="Manufacturer *"
                        value={formik.values.manufacturer}
                        onChange={handleChange}
                        onBlur={formik.handleBlur}
                        fullWidth
                        variant="outlined"
                        placeholder="Manufacturer name"
                        error={
                          formik.touched.manufacturer &&
                          Boolean(formik.errors.manufacturer)
                        }
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

                    <div>
                      <TextField
                        name="stock"
                        id="stock"
                        label="Stock Quantity *"
                        type="text"
                        value={formik.values.stock}
                        onChange={handleChange}
                        onBlur={formik.handleBlur}
                        fullWidth
                        disabled={isEdit}
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

                    {/* Form Type */}
                    <div className="flex gap-4 items-end">
                      <FormControl
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 2 }}
                        error={formik.touched.category && Boolean(formik.errors.category)}
                      >
                        <InputLabel id="form-type-label">Form Type *</InputLabel>
                        <Select
                          labelId="form-type-label"
                          name="category"
                          id="category"
                          value={formik.values.category}
                          onBlur={formik.handleBlur}
                          onChange={(event) => {
                            handleChange({
                              target: {
                                name: "category",
                                value: event.target.value,
                                type: "select-one",
                              },
                            } as React.ChangeEvent<HTMLSelectElement>);
                            // Reset unit when category changes
                            formik.setFieldValue("unitInput", "");
                            formik.setFieldValue("unit", "");
                          }}
                          // onBlur removed from DatePicker (should be on TextField only)
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

                      {formik.touched.category && formik.errors.category && (
                        <ErrorMessageCom error={formik.errors.category} />
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {formik.values.category && (
                        <TextField
                          name="unitInput"
                          label="Unit"
                          value={formik.values.unitInput || ""}
                          disabled={formik.values.category === "Other"}
                          onChange={(e) => {
                            let val = e.target.value;
                            let suffix = "";
                            switch (formik.values.category) {
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
                            // Remove suffix if user types it
                            if (val.endsWith(suffix))
                              val = val.slice(0, -suffix.length);
                            formik.setFieldValue("unitInput", val);
                            formik.setFieldValue("unit", val + suffix);
                          }}
                          onBlur={formik.handleBlur}
                          variant="outlined"
                          placeholder={(() => {
                            switch (formik.values.category) {
                              case "Tablet":
                                return "e.g. 10";
                              case "Capsule":
                                return "e.g. 10";
                              case "Syrup":
                                return "e.g. 250";
                              case "Cream":
                                return "e.g. 15";
                              case "Drops":
                                return "e.g. 10";
                              case "Injection":
                                return "e.g. 5";
                              default:
                                return "e.g. 1 Unit";
                            }
                          })()}
                          InputProps={{
                            endAdornment: (() => {
                              switch (formik.values.category) {
                                case "Tablet":
                                  return (
                                    <span style={{ marginLeft: 8 }}>Tablets</span>
                                  );
                                case "Capsule":
                                  return (
                                    <span style={{ marginLeft: 8 }}>Capsules</span>
                                  );
                                case "Syrup":
                                  return <span style={{ marginLeft: 8 }}>ml</span>;
                                case "Cream":
                                  return <span style={{ marginLeft: 8 }}>g</span>;
                                case "Drops":
                                  return <span style={{ marginLeft: 8 }}>ml</span>;
                                case "Injection":
                                  return <span style={{ marginLeft: 8 }}>ml</span>;
                                default:
                                  return null;
                              }
                            })(),
                            style: {
                              borderRadius: "0.75rem",
                              background: "#fff",
                            },
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {" "}
                    {/* Increased grid gap */}
                    {/* Category */}
                    <div>
                      <FormControl
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 2 }}
                        error={formik.touched.categoryId && Boolean(formik.errors.categoryId)}
                      >
                        <InputLabel id="category-label">Category</InputLabel>
                        <Select
                          labelId="category-label"
                          name="categoryId"
                          id="categoryId"
                          value={formik.values.categoryId}
                          onBlur={formik.handleBlur}
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
                    {/* Subcategory */}
                    <div>
                      <FormControl
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 2 }}
                        error={formik.touched.subCategoryId && Boolean(formik.errors.subCategoryId)}
                      >
                        <InputLabel id="subcategory-label">Subcategory</InputLabel>
                        <Select
                          labelId="subcategory-label"
                          name="subCategoryId"
                          id="subCategoryId"
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
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="w-full">
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Expiry Date *"
                          value={
                            formik.values.expiryDate
                              ? new Date(formik.values.expiryDate)
                              : null
                          }
                          onChange={(date: Date | null) => {
                            formik.setFieldValue(
                              "expiryDate",
                              date ? date.toISOString().slice(0, 10) : ""
                            );
                          }}
                          minDate={new Date()}
                          slotProps={{
                            textField: {
                              name: "expiryDate",
                              id: "expiryDate",
                              fullWidth: true,
                              variant: "outlined",
                              onBlur: formik.handleBlur,
                              error:
                                formik.touched.expiryDate &&
                                Boolean(formik.errors.expiryDate),

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
                      {formik.touched.expiryDate && formik.errors.expiryDate && (
                        <ErrorMessageCom error={formik.errors.expiryDate} />
                      )}
                    </div>

                    <div className="">
                      <TextField
                        name="batchNumber"
                        id="batchNumber"
                        label="Batch Number*"
                        type="text"
                        value={formik.values.batchNumber}
                        onChange={handleChange}
                        onBlur={formik.handleBlur}
                        fullWidth
                        variant="outlined"
                        placeholder="Batch number"
                        error={
                          formik.touched.batchNumber &&
                          Boolean(formik.errors.batchNumber)
                        }
                        InputProps={{
                          style: {
                            borderRadius: "0.75rem",
                            background: "#fff",
                          },
                        }}
                      />
                      {formik.touched.batchNumber && formik.errors.batchNumber && (
                        <ErrorMessageCom error={formik.errors.batchNumber} />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {" "}
                    <div>
                      <TextField
                        name="mrp"
                        id="mrp"
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
                        id="purchasePrice"
                        label="Purchase Price (₹) *"
                        type="text"
                        value={formik.values.purchasePrice}
                        onChange={handleChange}
                        onBlur={formik.handleBlur}
                        fullWidth
                        variant="outlined"
                        placeholder="Purchase Price"
                        error={
                          formik.touched.purchasePrice &&
                          Boolean(formik.errors.purchasePrice)
                        }
                        InputProps={{
                          style: {
                            borderRadius: "0.75rem",
                            background: "#fff",
                          },
                        }}
                      />
                      {formik.touched.purchasePrice &&
                        formik.errors.purchasePrice && (
                          <ErrorMessageCom error={formik.errors.purchasePrice} />
                        )}
                    </div>
                    {/* Selling Price */}
                    <div>
                      <TextField
                        name="price"
                        id="price"
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
                  {/* Composition Section Styling */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Composition
                    </label>
                    {composition.map((c, idx) => (
                      <div
                        key={idx}
                        className="relative p-4 pt-10 md:pt-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm flex flex-col md:flex-row gap-3 md:items-center"
                      >
                        <button
                          type="button"
                          onClick={() => removeCompositionRow(idx)}
                          className="absolute top-2 right-2 md:static text-red-600 hover:text-red-800 font-medium p-1 transition shrink-0"
                          title="Remove composition row"
                        >
                          <DeleteIcon fontSize="small" />
                        </button>
                        <input
                          type="text"
                          placeholder="Name"
                          value={c.name}
                          onChange={(e) =>
                            handleCompositionChange(idx, "name", e.target.value)
                          }
                          className="w-full min-w-0 border bg-white text-gray-900 rounded-lg px-3 py-2 focus:ring-green-500 focus:border-green-500 transition"
                        />
                        <input
                          type="text"
                          placeholder="Value"
                          value={c.value}
                          onChange={(e) =>
                            handleCompositionChange(idx, "value", e.target.value)
                          }
                          className="w-full min-w-0 border bg-white text-gray-900 rounded-lg px-3 py-2 focus:ring-green-500 focus:border-green-500 transition"
                        />
                      </div>
                    ))}
                    {(composition || []).length < 5 && (
                      <button
                        type="button"
                        onClick={addCompositionRow}
                        className="text-green-600 hover:text-green-700 font-semibold mt-2 inline-flex items-center gap-1 transition"
                      >
                        <span className="text-xl">+</span> Add Composition
                      </button>
                    )}
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
                        className="flex gap-2 items-center p-3 border border-gray-200 rounded-lg bg-yellow-50 shadow-sm"
                      >
                        <input
                          type="text"
                          placeholder={`Highlight #${idx + 1}`}
                          value={h}
                          onChange={(e) => handleHighlightChange(idx, e.target.value)}
                          onBlur={formik.handleBlur}
                          className="border bg-white text-gray-900 rounded-lg px-3 py-2 flex-1 min-w-0 focus:ring-yellow-500 focus:border-yellow-500 transition"
                        />
                        <button
                          type="button"
                          onClick={() => removeHighlightRow(idx)}
                          className="text-red-600 hover:text-red-800 font-medium p-1 transition shrink-0"
                        >
                          <DeleteIcon fontSize="small" />
                        </button>
                      </div>
                    ))}
                    {(formik.values.highlights || []).length < 5 && (
                      <button
                        type="button"
                        onClick={addHighlightRow}
                        className="text-green-600 hover:text-green-700 font-semibold mt-2 inline-flex items-center gap-1 transition"
                      >
                        <span className="text-xl">+</span> Add Highlight
                      </button>
                    )}
                  </div>
                  <div className="space-y-4 border-t pt-8">
                    {" "}
                    <h3 className="text-xl font-bold text-gray-800">
                      {" "}
                      Medicine Classification
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-300 rounded-xl shadow-md">
                        {" "}
                        <input
                          type="checkbox"
                          id="isPrescription"
                          name="isPrescription"
                          checked={formik.values.isPrescription}
                          onChange={handleChange}
                          onBlur={formik.handleBlur}
                          className="w-6 h-6 text-orange-600 bg-white border-gray-300 rounded focus:ring-orange-500"
                        />
                        <label
                          htmlFor="isPrescription"
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
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  )}
                  <div className="  ButtonOuter">
                    {" "}
                    <div className="buttoninner  ">
                      <CustomButton type="submit" disabled={loading} width="100%">
                        {loading ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (

                          <MdSave size={22} />
                        )}
                        {isEdit
                          ? "Update Medicine"
                          : "Add Medicine"}
                      </CustomButton>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </>
        )

      }

    </>
  );
}
