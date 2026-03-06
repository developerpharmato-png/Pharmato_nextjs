"use client";

import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import {
  CategoriesStore,
  SubcategoriesStore,
} from "../storeAPICall/useUserStore";
import { CategoriesPath, SubcategoriesPath } from "../storeAPICall/API/BaseApi";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";

interface Category {
  id?: string;
  _id?: string;
  name: string;
}

interface Subcategory {
  id?: string;
  _id?: string;
  name: string;
}

interface FilterSearchProps {
  onChange?: (filters: any) => void;
  showApply?: boolean;
  onApply?: (filters: any) => void;
  debounceMs?: number;
  className?: string;
  placeholder?: string;
  initial?: {
    search?: string;
    categoryId?: string | null;
    subCategoryId?: string | null;
    day?: string;
  };
  isSearchShow?: boolean;
  isShowOTC?: boolean;
  showStatusFilter?: boolean;
  isShowCategory?: boolean;
  isShowSub?: boolean;
  showclearAll?: boolean;
  subcategories?: any[];
  showOrderFilters?: boolean;
  prescriptionStatus?: string;
  setPrescriptionStatus?: (val: string) => void;
  orderStatus?: string;
  setOrderStatus?: (val: string) => void;
  initialOrderStatus?: string;
  medicineFilterStatus?: string;
  setMedicineFilterStatus?: (val: string) => void;
  showMedicineFilter?: boolean;
  setPage?: (val: number) => void;
  dayFilter?: boolean;
  setDayFilter?: (val: string) => void;
  setExportStartDate?: (date: Date | null) => void;
  setExportEndDate?: (date: Date | null) => void;
  initialDayFilter?: string;
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
  showOrderFilters = false,
  prescriptionStatus = "all",
  setPrescriptionStatus,
  orderStatus = "all",
  setOrderStatus,
  medicineFilterStatus = "all",
  setMedicineFilterStatus,
  showMedicineFilter = false,
  setPage,
  dayFilter = false,
  setExportEndDate,
  setExportStartDate,
  setDayFilter,
  initialOrderStatus = "all",
  initialDayFilter = "all",
}: FilterSearchProps) {
  const [dayFilterValue, setDayFilterValue] = useState<string>(initialDayFilter);
  const [search, setSearch] = useState<string>(initial.search || "");
  const [filterOTC, setFilterOTC] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [medicineFilter, setMedicineFilter] = useState<string>(
    medicineFilterStatus || "all",
  );
  const [orderFilterValue, setOrderFilterValue] =
    useState<string>(initialOrderStatus);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const { fetchData: fetchCategories, data: categoriesData } =
    CategoriesStore();
  const { fetchData: fetchSubs, data: subsData } = SubcategoriesStore();
  console.log(categoryFilter, "categoryFilter");

  // Sync medicineFilter with medicineFilterStatus prop when it changes
  useEffect(() => {
    if (medicineFilterStatus && medicineFilterStatus !== "all") {
      setMedicineFilter(medicineFilterStatus);
    }
  }, [medicineFilterStatus]);

  // Sync orderStatus with initialOrderStatus prop when it changes
  useEffect(() => {
    if (initialOrderStatus) {
      setOrderFilterValue(initialOrderStatus);
    }
  }, [initialOrderStatus]);

  // Sync dayFilterValue with initialDayFilter prop when it changes
  useEffect(() => {
    if (initialDayFilter) {
      setDayFilterValue(initialDayFilter);
    }
  }, [initialDayFilter]);

  // --- LOGIC REMAINS UNCHANGED ---
  useEffect(() => {
    if (showApply) return;
    const handle = setTimeout(() => {
      onChange?.({
        search: search || undefined,
        isOTC: filterOTC !== "all" ? filterOTC : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        day: dayFilterValue !== "all" ? dayFilterValue : undefined,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        subCategoryId:
          subcategoryFilter !== "all" ? subcategoryFilter : undefined,
      });
    }, debounceMs);
    return () => clearTimeout(handle);
  }, [
    search,
    filterOTC,
    statusFilter,
    categoryFilter,
    subcategoryFilter,
    dayFilterValue,
    debounceMs,
    onChange,
    showApply,
  ]);

  useEffect(() => {
    const url =
      filterOTC !== "all"
        ? `${CategoriesPath}?isOTC=${filterOTC}`
        : CategoriesPath;
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

  useEffect(() => {
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
    setFilterOTC("all");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSubcategoryFilter("all");
    setDayFilterValue("all");
    setMedicineFilter("all");
    setPrescriptionStatus?.("all");
    setOrderStatus?.("all");
    setMedicineFilterStatus?.("all");
    setPage?.(0);
    setDayFilter?.("all");
    if (!showApply) onChange?.({});

    setExportStartDate?.(null);
    setExportEndDate?.(null);
  }

  // --- UI STYLING ---
  const controlStyle = {
    flex: 1,
    minWidth: 0, // Critical for flex-shrink to work
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" },
      "&.Mui-focused fieldset": { borderColor: "green" },
    },
    "& .MuiInputLabel-root": {
      fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" },
    },
    "& .MuiInputLabel-root.Mui-focused": { color: "green" },
    "& .MuiSelect-select": {
      py: 1,
    },
  };

  const searchWidth = showOrderFilters ? "18%" : "25%";

  return (
    <Box
      className={className}
      sx={{
        display: "flex",
        flexWrap: "nowrap", 
        alignItems: "center",
        gap: { xs: 0.5, sm: 1, md: 2 },
        mb: 2,
        pt: 1, 
        width: "100%",
        overflowX: "auto", 
        "&::-webkit-scrollbar": { display: "none" }, 
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}
    >
      {/* Search Input */}
      {isSearchShow && (
        <TextField
          size="small"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            ...controlStyle,
            flex: `0 0 ${searchWidth}`,
            maxWidth: searchWidth,
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} style={{ color: "green" }} />
              </InputAdornment>
            ),
          }}
        />
      )}

      {/* OTC Filter */}
      {isShowOTC && (
        <FormControl size="small" sx={controlStyle}>
          <InputLabel>OTC Status</InputLabel>
          <Select
            value={filterOTC}
            label="OTC Status"
            onChange={(e) => setFilterOTC(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="true">OTC Only</MenuItem>
            <MenuItem value="false">Non-OTC Only</MenuItem>
          </Select>
        </FormControl>
      )}

      {/* Category Filter */}
      {isShowCategory && (
        <FormControl size="small" sx={controlStyle}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage?.(0);
            }}
          >
            <MenuItem value="all">All Categories</MenuItem>
            {categories.map((cat: any) => (
              <MenuItem key={cat._id ?? cat.id} value={cat._id ?? cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Subcategory Filter */}
      {isShowSub && (
        <FormControl size="small" sx={controlStyle}>
          <InputLabel>Subcategory</InputLabel>
          <Select
            value={subcategoryFilter}
            label="Subcategory"
            onChange={(e) => setSubcategoryFilter(e.target.value)}
          >
            <MenuItem value="all">All Subcategories</MenuItem>
            {subcategories.map((sub: any) => (
              <MenuItem key={sub._id ?? sub.id} value={sub._id ?? sub.id}>
                {sub.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Prescription & Order Status (MUI group) */}
      {showOrderFilters && (
        <>
          <FormControl size="small" sx={controlStyle}>
            <InputLabel>Prescription Status</InputLabel>
            <Select
              value={prescriptionStatus}
              label="Prescription Status"
              onChange={(e) => {
                setPrescriptionStatus?.(e.target.value);
                setPage?.(0);
              }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
              <MenuItem value="Not Required">Not Required</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={controlStyle}>
            <InputLabel>Order Status</InputLabel>
            <Select
              value={orderFilterValue}
              label="Order Status"
              onChange={(e) => {
                const value = e.target.value;
                setOrderFilterValue(value);
                setOrderStatus?.(value);
                setPage?.(0);
              }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Confirmed">Confirmed</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
              <MenuItem value="Delivered">Delivered</MenuItem>
              <MenuItem value="Order Placed">Order Placed</MenuItem>
            </Select>
          </FormControl>
        </>
      )}

      {/* Medicine Filter */}
      {showMedicineFilter && (
        <FormControl size="small" sx={controlStyle}>
          <InputLabel>Medicine Filter</InputLabel>
          <Select
            value={medicineFilter}
            label="Medicine Filter"
            onChange={(e) => {
              setMedicineFilter(e.target.value);
              setMedicineFilterStatus?.(e.target.value);
              setPage?.(0);
            }}
          >
            <MenuItem value="all">All Medicines</MenuItem>
            <MenuItem value="active">Active Medicines</MenuItem>
            <MenuItem value="inactive">Inactive Medicines</MenuItem>
            <MenuItem value="expired">Expired Medicines</MenuItem>
            <MenuItem value="outofstock">Out of Stock Medicines</MenuItem>
            <MenuItem value="lowstock">Low Stock Medicines</MenuItem>
          </Select>
        </FormControl>
      )}

      {/* Day Filter */}
      {dayFilter && (
        <FormControl size="small" sx={controlStyle}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={dayFilterValue}
            label="Time Period"
            onChange={(e) => {
              setDayFilterValue(e.target.value);
              setDayFilter?.(e.target.value);
              setPage?.(0);
            }}
          >
            <MenuItem value="all">All Dates</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="last7">Last 7 Days</MenuItem>
            <MenuItem value="last30">Last 30 Days</MenuItem>
          </Select>
        </FormControl>
      )}

      {/* Status Filter */}
      {showStatusFilter && (
        <FormControl size="small" sx={controlStyle}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="deleted">Deleted</MenuItem>
          </Select>
        </FormControl>
      )}

      {/* Clear Button */}
      {showclearAll && (
        <Tooltip title="Clear Filters">
          <IconButton
            onClick={handleReset}
            size="small"
            sx={{
              color: "gray",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              height: { xs: "32px", sm: "40px" },
              width: { xs: "32px", sm: "40px" },
              flexShrink: 0,
              "&:hover": {
                borderColor: "green",
                color: "green",
                bgcolor: "#f0fff4",
              },
            }}
          >
            <X size={18} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
