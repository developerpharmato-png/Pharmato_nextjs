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
      {/* Header Section */}
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
            {/* Category Name Input (Width Limited & Custom Error) */}
            <Box sx={{ maxWidth: { xs: "100%", sm: "75%", md: "50%" } }}>
              <TextField
                label="Category Name *"
                size="medium"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...formik.getFieldProps("name")}
                // We still need the 'error' prop to turn the input red
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

            {/* Category Image Upload */}
            <Box>
              <Typography
                variant="body2"
                fontWeight="medium"
                color="text.primary"
                sx={{ mb: 1 }}
              >
                Category Image *
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {formik.values.images.length === 0 ? (
                  <Box>
                    <input
                      id="category-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                    <Button
                      variant="outlined"
                      component="label"
                      htmlFor="category-image-input"
                      sx={{
                        width: 80,
                        height: 80,
                        minWidth: 0,
                        borderStyle: "dashed",
                        borderColor: theme.palette.grey[400],
                        bgcolor: theme.palette.grey[50],
                        "&:hover": {
                          bgcolor: theme.palette.grey[100],
                          borderStyle: "dashed",
                        },
                      }}
                    >
                      <CloudUploadIcon
                        sx={{ fontSize: 32, color: theme.palette.grey[500] }}
                      />
                    </Button>
                    {uploading && (
                      <CircularProgress
                        size={24}
                        sx={{ ml: 2, color: theme.palette.primary.main }}
                      />
                    )}
                    {!uploading && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: { xs: "block", sm: "inline" },
                          mt: 1,
                          ml: 2,
                        }}
                      >
                        No image uploaded yet.
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ position: "relative", display: "inline-block" }}>
                    <img
                      src={formik.values.images[0]}
                      alt="Category"
                      onClick={() => setPreviewOpen(true)}
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: theme.shape.borderRadius,
                        border: `1px solid ${theme.palette.grey[300]}`,
                        cursor: "pointer",
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteImage(formik.values.images[0])}
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        bgcolor: theme.palette.error.main,
                        color: "white",
                        "&:hover": { bgcolor: theme.palette.error.dark },
                        width: 20,
                        height: 20,
                      }}
                    >
                      <DeleteIcon width={14} height={14} />
                    </IconButton>

                    {/* Image Preview Modal (MUI implementation) */}
                    {previewOpen && (
                      <Box
                        onClick={() => setPreviewOpen(false)}
                        sx={{
                          position: "fixed",
                          inset: 0,
                          zIndex: 1300,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backdropFilter: "blur(8px)",
                          bgcolor: "rgba(0, 0, 0, 0.5)",
                        }}
                      >
                        <Box
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            bgcolor: "white",
                            borderRadius: 2,
                            boxShadow: 24,
                            p: 3,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <img
                            src={formik.values.images[0]}
                            alt="Preview"
                            style={{
                              maxWidth: "80vw",
                              maxHeight: "80vh",
                              marginBottom: theme.spacing(2),
                              borderRadius: theme.shape.borderRadius,
                            }}
                          />
                          <Button
                            onClick={() => setPreviewOpen(false)}
                            variant="contained"
                            startIcon={<CloseIcon />}
                            sx={{
                              bgcolor: theme.palette.grey[700],
                              "&:hover": { bgcolor: theme.palette.grey[900] },
                            }}
                          >
                            Close
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Box>

            {/* Checkboxes for Category Attributes */}
            <Box
              sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}
            >
              {/* OTC Checkbox */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: theme.palette.success.light,
                  border: `1px solid ${theme.palette.success.light}`,
                  borderRadius: 1,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      id="isOTC"
                      checked={formik.values.isOTC}
                      onChange={(e) =>
                        formik.setFieldValue("isOTC", e.target.checked)
                      }
                      color="success"
                    />
                  }
                  label={
                    <Box>
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        color="text.primary"
                      >
                        Over-the-Counter (OTC) Category
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Medicines in this category can be purchased without a
                        prescription
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0 }}
                />
              </Box>

              {/* Active Checkbox */}
              <FormControlLabel
                control={
                  <Checkbox
                    id="isActive"
                    checked={formik.values.isActive}
                    onChange={(e) =>
                      formik.setFieldValue("isActive", e.target.checked)
                    }
                    color="success"
                  />
                }
                label="Active Category"
                sx={{
                  m: 0,
                  ".MuiTypography-root": {
                    fontSize: theme.typography.pxToRem(14),
                    fontWeight: theme.typography.fontWeightMedium,
                  },
                }}
              />
            </Box>

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
