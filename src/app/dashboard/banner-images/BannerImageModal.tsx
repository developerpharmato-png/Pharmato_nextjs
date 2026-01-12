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
import { ToastMessages } from "@/utils/ToasterMessage";
import TextareaField from "../components/skeleton/FieldCom";
import { modalStyle } from "@/utils/style";
import { MdSave } from "react-icons/md";

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
    url: Yup.string().required("App Image is required"),
    webImage: Yup.string().required("Web Image is required"),
    targetId: Yup.string().required("Category is required"),
  });

  // Uploading state for app and web images
  const [uploading, setUploading] = React.useState(false);
  const [webUploading, setWebUploading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [webDeleting, setWebDeleting] = React.useState(false);
  console.log(initial, "initial");


  const formik = useFormik({
    initialValues: {

      url: initial?.url || "",
      webImage: initial?.webImage || initial?.weburl || "",
      alt: initial?.alt || "",
      isActive: typeof initial?.isActive === 'boolean' ? initial.isActive : true,
      targetId: initial?.targetId || "",
      targetScreen: initial?.targetScreen || "",
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

  // App image upload handler with dimension validation (1080x540)
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
          title: ToastMessages.INVALID_FILE_TYPE,
          showConfirmButton: false,
          timer: 2000,
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
          toast: true,
          position: "top-end",
          icon: "error",
          title: ToastMessages.FILE_TOO_LARGE,
          showConfirmButton: false,
          timer: 2000,
        });
        const fileInput = document.getElementById(
          "category-image-input"
        ) as HTMLInputElement | null;
        if (fileInput) fileInput.value = "";
        return;
      }

      // Validate image dimensions (1080x540)
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      if (img.width !== 1080 || img.height !== 540) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: `App Banner must be 1080x540 px`,
          showConfirmButton: false,
          timer: 2500,
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
        formik.setFieldValue("url", data.url);
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
        "category-image-input"
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    }
  };
  // Web image upload handler with dimension validation (1920x600)
  const handleWebFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          title: ToastMessages.INVALID_FILE_TYPE,
          showConfirmButton: false,
          timer: 2000,
        });
        const fileInput = document.getElementById(
          "web-banner-image-input"
        ) as HTMLInputElement | null;
        if (fileInput) fileInput.value = "";
        return;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB for web
      if (file.size > maxSize) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: ToastMessages.FILE_TOO_LARGE,
          showConfirmButton: false,
          timer: 2000,
        });
        const fileInput = document.getElementById(
          "web-banner-image-input"
        ) as HTMLInputElement | null;
        if (fileInput) fileInput.value = "";
        return;
      }

      // Validate image dimensions (1920x600)
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      if (img.width !== 1920 || img.height !== 600) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: `Web Banner must be 1920x600 px`,
          showConfirmButton: false,
          timer: 2500,
        });
        const fileInput = document.getElementById(
          "web-banner-image-input"
        ) as HTMLInputElement | null;
        if (fileInput) fileInput.value = "";
        return;
      }

      setWebUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      const res = await fetch("/api/cloudinary/upload-image", {
        method: "POST",
        body: uploadFormData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        formik.setFieldValue("webImage", data.url);
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
      setWebUploading(false);
      const fileInput = document.getElementById(
        "web-banner-image-input"
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
      formik.setFieldValue("url", "");
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
        title: ToastMessages.IMAGE_DELETE_FAILED(data.error),
        showConfirmButton: false,
        timer: 2000,
      });
    }
    setDeleting(false);
  };

  // Web image delete handler
  const handleWebDeleteImage = async (url: string) => {
    setWebDeleting(true);
    const res = await fetch("/api/cloudinary/delete-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url }),
    });
    const data = await res.json();
    if (data.success) {
      formik.setFieldValue("webImage", "");
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
        title: ToastMessages.IMAGE_DELETE_FAILED(data.error),
        showConfirmButton: false,
        timer: 2000,
      });
    }
    setWebDeleting(false);
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="modal-title">
      <Box sx={{ ...modalStyle, width: "50vw" }}>
        <ModalHeader
          title={initial?._edit ? "Edit Banner" : "Add New Banner"}
          onClose={onClose}
        />
        <form onSubmit={formik.handleSubmit}>

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

          <Box className="flex mt-3 flex-col md:flex-row md:justify-between md:items-start gap-4"
            sx={{ width: '100%' }}>
            {/* App Image Upload */}
            <div className="">
              <ImageUploadField
                formik={formik}
                handleFileChange={handleFileChange}
                handleDeleteImage={handleDeleteImage}
                previewOpen={false}
                setPreviewOpen={() => { }}
                uploading={uploading}
                deleting={deleting}
                label="App Banner (1080 × 540 px)"
                id="banner-image-input"
              />
              <div style={{ fontSize: '12px', color: '#888', marginTop: 2 }}>
                Required size: 1080 × 540 px
              </div>
              {formik.touched.url && typeof formik.errors.url === "string" && (
                <ErrorMessageCom error={formik.errors.url} />
              )}
            </div>
            {/* Web Image Upload */}
            <div className="">
              <ImageUploadField
                formik={formik}
                handleFileChange={handleWebFileChange}
                handleDeleteImage={handleWebDeleteImage}
                previewOpen={false}
                setPreviewOpen={() => { }}
                uploading={webUploading}
                deleting={webDeleting}
                label="Web Banner Image (1920x600 px)"
                id="web-banner-image-input"
              />
              <div style={{ fontSize: '12px', color: '#888', marginTop: 2 }}>
                Required size: 1920 × 600 px
              </div>
              {formik.touched.webImage && typeof formik.errors.webImage === "string" && (
                <ErrorMessageCom error={formik.errors.webImage} />
              )}
            </div>
          </Box>

          <div className="mt-5"></div>

          <DialogActions>
            <CustomButton type="submit" disabled={loading}>
              <MdSave size={22} />{" "}

              {initial?._edit ? "Edit" : "Add"}
            </CustomButton>
          </DialogActions>
        </form>
      </Box>
    </Modal>
  );
};

export default BannerImageModal;
