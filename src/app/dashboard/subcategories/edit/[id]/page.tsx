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
import { ImageUploadField } from "@/app/dashboard/components/ImageUploadField";
import {
  StandardFormCheckbox,
  StyledCheckboxWithDescription,
} from "@/app/dashboard/components/StyledCheckboxWithDescription";
import { dropdownCategoriesPath } from "@/app/dashboard/storeAPICall/API/BaseApi";

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
        const res = await fetch(`/api/admin/subcategories/${id}`, {
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
        const res = await fetch(`/api/admin/subcategories/${id}`);
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
        const res = await fetch(dropdownCategoriesPath);
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

  if (loading)
    return (
      <>
        <div className="containerStyle scrollbar-hide">
          <FormSkeleton />;
        </div>
      </>
    );

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
          <ImageUploadField
            formik={formik}
            handleFileChange={handleFileChange}
            handleDeleteImage={handleDeleteImage}
            previewOpen={!!(formik.touched.images && formik.errors.images)}
            setPreviewOpen={() => {}}
            uploading={uploading}
            deleting={false}
            label="Subcategory Image *"
            id="category-image-input"
          />

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

          <StyledCheckboxWithDescription
            id="isOTC"
            checked={formik.values.isOTC}
            onChange={formik.handleChange}
            title="Over-the-Counter (OTC) Subcategory"
            description="Medicines in this subcategory can be purchased without a prescription"
          />

          {/* <StandardFormCheckbox
            id="isActive"
            checked={formik.values.isActive}
            onChange={formik.handleChange}
            label="Active Subcategory"
          /> */}

          <div className="mt-8 flex ButtonOuter w-full">
            {" "}
            <div className="buttoninner  w-full max-w-sm">
              <CustomButton
                type="submit"
                disabled={loading || uploading || formik.isSubmitting}
                width="100%"
              >
                {loading || formik.isSubmitting ? "Saving..." : "Save Changes"}
              </CustomButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
