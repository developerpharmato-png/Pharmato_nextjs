"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { ToastMessages } from "@/utils/ToasterMessage";
import HeaderWithAction from "../components/HeaderWithAction";
import CategoriesTable from "./CategoriesTable";
import { useRouter } from "next/navigation";
import FilterSearch from "../components/FilterSearch";
import { CategoriesStore } from "../storeAPICall/useUserStore";
import { CategoriesPath } from "../storeAPICall/API/BaseApi";

export default function CategoriesPage() {
  const [seeding, setSeeding] = React.useState(false);
  const [filterOTC, setFilterOTC] = useState<string>("all");
  const router = useRouter();

  const handleSeedData = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will clear all existing categories and subcategories. Continue?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, seed data",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    setSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: `Seeded ${data.data.categories} categories and ${data.data.subcategories} subcategories!`,
          showConfirmButton: false,
          timer: 2500,
        });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to seed data",
          text: data.error || "Unknown error",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to seed data",
        text: "Seed failed",
      });
    } finally {
      setSeeding(false);
    }
  };

  // Pagination and data state for CustomTable
  const [categories, setCategories] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"ASC" | "DESC">("ASC");
  const [columnName, setColumnName] = useState<string>("");
  const { postData: CategoriesPost, loading: CategoriesLoading, data: CategoriesResp } = CategoriesStore();

  useEffect(() => {
    fetchCategories();
  }, [page, rowsPerPage, filterOTC, searchTerm, sortBy, columnName]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const body: any = {
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        sortBy:"desc",
      };
      if (searchTerm) body.name = searchTerm;
      if (filterOTC !== "all") body.isOTC = filterOTC;
      if (columnName) body.columnName = columnName;
      await CategoriesPost(CategoriesPath, body);
    } catch (error) {
      setCategories([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!CategoriesResp) return;
    try {
      const success = (CategoriesResp as any).success;
      if (success) {
        setCategories((CategoriesResp as any).data || []);
        setTotalCount((CategoriesResp as any).total || ((CategoriesResp as any).data?.length || 0));
      } else {
        setCategories([]);
        setTotalCount(0);
      }
    } catch (e) {
      setCategories([]);
      setTotalCount(0);
    }
  }, [CategoriesResp]);

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}/toggle-status`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) =>
          prev.map((cat) =>
            cat._id === id ? { ...cat, isActive: !cat.isActive } : cat
          )
        );
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: isActive
            ? ToastMessages.CATEGORY_DEACTIVATED
            : ToastMessages.CATEGORY_ACTIVATED,
          showConfirmButton: false,
          timer: 2000,
        });
      } else {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: ToastMessages.CATEGORY_STATUS_UPDATE_FAILED,
          text: data.error || "Unknown error",
          showConfirmButton: false,
          timer: 2000,
        });
      }
    } catch (error) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: ToastMessages.CATEGORY_STATUS_UPDATE_FAILED,
        text: "Network error",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  const handleAdd = () => {
    router.push("/dashboard/categories/new");
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

  const canEditCategories = adminPermissions?.Categories?.edit ?? true;
  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Categories"
        subtitle="Manage medicine categories and OTC classification"
        showBack={false}
        showSearch={false}
        onSearchChange={setSearchTerm}
        addLabel="Add "
        
        addShow={canEditCategories}
        handleAdd={handleAdd}
      />

      <FilterSearch
        onChange={(f) => {
          setSearchTerm(f.search || "");
          if (f.categoryId) setCategories([{ id: f.categoryId }]);
          if (f.subCategoryId) setCategories([{ id: f.subCategoryId }]);
        }}
        placeholder="Search medicines..."
        isSearchShow={true}
        isShowCategory={false} // Corrected to true to match the expected prop
        isShowSub={false}
        isShowOTC={true}
      />

      <CategoriesTable
        data={categories}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onToggleStatus={handleToggleStatus}
        loading={loading || CategoriesLoading}
      />
    </div>
  );
}
 