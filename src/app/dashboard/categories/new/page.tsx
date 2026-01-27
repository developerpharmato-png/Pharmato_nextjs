"use client";
import React, { useState } from "react";
import Swal from "sweetalert2";
import { ToastMessages } from "@/utils/ToasterMessage";
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
import {
  StandardFormCheckbox,
  StyledCheckboxWithDescription,
} from "../../components/StyledCheckboxWithDescription";
import HeaderWithAction from "../../components/HeaderWithAction";

const MAX_DESCRIPTION_LENGTH = 1000;

export default function NewCategoryPage() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const theme = useTheme();
  // --- Formik Setup (Logic Unchanged) ---
  const formik = useFormik({
    initialValues: initCategory,
    validate: validateCategory,
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      setLoading(true);
      try {
        const payload = { ...values, isActive: true };
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: ToastMessages.CATEGORY_CREATED,
            showConfirmButton: false,
            timer: 2000,
          });
          setTimeout(() => router.push("/dashboard/categories"), 1200);
        } else {
          const errorMsg = data.error || data.message || "Failed to create category";
          if (data.errors && typeof data.errors === "object") {
            setErrors(data.errors as any);
          }
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
            showConfirmButton: false,
            timer: 2000,
            text: errorMsg,
          });
        }
      } catch (error) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          showConfirmButton: false,
          timer: 2000,
          text: ToastMessages.CATEGORY_CREATE_FAILED,
        });
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
    validateOnChange: true,
    validateOnBlur: true,
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
          icon: "error",
          title: "Invalid file type",
          text: ToastMessages.INVALID_FILE_TYPE,
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
          text: ToastMessages.FILE_TOO_LARGE,
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
          title: ToastMessages.IMAGES_UPLOADED(1),
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
    setDeleting(true);
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
    } else {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: ToastMessages.IMAGE_DELETE_FAILED(data.error),
      });
    }
    setDeleting(false);
  };

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title=" Add New Category"
        subtitle=" Create a new medicine category for your inventory"
        showBack={true}
        showSearch={false}
        addLabel="Add "
        addShow={false}
        isunsaved={formik.dirty}
      />
      {/* Form Card */}

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
          label="Description (Optional)"

          multiline
          rows={4}
          InputLabelProps={{ shrink: true }}
          inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
          {...formik.getFieldProps("description")}
       
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

        <Box sx={{ display: "flex", gap: 2, pt: 2 }}>
          <div className="ButtonOuter">
            <div className="buttoninner">
              {" "}
              <CustomButton type="submit" disabled={loading} width="100%">
                {loading || formik.isSubmitting ? (
                  <>
                    <CircularProgress size={24} color="inherit" />
                    Add Category
                  </>
                ) : (
                  <>
                    <MdSave size={22} />{" "}

                    Add Category
                  </>
                )}
              </CustomButton>
            </div>

          </div>
        </Box>
      </Box>

    </div>
  );
}
