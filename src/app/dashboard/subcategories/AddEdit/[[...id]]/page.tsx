"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Swal from "sweetalert2";
import { ToastMessages } from "@/utils/ToasterMessage";
import HeaderWithAction from "@/app/dashboard/components/HeaderWithAction";
import { CustomButton, ErrorMessageCom } from "@/app/dashboard/components/miniComponents";
import { CircularProgress } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ImageUploadField } from "@/app/dashboard/components/ImageUploadField";
import {
  StyledCheckboxWithDescription,
} from "@/app/dashboard/components/StyledCheckboxWithDescription";
import { dropdownCategoriesPath } from "@/app/dashboard/storeAPICall/API/BaseApi";
import { MdSave } from "react-icons/md";
import FormSkeleton from "@/app/dashboard/components/skeleton/FormSkeleton";

export default function AddEditSubCategoryPage({ id }: { id?: string }) {
  const router = useRouter();
  const params = useParams();
  const usedId = id && id !== "undefined" ? id : (params as any)?.id?.[0];

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [initialFetchLoading, setInitialFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data if editing
  useEffect(() => {
    async function fetchSubCategory() {
      if (!usedId) {
        setInitialFetchLoading(false);
        return;
      }

      try {
        setIsEdit(true);
        const res = await fetch(`/api/admin/subcategories/${usedId}`);
        const data = await res.json();
        if (data.success && data.data) {
          formik.setValues({
            name: data.data.name || "",
            description: data.data.description || "",
            categoryId: data.data.categoryId?._id || "",
            images: Array.isArray(data.data.images) ? data.data.images : [],
            isOTC: data.data.isOTC || false,
            isActive: data.data.isActive !== undefined ? data.data.isActive : true,
          });
        } else {
          setError("Subcategory not found");
        }
      } catch {
        setError("Failed to fetch subcategory");
      } finally {
        setInitialFetchLoading(false);
      }
    }

    fetchSubCategory();
  }, [usedId]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(dropdownCategoriesPath);
      const data = await res.json();
      setCategories(data.data || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      categoryId: "",
      images: [] as string[],
      isOTC: false,
      isActive: true,
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .min(2, "Subcategory name must be at least 2 characters.")
        .required("Subcategory name is required."),
      description: Yup.string()
        .min(5, "Description must be at least 5 characters.")
        .required("Description is required."),
      categoryId: Yup.string().required("Parent category is required."),
      images: Yup.array().min(1, "Please upload a subcategory image."),
    }),
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      setLoading(true);
      try {
        const method = isEdit ? "PUT" : "POST";
        const url = isEdit ? `/api/admin/subcategories/${usedId}` : "/api/admin/subcategories";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: isEdit ? ToastMessages.SUBCATEGORY_UPDATED : "Subcategory created successfully",
            showConfirmButton: false,
            timer: 2000,
          });
          setTimeout(() => router.push("/dashboard/subcategories"), 1200);
        } else {
          setErrors(data.error || {});
          const errorMsg = Array.isArray(data.error)
            ? data.error.join(", ")
            : data.error || (isEdit ? ToastMessages.SUBCATEGORY_UPDATE_FAILED : "Failed to create subcategory");
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
            title: isEdit ? "Update failed" : "Create failed",
            text: errorMsg,
            showConfirmButton: false,
            timer: 2000,
          });
        }
      } catch (error) {
        const errorMsg = isEdit ? ToastMessages.SUBCATEGORY_UPDATE_FAILED : "Failed to create subcategory";
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: isEdit ? "Update failed" : "Create failed",
          text: errorMsg,
          showConfirmButton: false,
          timer: 2000,
        });
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
    validateOnChange: true,
    validateOnBlur: true,
    enableReinitialize: true,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "Invalid file type",
          text: ToastMessages.INVALID_FILE_TYPE,
          showConfirmButton: false,
          timer: 2000,
        });
        const fileInput = document.getElementById(
          "subcategory-image-input"
        ) as HTMLInputElement | null;
        if (fileInput) fileInput.value = "";
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "File too large",
          text: ToastMessages.FILE_TOO_LARGE,
          showConfirmButton: false,
          timer: 2000,
        });
        const fileInput = document.getElementById(
          "subcategory-image-input"
        ) as HTMLInputElement | null;
        if (fileInput) fileInput.value = "";
        return;
      }

      setUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      const res = await fetch("/api/cloudinary/upload-image", {
        method: "POST",
        body: uploadFormData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        formik.setFieldValue("images", [data.url]);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: ToastMessages.IMAGES_UPLOADED(1),
          showConfirmButton: false,
          timer: 2000,
        });
      } else {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "Image upload failed",
          text: data.error || "Failed to upload image",
          showConfirmButton: false,
          timer: 2000,
        });
      }
      setUploading(false);
      const fileInput = document.getElementById(
        "subcategory-image-input"
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    }
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
      formik.setFieldValue("images", []);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: ToastMessages.IMAGE_DELETED,
        showConfirmButton: false,
        timer: 2000,
      });
        setUploading(true);
    } else {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Delete failed",
        text: ToastMessages.IMAGE_DELETE_FAILED(data.error),
        showConfirmButton: false,
        timer: 2000,
      });
        setUploading(true);
    }
  };

  const selectedCategory = categories.find(
    (cat) => cat._id === formik.values.categoryId
  );

  if (initialFetchLoading) {
    return (
      <div className="containerStyle scrollbar-hide">
        <FormSkeleton />
      </div>
    );
  }

  if (error && !formik.isSubmitting) {
    return (
      <div className="containerStyle scrollbar-hide">
        <div className="p-8 text-red-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title={isEdit ? "Edit Subcategory" : "Add New Subcategory"}
        subtitle={
          isEdit
            ? "Update subcategory details, images, and status."
            : "Create a new medicine subcategory for your inventory"
        }
        showBack={true}
        showSearch={false}
      />

      <div className="bg-white rounded-lg shadow p-6 sm:p-8">
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent Category *
            </label>
            <select
              name="categoryId"
              value={formik.values.categoryId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name} {cat.isOTC ? "(OTC)" : "(Prescription)"}
                </option>
              ))}
            </select>
            {formik.touched.categoryId && formik.errors.categoryId && (
              <ErrorMessageCom error={formik.errors.categoryId} />
            )}
            {selectedCategory && (
              <p className="text-xs text-gray-500 mt-1">
                Parent category is{" "}
                {selectedCategory.isOTC ? "OTC" : "Prescription Required"}
              </p> 
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory Name *
            </label>
            <input
              type="text"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Headache Relief, Cold & Flu, Multivitamins"
            />
            {formik.touched.name && formik.errors.name && (
              <ErrorMessageCom error={formik.errors.name} />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={4}
              placeholder="Brief description of the subcategory"
            />
            {formik.touched.description && formik.errors.description && (
              <ErrorMessageCom error={formik.errors.description} />
            )}
          </div>

          <ImageUploadField
            formik={formik}
            handleFileChange={handleFileChange}
            handleDeleteImage={handleDeleteImage}
            previewOpen={previewOpen && (formik.values.images?.length ?? 0) > 0}
            setPreviewOpen={setPreviewOpen}
            uploading={uploading}
            deleting={false}
            label="Subcategory Image *"
            id="subcategory-image-input"
          />
          {formik.touched.images && formik.errors.images && (
            <ErrorMessageCom
              error={
                Array.isArray(formik.errors.images)
                  ? formik.errors.images.join(", ")
                  : (formik.errors.images as string)
              }
            />
          )}

          <StyledCheckboxWithDescription
            id="isOTC"
            checked={formik.values.isOTC}
            onChange={formik.handleChange}
            title="Over-the-Counter (OTC) Subcategory"
            description="Medicines in this subcategory can be purchased without a prescription"
          />

          <div className="ButtonOuter">
            <div className="buttoninner">
              <CustomButton
                type="submit"
                disabled={loading || uploading || formik.isSubmitting}
                width="100%"
              >
                {loading || formik.isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <>
                    <MdSave size={22} />
                    {isEdit ? "Update Subcategory" : "Add Subcategory"}
                  </>
                )}
              </CustomButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
