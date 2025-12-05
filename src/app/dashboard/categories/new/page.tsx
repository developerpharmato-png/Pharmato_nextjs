"use client";
import React, { useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
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

import {
  CustomButton,
  DeleteIcon,
  ErrorMessageCom, // This component is now used for the Name field
} from "../../components/miniComponents";

import { initCategory } from "../../../../utils/initCategory";
import { validateCategory } from "../../../../utils/validateCategory";
import { MdSave } from "react-icons/md";
import { ImageUploadField } from "../../components/ImageUploadField";
import { StandardFormCheckbox, StyledCheckboxWithDescription } from "../../components/StyledCheckboxWithDescription";

const MAX_DESCRIPTION_LENGTH = 1000;

export default function NewCategoryPage() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const theme = useTheme();

  // --- Formik Setup (Logic Unchanged) ---
  const formik = useFormik({
    initialValues: initCategory,
    validate: validateCategory,
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      setLoading(true);
      try {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Category created successfully",
            showConfirmButton: false,
            timer: 2000,
          });
          setTimeout(() => router.push("/dashboard/categories"), 1200);
        } else {
          setErrors(data.error || {});
          Swal.fire({
            icon: "error",
            title: "Create failed",
            text: data.error || "Failed to create category",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Create failed",
          text: "Failed to create category",
        });
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
    validateOnChange: true,
    validateOnBlur: true,
  });

  // --- Image Handling Logic (Unchanged) ---
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
          "category-image-input"
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
          "category-image-input"
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
        "category-image-input"
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

  // --- Component Rendering (MUI Conversion) ---
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
            Add New Category
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Create a new medicine category for your inventory
          </Typography>
        </Box>
      </Box>

      {/* Form Card */}
      <Card raised sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
            <Box sx={{ maxWidth: { xs: "100%", sm: "75%", md: "50%" } }}>
              <TextField
                label="Category Name *"
                size="medium"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...formik.getFieldProps("name")}
                error={formik.touched.name && Boolean(formik.errors.name)}
              />

              {formik.touched.name && formik.errors.name && (
                <ErrorMessageCom error={formik.errors.name} />
              )}
            </Box>

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

          

            <Box sx={{ display: "flex", gap: 2, pt: 2 }}>
              <div className="mt-8 flex justify-center w-full">
                <div className="flex justify-center w-full max-w-sm">
                  {" "}
                  <CustomButton type="submit" disabled={loading} width="100%">
                    {loading || formik.isSubmitting ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Create Category"
                    )}
                  </CustomButton>
                </div>
              </div>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </div>
  );
}
