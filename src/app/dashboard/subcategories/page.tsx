"use client";
import React, { useState } from "react";
import { CustomTable, Column } from "../components/CustomTable";
import { CustomImage, CustomTooltip } from "../components/miniComponents";
import Link from "next/link";
import Swal from "sweetalert2";
import { showConfirmStatusAlert } from "../components/ConfirmStatusAlert";
import FilterSearch from "../components/FilterSearch";
import HeaderWithAction from "../components/HeaderWithAction";
import { useRouter } from "next/navigation";
import { EditIcon } from "lucide-react";
// ...existing code...

export default function SubCategoriesPage() {
  const router = useRouter();

  const handleAdd = () => {
    router.push("/dashboard/subcategories/new");
  };
  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Subcategories"
        subtitle="Manage medicine subcategories and OTC classification"
        showBack={false}
        showSearch={false}
        addLabel="Add "
        addShow={true}
        handleAdd={handleAdd}
      />

      <SubCategoriesTable />
    </div>
  );
}

function SubCategoriesTable() {
  const [subcategories, setSubcategories] = useState<any[]>([]);
  // categories are now loaded inside FilterSearch — page no longer fetches categories
  const [filteredSubcategories, setFilteredSubcategories] = useState<any[]>([]);
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
  }, []);

  React.useEffect(() => {
    let filtered = subcategories;
    if (searchTerm) {
      filtered = filtered.filter((sub) =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterCategory !== "all") {
      filtered = filtered.filter(
        (sub) => sub.categoryId?._id === filterCategory
      );
    }
    if (filterSubcategory) {
      filtered = filtered.filter((sub) => sub._id === filterSubcategory);
    }
    if (filterOTC !== "all") {
      filtered = filtered.filter((sub) => sub.isOTC === (filterOTC === "true"));
    }
    setFilteredSubcategories(filtered);
    setPage(0);
  }, [searchTerm, filterCategory, filterSubcategory, filterOTC, subcategories]);

  const fetchData = async () => {
    try {
      const subRes = await fetch("/api/subcategories");
      const subData = await subRes.json();
      setSubcategories(subData.data || []);
      setFilteredSubcategories(subData.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = (id: string, isActive: boolean) => {
    showConfirmStatusAlert({
      isActive,
      title: isActive ? "Inactivate Subcategory?" : "Activate Subcategory?",
      text: isActive
        ? "Are you sure you want to inactivate this subcategory?"
        : "Are you sure you want to activate this subcategory?",
      confirmText: isActive ? "Inactivate" : "Activate",
      cancelText: "Cancel",
      onConfirm: () => confirmToggleStatusDirect(id, isActive),
    });
  };

  // Direct status toggle for SweetAlert2
  const confirmToggleStatusDirect = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/subcategories/${id}/toggle-status`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.success) {
        setSubcategories((prev) =>
          prev.map((sub) =>
            sub._id === id ? { ...sub, isActive: !sub.isActive } : sub
          )
        );
        setFilteredSubcategories((prev) =>
          prev.map((sub) =>
            sub._id === id ? { ...sub, isActive: !sub.isActive } : sub
          )
        );
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Status updated",
          showConfirmButton: false,
          timer: 2000,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to toggle status",
          text: data.error || "Failed to toggle subcategory status",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to toggle status",
        text: "Network error",
      });
    }
  };

  // Table columns
  const columns: Column<any>[] = [
    {
      id: "uniqueCode",
      label: "Id",
      selector: (row) => (
        <CustomTooltip title={row.uniqueCode || "—"}>
          <span className="ID-List">{row.uniqueCode || "—"}</span>
        </CustomTooltip>
      ),
    },
    {
      id: "name",
      label: "Name",
      selector: (row) => (
        <CustomTooltip title={row.name || "-"}>
          <div className="flex items-center gap-2">
            {Array.isArray(row.images) && row.images[0] ? (
              <CustomImage
                coverImage={row.images[0]}
                images={row.images}
                alt="Subcategory"
                style={{ width: 32, height: 32, borderRadius: 6 }}
              />
            ) : null}
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
          </div>
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
    {
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
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                row.isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </CustomTooltip>
      ),
    },
    {
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
              router.push(`/dashboard/subcategories/edit/${row._id}`)
            }
          >
            <EditIcon fontSize="small" />
          </span>
        </CustomTooltip>
      ),
    },
  ];

  // Pagination
  const paginatedData = filteredSubcategories.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <div>
      <FilterSearch
        subcategories={subcategories}
        onChange={(f) => {
          setSearchTerm(f.search || "");
          setFilterCategory(f.categoryId || "all");
          setFilterSubcategory(f.subCategoryId || null);
        }}
        placeholder="Search subcategories..."
        isSearchShow={true}
        isShowCategory={true}
        isShowSub={false}
      />

      <CustomTable
        columns={columns}
        data={paginatedData}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={filteredSubcategories.length}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        loading={loading}
      />
    </div>
  );
}
