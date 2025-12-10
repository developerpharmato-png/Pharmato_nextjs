"use client";
import React, { useEffect, useState } from "react";
import { CustomTable, Column } from "../components/CustomTable";
import { CustomTooltip, CustomImage } from "../components/miniComponents";
import { showConfirmStatusAlert } from "../components/ConfirmStatusAlert";
import axios from "axios";
import Avatar from "@mui/material/Avatar";
import { useRouter } from "next/navigation";
import { EditIcon } from "lucide-react";
import { GetServerSideProps } from "next";

type Props = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  categoryId?: string | null;
  subCategoryId?: string | null;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { query } = context;
  const params = new URLSearchParams();
  params.set("limit", "10"); // Default rows per page
  params.set("offset", "0"); // Default page
  if (query.searchValue) params.set("search", String(query.searchValue));
  if (query.categoryId) params.set("categoryId", String(query.categoryId));
  if (query.subCategoryId) params.set("subCategoryId", String(query.subCategoryId));

  const response = await fetch(`${process.env.API_BASE_URL}/api/medicines?${params.toString()}`);
  const data = await response.json();

  return {
    props: {
      initialData: data.data || [],
      initialTotalCount: data.total || 0,
    },  
  };
};

const MedicinesTable: React.FC<Props & { initialData: any[]; initialTotalCount: number }> = ({
  searchValue,
  onSearchChange,
  categoryId,
  subCategoryId,
  initialData,
  initialTotalCount,
}) => {
  const [data, setData] = useState<any[]>(initialData || []);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
console.log(searchValue,"searchValue");

  useEffect(() => {
   
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", String(rowsPerPage));
    params.set("offset", String(page * rowsPerPage));
    if (searchValue && searchValue.trim() !== "") {
        params.set("search", String(searchValue));
    }
    if (categoryId) params.set("categoryId", String(categoryId));
    if (subCategoryId) params.set("subCategoryId", String(subCategoryId));

    console.log("Fetching with params:", params.toString());

    fetch(`/api/medicines?${params.toString()}`)
      .then((res) => res.json())
      .then((res) => {
        setData(res.data || []);
        setTotalCount(res.total || 0);
      })
      .catch((error) => {
        console.error("Error fetching medicines:", error);
      })
      .finally(() => setLoading(false));
  }, [page, rowsPerPage, searchValue, categoryId, subCategoryId]);

  const fetchMedicines = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('limit', String(rowsPerPage));
    params.set('offset', String(page * rowsPerPage));
    if (searchValue) params.set('search', String(searchValue));
    if (categoryId) params.set('categoryId', String(categoryId));
    if (subCategoryId) params.set('subCategoryId', String(subCategoryId));
    fetch(`/api/medicines?${params.toString()}`)
      .then((res) => res.json())
      .then((res) => {
        setData(res.data || []);
        setTotalCount(res.total || 0);
      })
      .finally(() => setLoading(false));
  };

  const handleToggleStatus = async (row: any) => {
    showConfirmStatusAlert({
      isActive: !!row.isActive,
      title: row.isActive ? "Deactivate Medicine?" : "Activate Medicine?",
      text: row.isActive
        ? "Are you sure you want to deactivate this medicine?"
        : "Are you sure you want to activate this medicine?",
      confirmText: row.isActive ? "Deactivate" : "Activate",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          // Use dedicated status endpoint to avoid sending full row payload
          await axios.patch(`/api/medicines/status`, {
            id: row._id,
            isActive: !row.isActive,
          });
          fetchMedicines();
        } catch {
          // Optionally show error toast
        }
      },
    });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (onSearchChange) {
      onSearchChange(value);
    }

    // Call the API immediately when the search value changes
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", String(rowsPerPage));
    params.set("offset", String(page * rowsPerPage));
    if (value.trim() !== "") {
      params.set("search", value);
    }
    if (categoryId) params.set("categoryId", String(categoryId));
    if (subCategoryId) params.set("subCategoryId", String(subCategoryId));

    fetch(`/api/medicines?${params.toString()}`)
      .then((res) => res.json())
      .then((res) => {
        setData(res.data || []);
        setTotalCount(res.total || 0);
      })
      .catch((error) => {
        console.error("Error fetching medicines:", error);
      })
      .finally(() => setLoading(false));
  };

  const columns: Column<any>[] = [
      
    {
      id: "uniqueCode",
      label: "ID",
      minWidth: 120,
      selector: (row) => (
        <CustomTooltip title={row.uniqueCode || "-"}>
          <span
           className="ID-List"
            
            onClick={() => router.push(`/dashboard/medicines/${row._id}`)}
          >
            {row.uniqueCode || "-"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "coverImage",
      label: "Image",
      minWidth: 80,
      selector: (row) =>
        row.coverImage ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CustomImage
              coverImage={row.coverImage}
              images={row.images}
              alt={row.name}
              style={{
                height: 32,
                width: 32,
                objectFit: "cover",
                borderRadius: 4,
              }}
            />
          
          </div>
        ) : (
          <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
            {row.name ? row.name[0] : "?"}
          </Avatar>
        ),
    },
    {
      id: "name",
      label: "Name",
      minWidth: 120,
      selector: (row) => (
        <CustomTooltip title={row.name || "-"}>
          <span
            style={{
              display: "inline-block",
              width: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.name || "-"}
          </span>
        </CustomTooltip>
      ),
    },
  
    {
      id: "categoryId",
      label: "Category",
      minWidth: 120,
      selector: (row) => {
        const text = row.categoryId?.name || row.category || "-";
        return (
          <CustomTooltip title={text}>
            <span className={text !== "-" ? "Category" : undefined}>{text}</span>
          </CustomTooltip>
        );
      },
    },
    {
      id: "subCategoryId",
      label: "Subcategory",
      minWidth: 120,
      selector: (row) => {
        const text = row.subCategoryId?.name || "-";
        return (
          <CustomTooltip title={text}>
            <span className={text !== "-" ? "Category" : undefined}>{text}</span>
          </CustomTooltip>
        );
      },
    },
    {
      id: "manufacturer",
      label: "Manufacturer",
      minWidth: 120,
      selector: (row) => (
        <CustomTooltip title={row.manufacturer || "-"}>
          <span
            style={{
              display: "inline-block",
              width: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.manufacturer || "-"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "price",
      label: "Price",
      minWidth: 80,
      selector: (row) => (
        <CustomTooltip title={`₹${row.price}` || "-"}>
          <span
            style={{
              display: "inline-block",
              width: 80,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {`₹${row.price}` || "-"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "mrp",
      label: "MRP",
      minWidth: 80,
      selector: (row) => (
        <CustomTooltip title={`₹${row.mrp}` || "-"}>
          <span
            style={{
              display: "inline-block",
              width: 80,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {`₹${row.mrp}` || "-"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "purchasePrice",
      label: "Purchase Price",
      minWidth: 80,
      selector: (row) => (
        <CustomTooltip title={`₹${row.purchasePrice}` || "-"}>
          <span
            style={{
              display: "inline-block",
              width: 80,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {`₹${row.purchasePrice}` || "-"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "discount",
      label: "Discount (%)",
      minWidth: 80,
      selector: (row) => (
        <CustomTooltip title={row.discount?.toString() || "-"}>
          <span
            style={{
              display: "inline-block",
              width: 80,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.discount?.toString() || "-"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "stock",
      label: "Stock",
      minWidth: 80,
      selector: (row) => (
        <CustomTooltip title={row.stock?.toString() || "-"}>
          <span
            style={{
              display: "inline-block",
              width: 80,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.stock?.toString() || "-"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "expiryDate",
      label: "Expiry Date",
      minWidth: 120,
      selector: (row) => (
        <CustomTooltip title={row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : "-"}>
          <span
            style={{
              display: "inline-block",
              width: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : "-"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "batchNumber",
      label: "Batch Number",
      minWidth: 120,
      selector: (row) => (
        <CustomTooltip title={row.batchNumber || "-"}>
          <span
            style={{
              display: "inline-block",
              width: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.batchNumber || "-"}
          </span>
        </CustomTooltip>
      ),
    },
  
   
  
     {
          id: "isActive",
          label: "Status",
          minWidth: 80,
          selector: (row) => (
            <button
              onClick={() => handleToggleStatus(row)}
              className="relative cursor-pointer inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              style={{ backgroundColor: row.isActive ? "#10b981" : "#d1d5db" }}
              title={row.isActive ? "Click to deactivate" : "Click to activate"}
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
      minWidth: 60,
      selector: (row) => (
        <span
          style={{ cursor: "pointer", color: "var(--primary)", display: "flex", justifyContent: "center", alignItems: "center" }}
          onClick={() => router.push(`/dashboard/medicines/${row._id}/edit`)}
        >
          <EditIcon fontSize="small" />
        </span>
      ),
    },
  ];

  return (
    <>
     
      <CustomTable
        columns={columns}
        data={data}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        loading={loading}
      />
    </>
  );
};

export default MedicinesTable;
