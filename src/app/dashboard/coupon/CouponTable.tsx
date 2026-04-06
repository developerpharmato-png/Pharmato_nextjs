"use client";

import { CustomTable, Column } from "../components/CustomTable";
import { useRouter } from "next/navigation";
import {
    CustomTooltip,
    StatusToggleButton,
    ConfirmStatusAlertComponent,
} from "../components/miniComponents";
import { formatMargDate } from "@/utils/function";
import { useEffect, useState } from "react";
import { CouponStatusPath } from "../storeAPICall/API/BaseApi";
import Swal from "sweetalert2";
import axios from "axios";
import moment from 'moment-timezone';
import { Edit3Icon, EditIcon } from "lucide-react";
import { CouponUpdateStore } from "../storeAPICall/useUserStore";

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
    uniqueCode: string;
    totalUses?: number;

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
    const {
        postData: ActiveInactive,
        data: ActiveInactivedata,
        clearData: ActiveInactiveDAta,
    } = CouponUpdateStore();

    console.log(ActiveInactivedata, "ActiveInactivedata")
    const handleToggleStatus = async (coupon: Coupon) => {
        try {
            setTogglingId(coupon._id);
            const payload = {
                id: coupon._id,
                isActive: !coupon.isActive,
            };

            ActiveInactive(CouponStatusPath, payload);
        } catch (err) {
        } finally {
            setTogglingId(null);
        }
    };
    useEffect(() => {
        if (ActiveInactivedata?.success) {
            // 1. Show Success Message
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: ActiveInactivedata?.message || "Status updated",
                showConfirmButton: false,
                timer: 2000,
            });
            // 2. Refresh the list (This changes the value in the UI)
            if (onStatusChange) {
                onStatusChange();
            }
            // 3. Cleanup
            setTogglingId(null);
            ActiveInactiveDAta();
        } else if (ActiveInactivedata?.success === false) {
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title: ActiveInactivedata?.message || "Failed to update",
                showConfirmButton: false,
                timer: 2000,
            });
            setTogglingId(null);
            ActiveInactiveDAta();
        }
    }, [ActiveInactivedata]);

    const formatToIndianDate = (dateString: string) => {
        if (!dateString) return "N/A";

        const m = moment(dateString, "DD:MM:YY HH:mm", true);
        const date = (m.isValid() ? m : moment(dateString))
            .format('DD MMM YYYY');
        return date;
    };

    const formatToIndianTime = (dateString: string) => {
        if (!dateString) return "";

        const m = moment(dateString, "DD:MM:YY HH:mm", true);
        const date = (m.isValid() ? m : moment(dateString))
            .format('HH:mm');
        return date;
    };

    const columns: Column<Coupon>[] = [
        {
            id: "ID",
            label: "ID",
            minWidth: 80,
            selector: (row) => (
                <CustomTooltip title={row.uniqueCode}>
                    <span
                        className="ID-List text-blue-600 cursor-pointer underline"
                        onClick={() => router.push(`/dashboard/coupon/detail?id=${row._id}`)}
                    >
                        {row.uniqueCode}
                    </span>
                </CustomTooltip>
            ),
        },
        {
            id: "code",
            label: "Code",
            minWidth: 120,
            selector: (row) => (
                <span >{row.code}</span>
            ),
        },
        {
            id: "title",
            label: "Title",
            minWidth: 180,
            selector: (row) => (
                <CustomTooltip title={row.title || row.description}>
                    <span className="line-clamp-1 text-sm">{row.title || row.description}</span>
                </CustomTooltip>
            ),
        },
        {
            id: "value",
            label: "Discount",
            minWidth: 100,
            selector: (row) => (
                <span className="font-medium text-gray-900">
                    {row.type === "percentage" ? `${row.value}%` : `₹${row.value}`}
                </span>
            ),
        },
        {
            id: "usage",
            label: "Usage (Used/Total)",
            minWidth: 140,
            selector: (row) => {
                const used = row.usedCount || 0;
                const totalUses = typeof row.totalUses === 'number' ? row.totalUses : undefined;
                const total = totalUses ?? "∞";
                const isFull = typeof totalUses === 'number' && totalUses > 0 && used >= totalUses;

                return (
                    <div className="flex flex-col">
                        <span className={`font-semibold ${isFull ? 'text-red-600' : 'text-green-700'}`}>
                            {used} / {total}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                            {isFull ? "Limit Reached" : "Total Uses"}
                        </span>
                    </div>
                );
            },
        },
        {
            id: "perUserLimit",
            label: "Per User",
            minWidth: 90,
            selector: (row) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.perUserLimit || "∞"}</span>
                    <span className="text-[10px] text-gray-400 uppercase">Limit</span>
                </div>
            ),
        },
        {
            id: "startAt",
            label: "Starts",
            minWidth: 120,
            selector: (row) => (
                <div className="flex flex-col">
                    <span className="text-sm">{formatToIndianDate(row.startAt)}</span>
                    <span className="text-[10px] text-gray-500 font-mono uppercase">
                        {formatToIndianTime(row.startAt)}
                    </span>
                </div>
            ),
        },
        {
            id: "endAt",
            label: "Expires",
            minWidth: 120,
            selector: (row) => (
                <div className="flex flex-col">
                    <span className="text-sm">{formatToIndianDate(row.endAt)}</span>
                    <span className="text-[10px] text-gray-500 font-mono uppercase">
                        {formatToIndianTime(row.endAt)}
                    </span>
                </div>
            ),
        },
        {
            id: "usage",
            label: "Is Exhausted?",
            minWidth: 140,
            selector: (row) => {
                const used = row.usedCount || 0;
                const totalUses = typeof row.totalUses === 'number' ? row.totalUses : undefined;
                const total = totalUses ?? "∞";
                const isFull = used == total ? true : false;

                return (
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-mono uppercase">
                            {isFull ? "Yes" : "No"}
                        </span>
                    </div>
                );
            },
        },
        {
            id: "usage",
            label: "Is Expired?",
            minWidth: 140,
            selector: (row) => {
                const nowIST = moment().tz("Asia/Kolkata").toDate();
                const endAt = moment(row.endAt).toDate();
                const isExpired = nowIST > endAt;

                return (
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-mono uppercase">
                            {isExpired ? "Yes" : "No"}
                        </span>
                    </div>
                );
            },
        },

        {
            id: "isActive",
            label: "Status",
            minWidth: 90,
            selector: (row) => (
                <ConfirmStatusAlertComponent
                    isActive={row.isActive}
                    title={row.isActive ? "Deactivate?" : "Activate?"}
                    text={`Toggle status for ${row.code}?`}
                    confirmText={row.isActive ? "Deactivate" : "Activate"}
                    cancelText="Cancel"
                    onConfirm={() => handleToggleStatus(row)}
                >
                    <StatusToggleButton
                        isActive={row.isActive}
                        onToggle={() => { }}
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
                <div className="flex justify-center">
                    <span
                        className="EditListStyle"
                        onClick={() => router.push(`/dashboard/coupon/AddEdit/${row._id}`)}
                    >
                        <EditIcon size={18} />
                    </span>
                </div>
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
