"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent } from "@mui/material";
import CouponUsedOrdersTable, { UsedOrder } from "./CouponUsedOrdersTable";

import { CouponOrderUsedListStore } from "../../storeAPICall/useUserStore";
import { CouponOrderUsedListPath } from "../../storeAPICall/API/BaseApi";

import FilterSearch from "../../components/FilterSearch";

interface CouponOtherTabProps {
    couponId: string;
}

export default function CouponOtherTab({ couponId }: CouponOtherTabProps) {
    const [orders, setOrders] = useState<UsedOrder[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");

    const { postData, loading, data: responseData, error: apiError } = CouponOrderUsedListStore();

    useEffect(() => {
        if (!couponId) return;

        postData(CouponOrderUsedListPath, {
            couponId: couponId,
            search: searchTerm,
            limit: rowsPerPage,
            offset: page + 1
        });
    }, [couponId, page, rowsPerPage, searchTerm]);

    useEffect(() => {
        if (responseData) {
            if (responseData.success) {
                setOrders(responseData.data || []);
                setTotalCount(responseData.totalCount || responseData.data?.length || 0);
            }
        }
    }, [responseData]);

    const displayError = apiError || (responseData && !responseData.success ? responseData.message : "");

    return (
        <div className="space-y-4">
            <FilterSearch
                onChange={(f) => {
                    setSearchTerm(f.search || "");
                    setPage(0);
                }}
                placeholder="Search orders by ID..."
                isSearchShow={true}
                isShowCategory={false}
                isShowSub={false}
                isShowOTC={false}
            />

            <CouponUsedOrdersTable
                data={orders}
                loading={loading}
                page={page}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={(newPage) => setPage(newPage)}
                onRowsPerPageChange={(rows) => setRowsPerPage(rows)}
            />
        </div>
    );
}
