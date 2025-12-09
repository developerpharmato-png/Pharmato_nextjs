"use client";

import React, { useEffect, useState } from "react";
import { Search, Filter, X } from "lucide-react";
import axios from "axios";

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
  showStatusFilter = false, // Default to false
}: FilterSearchProps) {
  const [search, setSearch] = useState<string>(initial.search || "");
  const [filterOTC, setFilterOTC] = useState<string>("all"); // Added state for OTC filter
  const [statusFilter, setStatusFilter] = useState<string>("all"); // Added state for status filter
  const [categoryFilter, setCategoryFilter] = useState("all"); // Added state for category filter
  const [subcategoryFilter, setSubcategoryFilter] = useState("all"); // Added state for subcategory filter
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  // Debounce onChange when showApply is false
  useEffect(() => {
    if (showApply) return;
    const handle = setTimeout(() => {
      onChange?.({
        search: search || undefined,
        isOTC: filterOTC !== "all" ? filterOTC : undefined, // Include OTC filter in onChange
        status: statusFilter !== "all" ? statusFilter : undefined, // Include status filter
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined, // Include category filter
        subCategoryId: subcategoryFilter !== "all" ? subcategoryFilter : undefined, // Include subcategory filter
      });
    }, debounceMs);
    return () => clearTimeout(handle);
  }, [search, filterOTC, statusFilter, categoryFilter, subcategoryFilter, debounceMs, onChange, showApply]);

  // Fetch categories on component mount
  useEffect(() => {
    axios.get("/api/categories")
      .then((response) => {
        if (response.data.success && Array.isArray(response.data.data)) {
          setCategories(response.data.data);
        } else {
          console.error("Invalid categories response", response.data);
          setCategories([]); // Fallback to empty array
        }
      })
      .catch((error) => {
        console.error("Failed to fetch categories", error);
        setCategories([]); // Fallback to empty array
      });
  }, []);

  // Fetch subcategories directly on component mount
  useEffect(() => {
    axios.get("/api/subcategories")
      .then((response) => {
        if (response.data.success && Array.isArray(response.data.data)) {
          setSubcategories(response.data.data);
        } else {
          console.error("Invalid subcategories response", response.data);
          setSubcategories([]); // Fallback to empty array
        }
      })
      .catch((error) => {
        console.error("Failed to fetch subcategories", error);
        setSubcategories([]); // Fallback to empty array
      });
  }, []);

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
      subCategoryId: subcategoryFilter !== "all" ? subcategoryFilter : undefined, // Include subcategory filter in onApply
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
        gap: "16px",
        padding: "10px",

        backgroundColor: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb",
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

      {/* Category Filter Dropdown */}
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
              <option key={category.id} value={category.id} style={{ color: "#171717" }}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subcategory Filter Dropdown */}
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
              <option key={subcategory.id} value={subcategory.id} style={{ color: "#171717" }}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>
      </div>

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
        {showApply ? (
          <>
            <button
              type="button"
              onClick={handleApply}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                backgroundColor: "green",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgb(93, 172, 93)";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(0,128,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "green";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Filter size={16} />
              Apply
            </button>
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
              Reset
            </button>
          </>
        ) : (
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
