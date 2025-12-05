"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
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

  if (!values.description) {
    errors.description = "Description is required";
  } else if (values.description.length < 10) {
    errors.description = "Description must be at least 10 characters";
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const theme = useTheme();

  // 1. Fetch initial data and set Formik's initial values
  useEffect(() => {
    async function fetchCategory() {
      try {
        const res = await fetch(`/api/categories/${id}`);
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
            icon: "error",
            title: "Image required",
            text: "Please upload a category image before submitting",
          });
          setSubmitting(false);
          return;
        }

        const res = await fetch(`/api/categories/${id}`, {
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
            title: "Category updated successfully",
            showConfirmButton: false,
            timer: 2000,
          });
          setTimeout(() => router.push("/dashboard/categories"), 1200);
        } else {
          // Set Formik errors if validation/server errors are returned
          setErrors(data.errors || {});
          const errorMsg = data.error || "Failed to update category";
          Swal.fire({
            icon: "error",
            title: "Update failed",
            text: errorMsg,
          });
          setError(errorMsg);
        }
      } catch (submitError) {
        Swal.fire({
          icon: "error",
          title: "Update failed",
          text: "Failed to connect to the server to update category.",
        });
        setError("Failed to connect to the server to update category.");
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
          icon: "error",
          title: "Invalid file type",
          text: "Please upload only image files",
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
          icon: "error",
          title: "File too large",
          text: "Please upload an image smaller than 5MB",
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
        "edit-category-image-input"
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
      formik.setFieldValue(
        "images",
        formik.values.images.filter((img) => img !== url)
      ); // Use formik setter
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

  // --- Component Rendering ---
  if (initialFetchLoading) {
    return (
      <Box sx={{ p: 4 }}>
        <CategoriesSkeleton />
      </Box>
    );
  }

  if (error && !formik.isSubmitting) {
    return (
      <Box sx={{ p: 4, color: "error.main", textAlign: "center" }}>
        <Typography variant="h6">{error}</Typography>
      </Box>
    );
  }

  return (
    <div className="containerStyle scrollbar-hide">
      <Box sx={{ mb: 4, position: "relative" }}>
        <IconButton
          onClick={() => router.back()}
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            bgcolor: "white",
            border: `1px solid ${theme.palette.grey[300]}`,
            boxShadow: 1,
            "&:hover": { bgcolor: theme.palette.grey[50] },
            "&:focus": {
              boxShadow: `0 0 0 4px ${theme.palette.success.light}`,
              outline: "none",
            },
          }}
          aria-label="Go back"
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ pl: 7 }}>
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            gutterBottom
            sx={{ color: theme.palette.grey[800] }}
          >
            Edit Category
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 2 }}
          ></Typography>
        </Box>
      </Box>

      <Card raised sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
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
              label="Description *"
              multiline
              rows={4}
              InputLabelProps={{ shrink: true }}
              inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
              {...formik.getFieldProps("description")}
              error={
                formik.touched.description && Boolean(formik.errors.description)
              }
              helperText={
                formik.touched.description && formik.errors.description
                  ? formik.errors.description
                  : `${formik.values.description.length} / ${MAX_DESCRIPTION_LENGTH} characters`
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
              deleting={false}
              label="Category Image"
              id="category-image-input"
            />

            <StyledCheckboxWithDescription
              id="isOTC"
              checked={formik.values.isOTC}
              onChange={formik.handleChange}
              title="Over-the-Counter (OTC) Subcategory"
              description="Medicines in this subcategory can be purchased without a prescription"
            />

            <StandardFormCheckbox
              id="isActive"
              checked={formik.values.isActive}
              onChange={formik.handleChange}
              label="Active Subcategory"
            />

            <Box sx={{ display: "flex", gap: 2, pt: 4 }}>
              <Box sx={{ display: "flex", gap: 2, pt: 2 }}>
                <div className="mt-8 flex justify-center w-full">
                  <div className="flex justify-center w-full max-w-sm">
                    {" "}
                    <CustomButton
                      type="submit"
                      disabled={formik.isSubmitting || !formik.isValid}
                      width="100%"
                    >
                      {formik.isSubmitting ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        "Save Changes"
                      )}
                    </CustomButton>
                  </div>
                </div>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </div>
  );
}
