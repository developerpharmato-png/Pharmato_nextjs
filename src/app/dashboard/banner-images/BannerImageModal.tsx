"use client";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import React, { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Modal, Box, TextField } from "@mui/material";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { ImageUploadField } from "../components/ImageUploadField";
import {
  CustomButton,
  ErrorMessageCom,
  ModalHeader,
} from "../components/miniComponents";
import Swal from "sweetalert2";
import TextareaField from "../components/skeleton/FieldCom";
import { modalStyle } from "@/utils/style";

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
  });

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

  // Clear form values when the modal is closed
  useEffect(() => {
    if (!open) {
      formik.resetForm();
    }
  }, [open]);

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
    <Modal open={open} onClose={onClose} aria-labelledby="modal-title">
      <Box sx={{ ...modalStyle, width: "50vw" }}>
        {" "}
        <ModalHeader
          title={initial?._edit ? "Edit Banner" : "Add New Banner"}
          onClose={onClose}
        />
        <form onSubmit={formik.handleSubmit}>
          <Box>
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
{/* 
          <TextareaField
            id="targetScreen"
            name="alt"
            label="Description"
            value={formik.values.alt}
            onChange={(e) => {
              console.log("Description updated:", e.target.value); // Debugging log
              formik.setFieldValue("alt", e.target.value);
            }}
            placeholder="Enter description here"
            maxLength={200}
            rows={3}
            showCount={true}
            error={
              formik.touched.alt && typeof formik.errors.alt === "string"
                ? formik.errors.alt
                : undefined
            }
            className="mb-4"
          /> */}
<div className="mt-5"></div>
          <TextField
            name="targetId"
            select
            value={formik.values.targetId || ""}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            fullWidth
            SelectProps={{ native: true }}
            sx={{ mb: 2 }}
            error={formik.touched.targetId && !!formik.errors.targetId}
          >
            <option value="">Select Category *</option>
            {categories.map((cat: any) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </TextField>
          {formik.touched.targetId &&
            typeof formik.errors.targetId === "string" && (
              <ErrorMessageCom error={formik.errors.targetId} />
            )}

          <DialogActions>
            <CustomButton type="submit" disabled={loading}>
              {initial?._edit ? "Edit" : "Add"}
            </CustomButton>
          </DialogActions>
        </form>
      </Box>
    </Modal>
  );
};

export default BannerImageModal;
