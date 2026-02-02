"use client";

import { CustomTable, Column } from "../components/CustomTable";
import { useRouter } from "next/navigation";
import { CustomTooltip, StatusToggleButton, ConfirmStatusAlertComponent } from "../components/miniComponents";
import { formatMargDate } from "@/utils/function";
import { useState } from "react";
import { CouponStatusPath } from "../storeAPICall/API/BaseApi";
import Swal from "sweetalert2";
import axios from "axios";
import { Edit3Icon, EditIcon } from "lucide-react";

interface Coupon {
    _id: string;
    code: string;
    title?: string;
    description: string;
    type: "fixed" | "percentage";
    value: number;
    maxDiscountAmount?: number;
    startAt: string;
    endAt: string;
    maxCoupons: number;
    perUserLimit: number;
    usedCount?: number;
    isActive: boolean;
    isSecret: boolean;
    isStackable?: boolean;
    createdAt: string;
    updatedAt: string;
}

interface CouponTableProps {
    data: Coupon[];
    page: number;
    rowsPerPage: number;
    totalCount: number;
    onPageChange: (newPage: number) => void;
    onRowsPerPageChange: (rows: number) => void;
    loading?: boolean;
    onEdit?: (coupon: Coupon) => void;
    onDelete?: (coupon: Coupon) => void;
    onStatusChange?: () => void;
}

const CouponTable: React.FC<CouponTableProps> = ({
    data,
    page,
    rowsPerPage,
    totalCount,
    onPageChange,
    onRowsPerPageChange,
    loading,
    onEdit,
    onDelete,
    onStatusChange,
}) => {
    const router = useRouter();
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const handleToggleStatus = async (coupon: Coupon) => {
        try {
            setTogglingId(coupon._id);
            await axios.patch(CouponStatusPath, {
                id: coupon._id,
                isActive: !coupon.isActive ? 1 : 0,
            });
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: coupon.isActive ? "Coupon deactivated" : "Coupon activated",
                showConfirmButton: false,
                timer: 2000,
            });
            if (onStatusChange) {
                onStatusChange();
            }
        } catch (err) {
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title: "Failed to update coupon status",
                showConfirmButton: false,
                timer: 2000,
            });
        } finally {
            setTogglingId(null);
        }
    };

    const columns: Column<Coupon>[] = [
        {
            id: "code",
            label: "Code",
            minWidth: 100,
            selector: (row) => (
                <CustomTooltip title={row.code}>
                    <span className="cursor-pointer text-blue-600 font-semibold">
                        {row.code}
                    </span>
                </CustomTooltip>
            ),
        },
        {
            id: "title",
            label: "Title",
            minWidth: 150,
            selector: (row) => (
                <CustomTooltip title={row.title || row.description}>
                    <span className="line-clamp-1">{row.title || row.description}</span>
                </CustomTooltip>
            ),
        },
        {
            id: "value",
            label: "Discount",
            minWidth: 110,
            selector: (row) =>
                row.type === "percentage"
                    ? `${row.value}%`
                    : `₹${row.value}`,
        },
       
        {
            id: "type",
            label: "Type",
            minWidth: 90,
            selector: (row) => (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${row.type === "percentage" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                    {row.type === "percentage" ? "Percentage" : "Fixed"}
                </span>
            ),
        },
        {
            id: "maxDiscountAmount",
            label: "Max Cap",
            minWidth: 100,
            selector: (row) =>
                row.maxDiscountAmount ? `₹${row.maxDiscountAmount}` : "—",
        },
       
        {
            id: "usedCount",
            label: "Used",
            minWidth: 70,
            selector: (row) => row.usedCount || 0,
        },
        {
            id: "perUserLimit",
            label: "Per User",
            minWidth: 90,
            selector: (row) => row.perUserLimit,
        },
        {
            id: "startAt",
            label: "Start Date",
            minWidth: 100,
            selector: (row) => {
                const date = new Date(row.startAt);
                return date.toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
            },
        },
        {
            id: "endAt",
            label: "End Date",
            minWidth: 100,
            selector: (row) => {
                const date = new Date(row.endAt);
                return date.toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
            },
        },
        {
            id: "isSecret",
            label: "Secret",
            minWidth: 70,
            selector: (row) => (
                <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                        row.isSecret
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                >
                    {row.isSecret ? "Yes" : "No"}
                </span>
            ),
        },
        {
            id: "isStackable",
            label: "Stackable",
            minWidth: 80,
            selector: (row) => (
                <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                        row.isStackable
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                >
                    {row.isStackable ? "Yes" : "No"}
                </span>
            ),
        },
        {
            id: "isActive",
            label: "Status",
            minWidth: 90,
            selector: (row) => (
                <ConfirmStatusAlertComponent
                    isActive={row.isActive}
                    title={row.isActive ? "Deactivate Coupon?" : "Activate Coupon?"}
                    text={row.isActive
                        ? "Are you sure you want to deactivate this coupon?"
                        : "Are you sure you want to activate this coupon?"}
                    confirmText={row.isActive ? "Deactivate" : "Activate"}
                    cancelText="Cancel"
                    onConfirm={() => handleToggleStatus(row)}
                >
                    <StatusToggleButton
                        isActive={row.isActive}
                        onToggle={() => {}}
                        loading={togglingId === row._id}
                        disabled={togglingId !== null && togglingId !== row._id}
                    />
                </ConfirmStatusAlertComponent>
            ),
        },
        {
            id: "actions",
            label: "Edit",
            minWidth: 60,
            selector: (row) => (
                <span
                    style={{ cursor: "pointer", color: "var(--primary)", display: "flex", justifyContent: "center", alignItems: "center" }}
                    onClick={() => router.push(`/dashboard/coupon/AddEdit/${row._id}`)}
                >
                    <EditIcon size={18} />
                </span>
            ),
        },
    ];

    return (
        <CustomTable
            columns={columns}
            data={data}
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
            loading={loading}
        />
    );
};

export default CouponTable;
