"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { ToastMessages } from "@/utils/ToasterMessage";

import { useFormik } from "formik"; // Import useFormik
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import { MdSave } from "react-icons/md"; // For the Save Changes button icon

import CategoriesSkeleton from "@/app/dashboard/components/Skelton/Categories";
import {
  CustomButton,
  DeleteIcon,
  ErrorMessageCom,
} from "@/app/dashboard/components/miniComponents";
import { ImageUploadField } from "@/app/dashboard/components/ImageUploadField";
import {
  StandardFormCheckbox,
  StyledCheckboxWithDescription,
} from "@/app/dashboard/components/StyledCheckboxWithDescription";
import HeaderWithAction from "@/app/dashboard/components/HeaderWithAction";

// --- Utility Functions (You'll need these if they are not shared) ---
// Define the initial structure for Formik
interface EditCategoryForm {
  name: string;
  description: string;
  isOTC: boolean;
  images: string[];
  isActive: boolean;
}

const initEditCategory: EditCategoryForm = {
  name: "",
  description: "",
  isOTC: false,
  images: [],
  isActive: true,
};

// Define a simple validation function (adjust based on your actual `validateCategory`)
type EditCategoryFormErrors = {
  name?: string;
  description?: string;
  images?: string;
  isOTC?: string;
  isActive?: string;
};

const validateEditCategory = (
  values: EditCategoryForm
): EditCategoryFormErrors => {
  const errors: EditCategoryFormErrors = {};
  if (!values.name) {
    errors.name = "Category Name is required";
  } else if (values.name.length < 3) {
    errors.name = "Category Name must be at least 3 characters";
  }



  if (values.images.length === 0) {
    errors.images = "A category image is required";
  }
  return errors;
};
// -------------------------------------------------------------------

const MAX_DESCRIPTION_LENGTH = 1000;

export default function EditCategoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const [initialFetchLoading, setInitialFetchLoading] = useState(true);
  const [initialCategoryData, setInitialCategoryData] =
    useState(initEditCategory);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const theme = useTheme();
  // 1. Fetch initial data and set Formik's initial values
  useEffect(() => {
    async function fetchCategory() {
      try {
        const res = await fetch(`/api/admin/categories/${id}`);
        const data = await res.json();
        if (data.success && data.data) {
          setInitialCategoryData({
            name: data.data.name || "",
            description: data.data.description || "",
            isOTC: data.data.isOTC || false,
            images: Array.isArray(data.data.images) ? data.data.images : [],
            isActive:
              data.data.isActive === undefined ? true : data.data.isActive,
          });
        } else {
          setError("Category not found");
        }
      } catch {
        setError("Failed to fetch category");
      } finally {
        setInitialFetchLoading(false);
      }
    }
    if (id) {
      fetchCategory();
    }
  }, [id]);

  // 2. Formik Setup
  const formik = useFormik({
    initialValues: initialCategoryData,
    enableReinitialize: true, // Crucial for updating form when initialCategoryData changes
    validate: validateEditCategory, // Use the proper validation
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      setSubmitting(true);
      setError(null);
      try {
        // Manually check for image, as Formik might miss it on re-initialization if using custom components

        if (values.images.length === 0) {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
            title: "Image required",
            text: ToastMessages.CATEGORY_IMAGE_REQUIRED,
            showConfirmButton: false,
            timer: 2000,
          });
          setSubmitting(false);
          return;
        }

        const res = await fetch(`/api/admin/categories/${id}`, {
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
            title: ToastMessages.CATEGORY_UPDATED,
            showConfirmButton: false,
            timer: 2000,

          });
          setTimeout(() => router.push("/dashboard/categories"), 1200);
        } else {
          // Set Formik errors if validation/server errors are returned
          setErrors(data.errors || {});
          const errorMsg = data.error || ToastMessages.CATEGORY_UPDATE_FAILED;
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
            title: "Update failed",
            text: errorMsg,
            showConfirmButton: false,
            timer: 2000,
          });
          setError(errorMsg);
        }
      } catch (submitError) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "Update failed",
          text: ToastMessages.CATEGORY_UPDATE_FAILED,
          showConfirmButton: false,
          timer: 2000,
        });
        setError(ToastMessages.CATEGORY_UPDATE_FAILED);
      } finally {
        setSubmitting(false);
      }
    },
    validateOnChange: true,
    validateOnBlur: true,
  });

  // --- Image Handling Logic (Updated to use formik.setFieldValue) ---
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
          "edit-category-image-input"
        ) as HTMLInputElement | null;
        if (fileInput) fileInput.value = "";
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
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
          "edit-category-image-input"
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
        formik.setFieldValue("images", [data.url]); // Use formik setter
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
        "edit-category-image-input"
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    }
  };

  const handleDeleteImage = async (url: string) => {
    setDeleting(true);
    const res = await fetch("/api/cloudinary/delete-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url }),
    });
    const data = await res.json();
    if (data.success) {
      formik.setFieldValue(
        "images",
        formik.values.images.filter((img) => img !== url)
      ); // Use formik setter
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
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Delete failed",
        text: ToastMessages.IMAGE_DELETE_FAILED(data.error),
        showConfirmButton: false,
        timer: 2000,
      });
    }
    setDeleting(false);
  };


  // --- Component Rendering ---
  if (initialFetchLoading) {
    return (
      <Box sx={{ p: 4 }}>
        <CategoriesSkeleton />
      </Box>
    );
  }


  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title=" Edit Category"
        subtitle="Update Category details, images, and status."
        showBack={true}
        showSearch={false}
        isunsaved={formik.dirty}
      />


      <Box
        component="form"
        onSubmit={formik.handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        {/* Category Name Input (Width Limited & Custom Error) */}
        <Box sx={{ maxWidth: { xs: "100%", sm: "75%", md: "50%" } }}>
          <TextField
            label="Category Name *"
            size="medium"
            fullWidth
            InputLabelProps={{ shrink: true }}
            {...formik.getFieldProps("name")}
            error={formik.touched.name && Boolean(formik.errors.name)}
          />

          {/* Custom Error Component as requested */}
          {formik.touched.name && formik.errors.name && (
            <ErrorMessageCom error={formik.errors.name} />
          )}
        </Box>

        {/* Description Textarea (Character Counter) */}
        <TextField
          label="Description (Optional)"
          multiline
          rows={4}
          InputLabelProps={{ shrink: true }}
          inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
          {...formik.getFieldProps("description")}
          error={
            formik.touched.description && Boolean(formik.errors.description)
          }

          FormHelperTextProps={{
            sx: { textAlign: "right", mr: 0, mt: 0.5 },
          }}
        />

        <ImageUploadField
          formik={formik}
          handleFileChange={handleFileChange}
          handleDeleteImage={handleDeleteImage}
          previewOpen={previewOpen}
          setPreviewOpen={setPreviewOpen}
          uploading={uploading}
          deleting={deleting}
          label="Category Image"
          id="category-image-input"
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
          title="Over-the-Counter (OTC) category"
          description="Medicines in this category can be purchased without a prescription"
        />

        {/* <StandardFormCheckbox
              id="isActive"
              checked={formik.values.isActive}
              onChange={formik.handleChange}
              label="Active Subcategory"
            /> */}


        <div className="ButtonOuter">
          <div className="buttoninner">
            {" "}
            <CustomButton
              type="submit"
              disabled={formik.isSubmitting || !formik.isValid}
              width="100%"
            >
              {formik.isSubmitting ? (
                <>

                  <CircularProgress size={24} color="inherit" />
                  Update Category</>
              ) : (
                <>
                  <MdSave size={22} />{" "}

                  Update Category
                </>
              )}
            </CustomButton>
          </div>
        </div>


      </Box>

    </div>
  );
}
