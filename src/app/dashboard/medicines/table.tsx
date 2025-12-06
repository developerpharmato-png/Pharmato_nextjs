"use client";
import React, { useEffect, useState } from "react";
import { CustomTable, Column } from "../components/CustomTable";
import { CustomTooltip, CustomImage } from "../components/miniComponents";
import { showConfirmStatusAlert } from "../components/ConfirmStatusAlert";
import axios from "axios";
import Avatar from "@mui/material/Avatar";
import { useRouter } from "next/navigation";
import { EditIcon } from "lucide-react";

type Props = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
};

const MedicinesTable: React.FC<Props> = ({ searchValue, onSearchChange }) => {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/medicines?limit=${rowsPerPage}&offset=${page * rowsPerPage}&search=${encodeURIComponent(searchValue || "")}`)
      .then((res) => res.json())
      .then((res) => {
        setData(res.data || []);
        setTotalCount(res.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page, rowsPerPage, searchValue]);

  const fetchMedicines = () => {
    setLoading(true);
    fetch(`/api/medicines?limit=${rowsPerPage}&offset=${page * rowsPerPage}&search=${encodeURIComponent(searchValue || "")}`)
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
          await axios.put(`/api/medicines/${row._id}/update`, {
            ...row,
            isActive: !row.isActive,
          });
          fetchMedicines();
        } catch {
          // Optionally show error toast
        }
      },
    });
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
      selector: (row) => (
        <CustomTooltip title={row.categoryId?.name || row.category || "-"}>
          <span
           className="Category"
          >
            {row.categoryId?.name || row.category || "-"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "subCategoryId",
      label: "Subcategory",
      minWidth: 120,
      selector: (row) => (
        <CustomTooltip title={row.subCategoryId?.name || "-"}>
          <span
          className="sub-category"
          >
            {row.subCategoryId?.name || "-"}
          </span>
        </CustomTooltip>
      ),
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
