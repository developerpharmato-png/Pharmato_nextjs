"use client";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import HeaderWithAction from "../components/HeaderWithAction";
import { ImageUploadField } from "../components/ImageUploadField";
import {
  CustomButton,
  CustomImage,
  ErrorMessageCom,
  CustomTooltip,
} from "../components/miniComponents";
import { Switch, TextField, Box } from "@mui/material";
import { showConfirmStatusAlert } from "../components/ConfirmStatusAlert";
import { CustomTable } from "../components/CustomTable";
import BannerImageModal from "./BannerImageModal";
import { Delete, DeleteIcon, Edit, EditIcon } from "lucide-react";
import { dropdownCategoriesPath } from "../storeAPICall/API/BaseApi";

export default function BannerImagesDashboard() {
  const [modal, setModal] = useState<{ open: boolean; editIdx: number | null }>(
    { open: false, editIdx: null }
  );
  const [images, setImages] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [inputImages, setInputImages] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Image upload handler (max 3 images, show size, cancel/delete button)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    // Validate count (max 3)
    if (images.length + files.length > 3) {
      Swal.fire({
        icon: "error",
        title: "Too many images",
        text: `You can upload up to 3 images. Currently ${images.length} uploaded.`,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    const maxSize = 5 * 1024 * 1024;

    setLoading(true);
    let uploadedObjs: any[] = [];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: "error",
          title: "Invalid file type",
          text: "Please upload only image files (JPEG, PNG, GIF, WebP, SVG)",
        });
        continue;
      }
      if (file.size > maxSize) {
        Swal.fire({
          icon: "error",
          title: "File too large",
          text: "Please upload an image smaller than 5MB",
        });
        continue;
      }
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      try {
        const res = await fetch("/api/cloudinary/upload-image", {
          method: "POST",
          body: uploadFormData,
        });
        const data = await res.json();
        if (data.success && data.url) {
          uploadedObjs.push({ url: data.url });
        }
      } catch {}
    }
    setLoading(false);

    if (uploadedObjs.length > 0) {
      // Update images array and backend
      const newImages = [...images, ...uploadedObjs];
      setImages(newImages);
      try {
        await axios.post("/api/admin/banner-images", { images: newImages });
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: `Uploaded ${uploadedObjs.length} image(s)`,
          showConfirmButton: false,
          timer: 2000,
        });
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to update images",
          text: "Could not update images on server.",
        });
      }
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/banner-images");
      setImages(res.data.data?.images || []);
    } catch (err) {
      setError("Failed to fetch banner images");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchImages();
    // Fetch active categories
    (async () => {
      try {
        const res = await axios.get(dropdownCategoriesPath);
        setCategories(res.data.data || []);
      } catch {
        setCategories([]);
      }
    })();
  }, []);

  // Optionally, you can update handleUpdate to accept JSON input for advanced editing
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    let parsed: any[] = [];
    try {
      parsed = JSON.parse(inputImages);
      if (!Array.isArray(parsed)) throw new Error();
    } catch {
      setError("Input must be a valid JSON array of objects");
      setLoading(false);
      return;
    }
    try {
      const res = await axios.post("/api/admin/banner-images", {
        images: parsed,
      });
      setImages(res.data.data?.images || []);
      setSuccess("Banner images updated successfully");
      setInputImages("");
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Banner images updated",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.response?.data?.error;
      setError(apiMsg || "Error updating banner images");
      Swal.fire({
        icon: "error",
        title: "Failed to update images",
        text: apiMsg || "Unknown error",
      });
    }
    setLoading(false);
  };

  const handleDeleteImage = async (imageObj: any) => {
    const result = await Swal.fire({
      title: "Delete Image?",
      text: "Are you sure you want to delete this image?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    setLoading(true);
    try {
      // Delete from Cloudinary
      const resCloud = await fetch("/api/cloudinary/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imageObj.url }),
      });
      const dataCloud = await resCloud.json();
      if (!dataCloud.success) {
        Swal.fire({
          icon: "error",
          title: "Failed to delete image from Cloudinary",
          text: dataCloud.error || "Unknown error",
        });
        setLoading(false);
        return;
      }
      // Remove from images array and update backend
      const newImages = images.filter((img) => img.url !== imageObj.url);
      setImages(newImages);
      await axios.post("/api/admin/banner-images", { images: newImages });
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Image deleted",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to delete image",
        text: "Network error",
      });
    }
    setLoading(false);
  };

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        showBack={false}
        title="Banner Images"
        subtitle="Manage homepage banner images"
        addLabel="Add"
        addShow={true}
        handleAdd={() => setModal({ open: true, editIdx: null })}
      />

      <BannerImageModal
        open={modal.open}
        initial={
          modal.editIdx !== null
            ? { ...images[modal.editIdx], _edit: true }
            : { url: "", alt: "", isActive: true }
        }
        categories={categories}
        loading={loading}
        onClose={() => setModal({ open: false, editIdx: null })}
        onSave={async (img) => {
          setLoading(true);
          if (modal.editIdx !== null) {
            // Edit
            const updated = images.map((i, idx) =>
              idx === modal.editIdx ? { ...img } : i
            );
            setImages(updated);
            await axios.post("/api/admin/banner-images", { images: updated });
          } else {
            // Add
            const updated = [...images, img];
            setImages(updated);
            await axios.post("/api/admin/banner-images", { images: updated });
          }
          setModal({ open: false, editIdx: null });
          setLoading(false);
        }}
      />

      <div className="mt-8">
        <CustomTable
          columns={[
            {
              id: "image",
              label: "Image",
              minWidth: 100,
              selector: (row: any) => (
                <CustomTooltip title={row.alt || "Banner image"}>
                  <span>
                    <CustomImage
                      coverImage={row.url}
                      images={[row.url]}
                      alt={row.alt || "Banner"}
                      style={{
                        height: 48,
                        width: 120,
                        objectFit: "cover",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    />
                  </span>
                </CustomTooltip>
              ),
            },
            // {
            //   id: "alt",
            //   label: "Alt Text",
            //   minWidth: 120,
            //   selector: (row: any) => (
            //     <CustomTooltip title={row.alt || "-"}>
            //       <span
            //         style={{
            //           display: "inline-block",
            //           width: 140,
            //           overflow: "hidden",
            //           textOverflow: "ellipsis",
            //           whiteSpace: "nowrap",
            //         }}
            //       >
            //         {row.alt || "-"}
            //       </span>
            //     </CustomTooltip>
            //   ),
            // },

            {
              id: "targetId",
              label: "Category",
              minWidth: 120,
              selector: (row: any) => {
                const cat = categories.find((c) => c._id === row.targetId);
                return (
                  <CustomTooltip title={cat ? cat.name : "-"}>
                    <span
                      style={{
                        display: "inline-block",
                        width: 120,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cat ? cat.name : "-"}
                    </span>
                  </CustomTooltip>
                );
              },
            },
            {
              id: "isActive",
              label: "Status",
              minWidth: 80,
              selector: (row: any) => (
                <button
                  onClick={() => {
                    showConfirmStatusAlert({
                      isActive: !!row.isActive,
                      title: row.isActive
                        ? "Deactivate Status?"
                        : "Activate Status?",
                      text: row.isActive
                        ? "Are you sure you want to deactivate this banner?"
                        : "Are you sure you want to activate this banner?",
                      confirmText: row.isActive ? "Deactivate" : "Activate",
                      cancelText: "Cancel",
                      onConfirm: async () => {
                        const idx = images.findIndex(
                          (img) => img.url === row.url
                        );
                        if (idx === -1) return;
                        const updated = images.map((img, i) =>
                          i === idx ? { ...img, isActive: !img.isActive } : img
                        );
                        setImages(updated);
                        setLoading(true);
                        try {
                          await axios.post("/api/admin/banner-images", {
                            images: updated,
                          });
                        } catch {}
                        setLoading(false);
                      },
                    });
                  }}
                  className="relative cursor-pointer inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  style={{
                    backgroundColor: row.isActive ? "#10b981" : "#d1d5db",
                  }}
                  title={
                    row.isActive ? "Click to deactivate" : "Click to activate"
                  }
                >
                  <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                      row.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              ),
            },
            {
              id: "actions",
              label: "Edit",
              minWidth: 100,
              selector: (row: any) => (
                <div className="flex gap-2">
                  <span
                    style={{
                      cursor: "pointer",
                      color: "var(--primary)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    onClick={() => {
                      const idx = images.findIndex(
                        (img) => img.url === row.url
                      );
                      setModal({ open: true, editIdx: idx });
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </span>
                </div>
              ),
            },
          ]}
          data={images}
          page={0}
          rowsPerPage={10}
          totalCount={images.length}
          onPageChange={() => {}}
          loading={loading}
        />
      </div>
    </div>
  );
}
