"use client";

import React from "react";
import { CustomTable, Column } from "../../components/CustomTable";
import { CustomTooltip } from "../../components/miniComponents";
import { useRouter } from "next/navigation";

interface CalculationData {
    couponCode: string;
    couponId: string;
    discount: number;
    totalOrderAmount: number;
}
export interface UsedOrder {
    _id: string;
    order_id: string;
    total_order_amount: number;
    order_status: string;
    calculationData: {
        discount: number;
    };
    deliveredAddress: {
        userId: string;
        name: string;
    };
    createdAt: string;
}

interface CouponUsedOrdersTableProps {
    data: UsedOrder[];
    page: number;
    rowsPerPage: number;
    totalCount: number;
    onPageChange: (newPage: number) => void;
    onRowsPerPageChange?: (rows: number) => void;
    loading?: boolean;
}

const CouponUsedOrdersTable: React.FC<CouponUsedOrdersTableProps> = (props) => {
    const {
        data,
        page,
        rowsPerPage,
        totalCount,
        onPageChange,
        onRowsPerPageChange,
        loading = false,
    } = props;
    const router = useRouter();

    const columns: Column<UsedOrder>[] = [
        {
            id: "customer",
            label: "Customer",
            minWidth: 150,
            selector: (row: UsedOrder) => (
                <div 
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/admin/customers/${row.deliveredAddress?.userId}`)}
                >
                    <div className="font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                        {row.deliveredAddress?.name || "Unknown"}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">
                        {row.deliveredAddress?.userId || "-"}
                    </div>
                </div>
            ),
        },
        {
            id: "order_id",
            label: "Order ID",
            minWidth: 150,
            selector: (row: UsedOrder) => (
                <span
                    className="ID-List"
                    style={{ cursor: "pointer", color: "var(--primary)" }}
                    onClick={() => router.push(`/dashboard/orders/detail/${row._id}/partial-cancel`)}
                >
                    {row.order_id || "-"}
                </span>
            ),
        },
        {
            id: "total_order_amount",
            label: "Order Value",
            minWidth: 120,
            selector: (row: UsedOrder) => (
                <span className="font-medium text-gray-700">
                    ₹{row.total_order_amount?.toLocaleString() || "0.00"}
                </span>
            ),
        },
        {
            id: "discount",
            label: "Discount Applied",
            minWidth: 120,
            selector: (row: UsedOrder) => (
                <span className="text-green-600 font-semibold">
                    -₹{row.calculationData?.discount?.toLocaleString() || "0.00"}
                </span>
            ),
        },
        {
            id: "date",
            label: "Date",
            minWidth: 130,
            selector: (row: UsedOrder) => (
                <div className="text-sm text-gray-600">
                    {new Date(row.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    })}
                </div>
            ),
        },
        {
            id: "order_status",
            label: "Status",
            minWidth: 120,
            selector: (row: UsedOrder) => (
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase text-center inline-flex justify-center items-center ${getStatusClasses(row.order_status)}`}>
                    {row.order_status || "Pending"}
                </span>
            ),
        },
    ];

    function getStatusClasses(status: string) {
        switch (status?.toLowerCase()) {
            case "confirmed":
            case "delivered":
            case "success":
                return "bg-green-100 text-green-800 border border-green-200";
            case "pending":
            case "placed":
                return "bg-yellow-100 text-yellow-800 border border-yellow-200";
            case "cancelled":
            case "failed":
                return "bg-red-100 text-red-800 border border-red-200";
            default:
                return "bg-blue-100 text-blue-800 border border-blue-200";
        }
    }

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

export default CouponUsedOrdersTable;
