"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";

import { useFormik } from "formik";
import * as Yup from "yup";
import FormSkeleton from "@/app/dashboard/components/skeleton/FormSkeleton";
import {
  CustomButton,
  ErrorMessageCom,
} from "@/app/dashboard/components/miniComponents";
import HeaderWithAction from "@/app/dashboard/components/HeaderWithAction";
import { CircularProgress } from "@mui/material";

export default function EditSubCategoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
      try {
        const res = await fetch(`/api/subcategories/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Subcategory updated successfully",
            showConfirmButton: false,
            timer: 2000,
          });
          setTimeout(() => {
            router.push("/dashboard/subcategories");
          }, 1200);
        } else {
          const errorMsg = Array.isArray(data.error)
            ? data.error.join(", ")
            : data.error;
          Swal.fire({
            icon: "error",
            title: "Update failed",
            text: errorMsg || "Failed to update subcategory",
          });
          setError(errorMsg);
        }
      } catch {
        Swal.fire({
          icon: "error",
          title: "Update failed",
          text: "Failed to update subcategory",
        });
        setError("Failed to update subcategory");
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
    validateOnChange: true,
    validateOnBlur: true,
    enableReinitialize: true,
  });

  useEffect(() => {
    async function fetchSubCategory() {
      try {
        const res = await fetch(`/api/subcategories/${id}`);
        const data = await res.json();
        if (data.success && data.data) {
          formik.setValues({
            name: data.data.name || "",
            description: data.data.description || "",
            categoryId: data.data.categoryId?._id || "",
            images: Array.isArray(data.data.images) ? data.data.images : [],
            isOTC: data.data.isOTC,
            isActive: data.data.isActive,
          });
        } else {
          setError("Subcategory not found");
        }
      } catch {
        setError("Failed to fetch subcategory");
      } finally {
        setLoading(false);
      }
    }
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data.data || []);
      } catch {}
    }
    fetchSubCategory();
    fetchCategories();
    // eslint-disable-next-line
  }, [id]);

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
          icon: "error",
          title: "Invalid file type",
          text: "Please upload only image files (JPEG, PNG, GIF, WebP, SVG)",
        });
        const fileInput = document.getElementById(
          "edit-subcategory-image-input"
        ) as HTMLInputElement | null;
        if (fileInput) fileInput.value = "";
        return;
      }
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        Swal.fire({
          icon: "error",
          title: "File too large",
          text: "Please upload an image smaller than 5MB",
        });
        const fileInput = document.getElementById(
          "edit-subcategory-image-input"
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
          title: "Image uploaded successfully",
          showConfirmButton: false,
          timer: 2000,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Image upload failed",
          text: data.error || "Failed to upload image",
        });
      }
      setUploading(false);
      const fileInput = document.getElementById(
        "edit-subcategory-image-input"
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
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
      formik.setFieldValue("images", []);
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

  if (loading) return <FormSkeleton />;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Edit Subcategory
"
        subtitle="Update subcategory details, images, and status.


"
        showBack={true}
        showSearch={false}
      />

      <div className="bg-white rounded-lg shadow p-6 sm:p-8">
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory Name *
            </label>
            <input
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              required
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {formik.touched.description && formik.errors.description && (
              <ErrorMessageCom error={formik.errors.description} />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory Image *
            </label>
            <div className="flex items-center gap-4">
              {formik.values.images.length === 0 ? (
                <div>
                  <input
                    id="edit-subcategory-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("edit-subcategory-image-input")
                        ?.click()
                    }
                    className="w-16 h-16 flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-200 transition"
                    title="Upload photo"
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
                  {uploading && (
                    <span className="ml-2 text-blue-600">Uploading...</span>
                  )}
                </div>
              ) : (
                <div className="relative group">
                  <img
                    src={formik.values.images[0]}
                    alt="Subcategory"
                    className="h-20 w-20 object-cover rounded border cursor-pointer"
                    title="Subcategory image"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(formik.values.images[0])}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-80 group-hover:opacity-100"
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
              )}
            </div>
            {formik.touched.images && formik.errors.images && (
              <ErrorMessageCom error={formik.errors.images as string} />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent Category *
            </label>
            <select
              name="categoryId"
              value={formik.values.categoryId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {formik.touched.categoryId && formik.errors.categoryId && (
              <ErrorMessageCom error={formik.errors.categoryId} />
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isOTC"
              name="isOTC"
              checked={formik.values.isOTC}
              onChange={formik.handleChange}
              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
            />
            <label
              htmlFor="isOTC"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              OTC Subcategory
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formik.values.isActive}
              onChange={formik.handleChange}
              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              Active
            </label>
          </div>
          <div className="w-[200px] pt-4">
            <CustomButton
              type="submit"
              disabled={loading || uploading || formik.isSubmitting}
              width="100%"
            >
              {loading || formik.isSubmitting ? "Saving..." : "Save Changes"}
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
}
