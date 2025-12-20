"use client";

import React, { useEffect, useState } from "react";
import { Search, Filter, X } from "lucide-react";
import axios from "axios";
import { CategoriesStore, SubcategoriesStore } from "../storeAPICall/useUserStore";
import { CategoriesPath, dropdownCategoriesPath, SubcategoriesPath } from "../storeAPICall/API/BaseApi";

// Define types for categories and subcategories
interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
}

interface FilterSearchProps {
  onChange?: (filters: {
    search?: string;
    categoryId?: string | null;
    subCategoryId?: string | null;
    isOTC?: string; // Added `isOTC` to the filters type
    status?: string; // Added `status` to the filters type
  }) => void;
  showApply?: boolean;
  onApply?: (filters: {
    search?: string;
    categoryId?: string | null;
    subCategoryId?: string | null;
    isOTC?: string; // Added `isOTC` to the filters type
    status?: string; // Added `status` to the filters type
  }) => void;
  debounceMs?: number;
  className?: string;
  placeholder?: string;
  initial?: {
    search?: string;
    categoryId?: string | null;
    subCategoryId?: string | null;
  };
  isSearchShow?: boolean;
  isShowOTC?: boolean; // Added `isShowOTC` to the props
  showStatusFilter?: boolean; // Added prop to control status filter visibility
  isShowCategory?: boolean; // Added prop to control category filter visibility
  isShowSub?: boolean; // Added prop to control subcategory filter visibility
  subcategories?: any[]; // Added subcategories prop
  showclearAll?: boolean;
}

export default function FilterSearch({
  onChange,
  showApply = false,
  onApply,
  debounceMs = 400,
  className = "",
  placeholder = "Search...",
  initial = {},
  isSearchShow = true,
  isShowOTC = false,
  showStatusFilter = false,
  isShowSub = false,
  isShowCategory = false,
  showclearAll = true,
}: FilterSearchProps) {
  const [search, setSearch] = useState<string>(initial.search || "");
  const [filterOTC, setFilterOTC] = useState<string>("all"); // Added state for OTC filter
  const [statusFilter, setStatusFilter] = useState<string>("all"); // Added state for status filter
  const [categoryFilter, setCategoryFilter] = useState("all"); // Added state for category filter
  const [subcategoryFilter, setSubcategoryFilter] = useState("all"); // Added state for subcategory filter
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  // Zustand stores for categories and subcategories
  const { fetchData: fetchCategories, data: categoriesData } = CategoriesStore();
  const { fetchData: fetchSubs, data: subsData } = SubcategoriesStore();

  // Debounce onChange when showApply is false
  useEffect(() => {
    if (showApply) return;
    const handle = setTimeout(() => {
      onChange?.({
        search: search || undefined,
        isOTC: filterOTC !== "all" ? filterOTC : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        subCategoryId:
          subcategoryFilter !== "all" ? subcategoryFilter : undefined,
      });
    }, debounceMs);

    return () => clearTimeout(handle); // Fixed the return type issue
  }, [
    search,
    filterOTC,
    statusFilter,
    categoryFilter,
    subcategoryFilter,
    debounceMs,
    onChange,
    showApply,
  ]);

  // Fetch categories on component mount and when OTC filter changes
  useEffect(() => {
    // fetch categories via zustand with OTC filter
    const url = filterOTC !== 'all'
      ? `${dropdownCategoriesPath}?isOTC=${filterOTC}`
      : dropdownCategoriesPath;
    fetchCategories({ url });
  }, [fetchCategories, filterOTC]);

  useEffect(() => {
    if (!categoriesData) return;
    const success = (categoriesData as any).success;
    if (success && Array.isArray((categoriesData as any).data)) {
      setCategories((categoriesData as any).data);
    } else {
      setCategories([]);
    }
  }, [categoriesData]);

  // Fetch subcategories directly on component mount
  useEffect(() => {
    // fetch subcategories via zustand; filter by selected category when applicable
    const url =
      categoryFilter !== "all"
        ? `${SubcategoriesPath}?categoryId=${encodeURIComponent(categoryFilter)}`
        : SubcategoriesPath;
    fetchSubs({ url });
  }, [fetchSubs, categoryFilter]);

  useEffect(() => {
    if (!subsData) return;
    const success = (subsData as any).success;
    if (success && Array.isArray((subsData as any).data)) {
      setSubcategories((subsData as any).data);
    } else {
      setSubcategories([]);
    }
  }, [subsData]);

  function handleReset() {
    setSearch("");
    setFilterOTC("all"); // Reset OTC filter
    setStatusFilter("all"); // Reset status filter
    setCategoryFilter("all"); // Reset category filter
    setSubcategoryFilter("all"); // Reset subcategory filter
    if (!showApply) onChange?.({});
  }

  function handleApply() {
    const filters = {
      search: search || undefined,
      isOTC: filterOTC !== "all" ? filterOTC : undefined, // Include OTC filter in onApply
      status: statusFilter !== "all" ? statusFilter : undefined, // Include status filter in onApply
      categoryId: categoryFilter !== "all" ? categoryFilter : undefined, // Include category filter in onApply
      subCategoryId:
        subcategoryFilter !== "all" ? subcategoryFilter : undefined, // Include subcategory filter in onApply
    };
    onApply ? onApply(filters) : onChange?.(filters);
  }

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "2px",
        marginBottom: "16px",
      }}
    >
      {isSearchShow && (
        <div style={{ flex: "1 1 300px", minWidth: "250px" }}>
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <Search size={20} style={{ color: "green" }} />
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              style={{
                width: "100%",
                paddingLeft: "42px",
                paddingRight: "16px",
                paddingTop: "12px",
                paddingBottom: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.2s",
                fontFamily: "inherit",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "green";
                e.target.style.boxShadow = "0 0 0 3px rgba(0,128,0,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
        </div>
      )}

      {isShowOTC && (
        <div style={{ flex: "0 1 240px", minWidth: "200px" }}>
          <div style={{ position: "relative" }}>
            <select
              id="otc-filter"
              value={filterOTC}
              onChange={(e) => setFilterOTC(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 36px 12px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "#ffffff",
                cursor: "pointer",
                appearance: "none",
                transition: "all 0.2s",
                fontFamily: "inherit",
                color: filterOTC !== "all" ? "#171717" : "#6b7280",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "green";
                e.target.style.boxShadow = "0 0 0 3px rgba(0,128,0,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="all" style={{ color: "#6b7280" }}>
                All
              </option>
              <option value="true" style={{ color: "#171717" }}>
                OTC Only
              </option>
              <option value="false" style={{ color: "#171717" }}>
                Non-OTC Only
              </option>
            </select>
            <div
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M5 7.5L10 12.5L15 7.5"
                  stroke="#6b7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {isShowCategory && (
        <div style={{ flex: "0 1 240px", minWidth: "200px" }}>
          <div style={{ position: "relative" }}>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 36px 12px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "#ffffff",
                cursor: "pointer",
                appearance: "none",
                transition: "all 0.2s",
                fontFamily: "inherit",
                color: categoryFilter !== "all" ? "#171717" : "#6b7280",
              }}
            >
              <option value="all" style={{ color: "#6b7280" }}>
                All Categories
              </option>
              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                  style={{ color: "#171717" }}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Category Filter Dropdown */}

      {isShowSub && (
        <div style={{ flex: "0 1 240px", minWidth: "200px" }}>
          <div style={{ position: "relative" }}>
            <select
              id="subcategory-filter"
              value={subcategoryFilter}
              onChange={(e) => setSubcategoryFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 36px 12px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "#ffffff",
                cursor: "pointer",
                appearance: "none",
                transition: "all 0.2s",
                fontFamily: "inherit",
                color: subcategoryFilter !== "all" ? "#171717" : "#6b7280",
              }}
            >
              <option value="all" style={{ color: "#6b7280" }}>
                All Subcategories
              </option>
              {subcategories.map((subcategory) => (
                <option
                  key={subcategory.id}
                  value={subcategory.id}
                  style={{ color: "#171717" }}
                >
                  {subcategory.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Status Filter Dropdown - Conditionally Rendered */}
      {showStatusFilter && (
        <div style={{ flex: "0 1 240px", minWidth: "200px" }}>
          <div style={{ position: "relative" }}>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 36px 12px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "#ffffff",
                cursor: "pointer",
                appearance: "none",
                transition: "all 0.2s",
                fontFamily: "inherit",
                color: statusFilter !== "all" ? "#171717" : "#6b7280",
              }}
            >
              <option value="all" style={{ color: "#6b7280" }}>
                All
              </option>
              <option value="active" style={{ color: "#171717" }}>
                Active
              </option>
              <option value="deleted" style={{ color: "#171717" }}>
                Deleted
              </option>
            </select>
            <div
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M5 7.5L10 12.5L15 7.5"
                  stroke="#6b7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
     {showclearAll && (
 <button
            type="button"
            onClick={handleReset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              backgroundColor: "#ffffff",
              color: "#171717",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgb(93, 172, 93)";
              e.currentTarget.style.backgroundColor = "rgba(0,128,0,0.04)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#d1d5db";
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <X size={16} />
            Clear
          </button>
     )}
         
       
      </div>
    </div>
  );
}
