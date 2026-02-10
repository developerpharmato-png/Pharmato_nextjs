"use client";
import React, { useState, useEffect } from "react";
import { CustomTable, Column } from "../components/CustomTable";
import { CustomImage, CustomTooltip } from "../components/miniComponents";
import Link from "next/link";
import Swal from "sweetalert2";
import { ToastMessages } from "@/utils/ToasterMessage";
import { showConfirmStatusAlert } from "../components/ConfirmStatusAlert";
import FilterSearch from "../components/FilterSearch";
import HeaderWithAction from "../components/HeaderWithAction";
import { useRouter } from "next/navigation";
import { EditIcon } from "lucide-react";
// ...existing code...

export default function SubCategoriesPage() {
  const router = useRouter();

  const handleAdd = () => {
    router.push("/dashboard/subcategories/AddEdit");
  };
  const [adminPermissions, setAdminPermissions] = useState<any>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem("adminPermissions");
      if (p) setAdminPermissions(JSON.parse(p));
    } catch (e) {
      // ignore
    }
  }, []);

  const canEditSubcategories = adminPermissions?.Subcategories?.edit ?? true;

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Subcategories"
        subtitle="Manage medicine subcategories and OTC classification"
        showBack={false}
        showSearch={false}
        addLabel="Add "
        addShow={canEditSubcategories}
        handleAdd={handleAdd}
      />

      <SubCategoriesTable canEdit={canEditSubcategories} />
    </div>
  );
}

function SubCategoriesTable({ canEdit }: { canEdit?: boolean }) {
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterOTC, setFilterOTC] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingSubcategory, setPendingSubcategory] = useState<{
    id: string;
    isActive: boolean;
  } | null>(null);
  const [filterSubcategory, setFilterSubcategory] = useState<string | null>(
    null
  );
  const router = useRouter();

  React.useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, searchTerm, filterCategory, filterOTC]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const body: any = {
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      };
      if (searchTerm) {
        body.search = searchTerm;
      }
      if (filterCategory && filterCategory !== "all") {
        body.categoryId = filterCategory;
      }
      if (filterOTC && filterOTC !== "all") {
        body.isOTC = filterOTC === "true";
      }

      const subRes = await fetch("/api/admin/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const subData = await subRes.json();
      setSubcategories(subData.data || []);
      setTotalCount(subData.total || 0);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = (id: string, isActive: boolean) => {
    showConfirmStatusAlert({
      isActive,
      title: isActive ? "Deactivate  Subcategory?" : "Activate Subcategory?",
      text: isActive
        ? "Are you sure you want to Deactivate  this subcategory?"
        : "Are you sure you want to activate this subcategory?",
      confirmText: isActive ? "Deactivate " : "Activate",
      cancelText: "Cancel",
      onConfirm: () => confirmToggleStatusDirect(id, isActive),
    });
  };

  // Direct status toggle for SweetAlert2
  const confirmToggleStatusDirect = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/subcategories/${id}/toggle-status`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.success) {
        fetchData(); // Refresh data from server
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: isActive
            ? ToastMessages.SUBCATEGORY_DEACTIVATED
            : ToastMessages.SUBCATEGORY_ACTIVATED,
          showConfirmButton: false,
          timer: 2000,
        });
      } else {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: ToastMessages.SUBCATEGORY_STATUS_UPDATE_FAILED,
          text: data.error || "Failed to toggle subcategory status",
          showConfirmButton: false,
          timer: 2000,
        });
      }
    } catch (error) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: ToastMessages.SUBCATEGORY_STATUS_UPDATE_FAILED,
        text: "Network error",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  // Table columns
  const baseColumns: Column<any>[] = [
    {
      id: "uniqueCode",
      label: "Id",
      selector: (row) => (
        <CustomTooltip title={row.uniqueCode || "—"}
          onClick={() => router.push(`/dashboard/subcategories/AddEdit/${row._id}`)}
        >
          <span className="ID-List">{row.uniqueCode || "—"}</span>
        </CustomTooltip>
      ),
    },
    {
      id: "image",
      label: "Image",
      selector: (row) => (
        <CustomTooltip title={row.name || "Image"}>
          {Array.isArray(row.images) && row.images[0] ? (
            <div className=" h-[50px] w-[50px]">
            <CustomImage
              coverImage={row.images[0]}
              images={row.images}
              alt="Subcategory"
              style={{ width: 32, height: 32, borderRadius: 6 }}
            />
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </CustomTooltip>
      ),
    },
    {
      id: "name",
      label: "Name",
      selector: (row) => (
        <CustomTooltip title={row.name || "-"}>
          <span
            style={{
              maxWidth: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.name}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "description",
      label: "Description",
      selector: (row) => (
        <CustomTooltip title={row.description || "-"}>
          <span
            className="text-gray-600"
            style={{
              maxWidth: 180,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.description}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "category",
      label: "Category",
      selector: (row) => (
        <CustomTooltip title={row.categoryId?.name || "N/A"}>
          <span className="Category">{row.categoryId?.name || "N/A"}</span>
        </CustomTooltip>
      ),
    },
    {
      id: "isOTC",
      label: "OTC",
      selector: (row) => (
        <CustomTooltip title={row.isOTC ? "Yes" : "No"}>
          {row.isOTC ? (
            <span className="OTCYes">Yes</span>
          ) : (
            <span className="OTCNo">No</span>
          )}
        </CustomTooltip>
      ),
    },
  ];

  const columns: Column<any>[] = [...baseColumns];

  if (canEdit) {
    columns.push({
      id: "isActive",
      label: "Status",
      selector: (row) => (
        <CustomTooltip title={row.isActive ? "Active" : "Inactive"}>
          <button
            onClick={() => handleToggleStatus(row._id, row.isActive)}
            className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            style={{ backgroundColor: row.isActive ? "#10b981" : "#d1d5db" }}
            title={row.isActive ? "Click to deactivate" : "Click to activate"}
          >
            <span
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${row.isActive ? "translate-x-6" : "translate-x-1"
                }`}
            />
          </button>
        </CustomTooltip>
      ),
    });

    columns.push({
      id: "actions",
      label: "Actions",
      selector: (row) => (
        <CustomTooltip title="Edit">
          <span
            style={{
              cursor: "pointer",
              color: "var(--primary)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            onClick={() =>
              router.push(`/dashboard/subcategories/AddEdit/${row._id}`)
            }
          >
            <EditIcon fontSize="small" />
          </span>
        </CustomTooltip>
      ),
    });
  }

  return (
    <div>
      <FilterSearch
        subcategories={subcategories}
        onChange={(f) => {
          setSearchTerm(f.search || "");
          setFilterCategory(f.categoryId || "all");
          setFilterSubcategory(f.subCategoryId || null);
          setPage(0); // Reset to first page on filter change
        }}
        placeholder="Search subcategories..."
        isSearchShow={true}
        isShowCategory={true}
        isShowSub={false}
      />

      <CustomTable
        columns={columns}
        data={subcategories}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        loading={loading}
      />
    </div>
  );
}
