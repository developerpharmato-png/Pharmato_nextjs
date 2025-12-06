"use client";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import React, { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { Box, Switch, TextField, Button } from "@mui/material";
import { ImageUploadField } from "../components/ImageUploadField";
import { CustomButton, ErrorMessageCom } from "../components/miniComponents";
import Swal from "sweetalert2";

interface BannerImageModalProps {
  open: boolean;
  initial: any;
  onSave: (img: any) => void;
  onClose: () => void;
  categories: any[];
  loading: boolean;
}

const BannerImageModal: React.FC<BannerImageModalProps> = ({
  open,
  initial,
  onSave,
  onClose,
  categories,
  loading,
}) => {
  const validationSchema = Yup.object().shape({
    url: Yup.string().required("Image is required"),
    targetId: Yup.string().required("Category is required"),
    targetScreen: Yup.string().test(
      "is-url",
      "Please enter a valid URL (e.g. https://...)",
      (value) => {
        if (!value) return true;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      }
    ),
    isActive: Yup.boolean(),
  });

  // Map url to images array for ImageUploadField compatibility
  const formik = useFormik({
    initialValues: initial || {
      url: "",
      alt: "",
      isActive: true,
      targetId: "",
      targetScreen: "",
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      onSave(values);
    },
  });
  // Always provide images array for ImageUploadField
  const formikWithImages = {
    ...formik,
    values: {
      ...formik.values,
      images: formik.values.url ? [formik.values.url] : [],
    },
  };

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

      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      const res = await fetch("/api/cloudinary/upload-image", {
        method: "POST",
        body: uploadFormData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        formik.setFieldValue("images", [data.url]);
        formik.setFieldValue("url", data.url);
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
      formik.setFieldValue("url", ""); // Sync url for validation
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        style: { borderRadius: 16 },
      }}
    >
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle sx={{ position: "relative", pr: 5 }}>
          {initial?._edit ? "Edit Banner Image" : "Add Banner Image"}
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
              cursor: "pointer",
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <ImageUploadField
              formik={formikWithImages}
              handleFileChange={handleFileChange}
              handleDeleteImage={handleDeleteImage}
              previewOpen={false}
              setPreviewOpen={() => {}}
              uploading={false}
              deleting={false}
              label="Banner Image"
              id="banner-image-input"
            />
            {formik.touched.url && typeof formik.errors.url === "string" && (
              <ErrorMessageCom error={formik.errors.url} />
            )}
          </Box>
          <TextField
            label="Alt Text"
            name="alt"
            value={formik.values.alt}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            fullWidth
            error={formik.touched.alt && !!formik.errors.alt}
            helperText={
              formik.touched.alt && typeof formik.errors.alt === "string"
                ? formik.errors.alt
                : undefined
            }
            inputProps={{ maxLength: 100 }}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Target Screen/URL"
            name="targetScreen"
            value={formik.values.targetScreen || ""}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            fullWidth
            error={formik.touched.targetScreen && !!formik.errors.targetScreen}
            helperText={
              formik.touched.targetScreen &&
              typeof formik.errors.targetScreen === "string"
                ? formik.errors.targetScreen
                : undefined
            }
            sx={{ mb: 2 }}
          />
          <TextField
            label="Active Category"
            name="targetId"
            select
            value={formik.values.targetId || ""}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            fullWidth
            SelectProps={{ native: true }}
            sx={{ mb: 2 }}
            required
            error={formik.touched.targetId && !!formik.errors.targetId}
            helperText={
              formik.touched.targetId &&
              typeof formik.errors.targetId === "string"
                ? formik.errors.targetId
                : undefined
            }
          >
            <option value="">Select Category</option>
            {categories.map((cat: any) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </TextField>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Switch
              checked={!!formik.values.isActive}
              onChange={(e) =>
                formik.setFieldValue("isActive", e.target.checked)
              }
              color="success"
            />
            <span
              style={{
                fontWeight: 600,
                color: formik.values.isActive ? "#10b981" : "#888",
              }}
            >
              {formik.values.isActive ? "Active" : "Inactive"}
            </span>
          </Box>
        </DialogContent>
        <DialogActions>
          <CustomButton type="submit" disabled={loading}>
            {initial?._edit ? "Edit" : "Add "}
          </CustomButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BannerImageModal;
