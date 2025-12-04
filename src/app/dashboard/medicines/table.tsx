"use client";
import React, { useEffect, useState } from "react";
import { CustomTable, Column } from "../components/CustomTable";
import { CustomTooltip, CustomImage } from "../components/miniComponents";
import Avatar from "@mui/material/Avatar";
import { useRouter } from "next/navigation";
import EditIcon from "@mui/icons-material/Edit";

type Props = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
};

const MedicinesTable: React.FC<Props> = ({ searchValue, onSearchChange }) => {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/medicines?limit=${rowsPerPage}&offset=${page * rowsPerPage}&search=${encodeURIComponent(searchValue || "")}`)
      .then((res) => res.json())
      .then((res) => {
        setData(res.data || []);
        setTotalCount(res.total || 0);
      });
  }, [page, rowsPerPage, searchValue]);

  const columns: Column<any>[] = [
    {
      id: "uniqueCode",
      label: "Unique Code",
      minWidth: 120,
      selector: (row) => (
        <CustomTooltip title={row.uniqueCode || "-"}>
          <span
            style={{
              display: "inline-block",
              width: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              cursor: "pointer",
              color: "var(--primary)",
            }}
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
      id: "description",
      label: "Description",
      minWidth: 180,
      selector: (row) => (
        <CustomTooltip title={row.description || "-"}>
          <span
            style={{
              display: "inline-block",
              width: 180,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.description || "-"}
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
            style={{
              display: "inline-block",
              width: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
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
            style={{
              display: "inline-block",
              width: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
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
      id: "isOTC",
      label: "OTC",
      minWidth: 60,
      selector: (row) => (
        <CustomTooltip title={row.isOTC ? "Yes" : "No"}>
          <span
            style={{
              display: "inline-block",
              width: 60,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.isOTC ? "Yes" : "No"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "isPrescription",
      label: "Prescription",
      minWidth: 80,
      selector: (row) => (
        <CustomTooltip title={row.isPrescription ? "Yes" : "No"}>
          <span
            style={{
              display: "inline-block",
              width: 80,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.isPrescription ? "Yes" : "No"}
          </span>
        </CustomTooltip>
      ),
    },
    
    {
      id: "highlights",
      label: "Highlights",
      minWidth: 180,
      selector: (row) => (
        <CustomTooltip title={Array.isArray(row.highlights) ? row.highlights.join(", ") : "-"}>
          <span
            style={{
              display: "inline-block",
              width: 180,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {Array.isArray(row.highlights) ? row.highlights.join(", ") : "-"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "composition",
      label: "Composition",
      minWidth: 180,
      selector: (row) => (
        <CustomTooltip title={Array.isArray(row.composition) ? row.composition.map((c: any) => `${c.name}: ${c.value}`).join(", ") : "-"}
        >
          <span
            style={{
              display: "inline-block",
              width: 180,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {Array.isArray(row.composition)
              ? row.composition.map((c: any, idx: number) => (
                  <span key={idx}>
                    {c.name}: {c.value}
                    {idx < row.composition.length - 1 ? ", " : ""}
                  </span>
                ))
              : "-"}
          </span>
        </CustomTooltip>
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
      />
    </>
  );
};

export default MedicinesTable;
