"use client";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { ToastMessages } from "@/utils/ToasterMessage";
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

  const [adminPermissions, setAdminPermissions] = useState<any>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem("adminPermissions");
      if (p) setAdminPermissions(JSON.parse(p));
    } catch (e) {
      // ignore
    }
  }, []);

  const canEditBanner =
    adminPermissions?.["Banner Images"]?.edit ??
    adminPermissions?.BannerImages?.edit ??
    true;



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




  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        showBack={false}
        title="Banner Management"
        subtitle="Manage promotional banners"
        addLabel="Add"
        addShow={canEditBanner}
        handleAdd={() => canEditBanner && setModal({ open: true, editIdx: null })}
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
          try {
            // Find the selected category name
            let categoryName = "";
            if (img.targetId) {
              const cat = categories.find((c) => c._id === img.targetId);
              if (cat) categoryName = cat.name;
            }
            const imgWithCategory = { ...img, categoryName };
            if (modal.editIdx !== null) {
              // Edit
              const updated = images.map((i, idx) =>
                idx === modal.editIdx ? imgWithCategory : i
              );
              setImages(updated);
              await axios.post("/api/admin/banner-images", { images: updated });
              Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: ToastMessages.BANNER_IMAGE_UPDATED,
                showConfirmButton: false,
                timer: 2000,
              });
            } else {
              // Add
              const updated = [...images, imgWithCategory];
              setImages(updated);
              await axios.post("/api/admin/banner-images", { images: updated });
              Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: ToastMessages.BANNER_IMAGE_CREATED,
                showConfirmButton: false,
                timer: 2000,
              });
            }
            setModal({ open: false, editIdx: null });
          } catch (err: any) {
            Swal.fire({
              toast: true,
              position: "top-end",
              icon: "error",
              title: modal.editIdx !== null ? ToastMessages.BANNER_IMAGE_UPDATED : ToastMessages.BANNER_IMAGE_CREATED,
              text: (err as any)?.message || "An error occurred",
              showConfirmButton: false,
              timer: 2000,
            });
          } finally {
            setLoading(false);
          }
        }}
      />

      <div className="mt-8">
        <CustomTable
          columns={(() => {
            const baseColumns = [
              {
                id: "image",
                label: "Image",
                minWidth: 100,
                selector: (row: any) => (

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

                ),
              },
            

              {
                id: "Category",
                label: "Category",
                minWidth: 120,
                selector: (row: any) => (
                  <CustomTooltip title={row.categoryName || "-"}>
                    <span
                      style={{
                        display: "inline-block",
                        width: 140,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.categoryName || "-"}
                    </span>
                  </CustomTooltip>
                ),
              },
              {
                id: "webImage",
                label: "Web Image",
                minWidth: 120,
                selector: (row: any) =>
                  row.webImage ? (
                    <img
                      src={row.webImage}
                      alt="Web Banner"
                      style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }}
                    />
                  ) : (
                    <span style={{ color: '#aaa' }}>No Image</span>
                  ),
              },

            ];

            if (canEditBanner) {
              baseColumns.push({
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
                            Swal.fire({
                              toast: true,
                              position: "top-end",
                              icon: "success",
                              title: updated[idx].isActive
                                ? ToastMessages.BANNER_IMAGE_CREATED
                                : ToastMessages.BANNER_STATUS_UPDATED,
                              showConfirmButton: false,
                              timer: 2000,
                            });
                          } catch (err) {
                            Swal.fire({
                              toast: true,
                              position: "top-end",
                              icon: "error",
                              title: ToastMessages.BANNER_STATUS_UPDATE_FAILED,
                              showConfirmButton: false,
                              timer: 2000,
                            });
                          }
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
                      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${row.isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>
                ),
              });

              baseColumns.push({
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
                        const idx = images.findIndex((img) => img.url === row.url);
                        setModal({ open: true, editIdx: idx });
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </span>
                  </div>
                ),
              });
            }

            return baseColumns;
          })()}
          data={images}
          page={0}
          rowsPerPage={10}
          totalCount={images.length}
          onPageChange={() => { }}
          loading={loading}
        />
      </div>
    </div>
  );
}
