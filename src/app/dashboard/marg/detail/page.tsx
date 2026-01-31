"use client";

import React, { useEffect, useMemo, useState } from "react";
import HeaderWithAction from "../../components/HeaderWithAction";
import { CustomTable, Column } from "../../components/CustomTable";
import { CustomTooltip, CustomImage } from "../../components/miniComponents";
import { formatMargDate } from "@/utils/function";

interface MargInsertedProduct {
    _id?: string;
    uniqueCode?: string;
    uniqueIdentity?: string;
    name?: string;
    manufacturer?: string;
    price?: number;
    purchasePrice?: number;
    mrp?: number;
    stock?: number;
    expiryDate?: string;
    batchNumber?: string;
    coverImage?: string;
    images?: string[];
}

interface MargDetailData {
    _id: string;
    margInsertDataCount: number;
    margInsertData?: MargInsertedProduct[];
    status?: string;
    type?: string;
    createdAt?: string;
}

const formatExpiry = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const productColumns: Column<MargInsertedProduct>[] = [
    {
        id: "uniqueCode",
        label: "Unique Code",
        minWidth: 120,
        selector: (row) => (
            <CustomTooltip title={row.uniqueCode || row.uniqueIdentity || "-"}>
                <span className="ID-List">{row.uniqueCode || row.uniqueIdentity || "-"}</span>
            </CustomTooltip>
        ),
    },
    {
        id: "name",
        label: "Name",
        minWidth: 160,
        selector: (row) => (
            <CustomTooltip title={row.name || "-"}>
                <span className="block truncate" style={{ maxWidth: 160 }}>
                    {row.name || "-"}
                </span>
            </CustomTooltip>
        ),
    },
    {
        id: "manufacturer",
        label: "Manufacturer",
        minWidth: 140,
        selector: (row) => (
            <CustomTooltip title={row.manufacturer || "-"}>
                <span className="block truncate" style={{ maxWidth: 140 }}>
                    {row.manufacturer || "-"}
                </span>
            </CustomTooltip>
        ),
    },
    {
        id: "coverImage",
        label: "Image",
        minWidth: 90,
        selector: (row) =>
            row.coverImage ? (
                <CustomImage
                    coverImage={row.coverImage}
                    images={row.images}
                    alt={row.name || "Image"}
                    style={{ height: 36, width: 36, objectFit: "cover", borderRadius: 6 }}
                />
            ) : (
                <div className="flex items-center justify-center w-9 h-9 bg-gray-100 rounded-md text-gray-400 text-xs">N/A</div>
            ),
    },
    { id: "price", label: "Price", minWidth: 100, selector: (row) => <span>{row.price !== undefined ? `₹${row.price}` : "-"}</span> },
    { id: "mrp", label: "MRP", minWidth: 100, selector: (row) => <span>{row.mrp !== undefined ? `₹${row.mrp}` : "-"}</span> },
    { id: "purchasePrice", label: "Purchase Price", minWidth: 120, selector: (row) => <span>{row.purchasePrice !== undefined ? `₹${row.purchasePrice}` : "-"}</span> },
    { id: "stock", label: "Stock", minWidth: 80, selector: (row) => <span>{row.stock !== undefined ? row.stock : "-"}</span> },
    { id: "expiryDate", label: "Expiry", minWidth: 120, selector: (row) => formatExpiry(row.expiryDate) },
    { id: "batchNumber", label: "Batch", minWidth: 120, selector: (row) => row.batchNumber || "-" },
];

const MargDetailPage = () => {
    const [detail, setDetail] = useState<MargDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        try {
            const stored = sessionStorage.getItem("margDetail");
            if (stored) {
                setDetail(JSON.parse(stored));
            }
        } catch (e) {
            setDetail(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const products = useMemo(() => {
        if (!detail || detail.margInsertDataCount === 0) return [] as MargInsertedProduct[];
        return Array.isArray(detail.margInsertData) ? detail.margInsertData : [];
    }, [detail]);

    const subtitle = detail
        ? `${detail.type || "Sync"} • Status: ${detail.status || "-"} • Created: ${formatMargDate(detail.createdAt || "")}`
        : "Open from the Marg list to view details";

    return (
        <div className="containerStyle scrollbar-hide">
            <HeaderWithAction title="Marg Inserted Product"
            isunsaved={false}
            subtitle={subtitle}
             showBack={true} 
            showSearch={false} />

            <div className="mt-6">
                <CustomTable
                    columns={productColumns}
                    data={products}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    totalCount={products.length}
                    onPageChange={setPage}
                    onRowsPerPageChange={setRowsPerPage}
                    loading={loading}
                />

            </div>
        </div>
    );
};

export default MargDetailPage;
