"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import HeaderWithAction from "../../components/HeaderWithAction";
import { Box, Tabs, Tab, CircularProgress, Typography, Card, CardContent } from "@mui/material";
import CouponOtherTab from "./CouponOtherTab";

type Coupon = {
    _id: string;
    code: string;
    title?: string;
    description?: string;
    type?: "fixed" | "percentage";
    value?: number;
    maxDiscountAmount?: number;
    scope?: string;
    minOrderValue?: number;
    startAt?: string;
    endAt?: string;
    maxCoupons?: number;
    perUserLimit?: number;
    usedCount?: number;
    isActive?: boolean;
    isSecret?: boolean;
    isStackable?: boolean;
    createdAt?: string;
    updatedAt?: string;
    uniqueCode?: string;
    totalUses?: number;
    usersOrGuestsUsed?: Array<{
        userId: string;
        name: string | null;
        email: string | null;
        mobile: string | null;
        uses: number;
    }>;
};



import { Suspense } from "react";
import { Edit, Edit2, Edit2Icon } from "lucide-react";

function CouponDetailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const couponId = searchParams.get("id");
    const [coupon, setCoupon] = useState<Coupon | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tabIndex, setTabIndex] = useState(0);

    useEffect(() => {
        if (!couponId) {
            setError("Coupon id is required");
            setLoading(false);
            return;
        }
        fetch(`/api/admin/coupon/detail?id=${couponId}`)
            .then(async (res) => {
                const data = await res.json();
                if (data.success) {
                    setCoupon(data.data);
                } else {
                    setError(data.message || "Failed to fetch coupon");
                }
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to fetch coupon");
                setLoading(false);
            });
    }, [couponId]);

    if (loading)
        return (
            <div className="containerStyle scrollbar-hide">
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
                    <CircularProgress />
                </Box>
            </div>
        );
    if (error)
        return (
            <div className="containerStyle scrollbar-hide">
                <Box sx={{ p: 4 }}>
                    <Typography color="error" variant="h6">{error}</Typography>
                </Box>
            </div>
        );
    if (!coupon)
        return (
            <div className="containerStyle scrollbar-hide">
                <Box sx={{ p: 4 }}>
                    <Typography>No coupon found.</Typography>
                </Box>
            </div>
        );

    return (
        <div className="containerStyle scrollbar-hide">
            <HeaderWithAction
                title={coupon.code || coupon.title || "Coupon Detail"}
                subtitle={coupon.description || "View coupon details and status."}
                showBack={true}
                showSearch={false}
                rightNode={
                    <button
                        className="p-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md flex items-center gap-2 font-medium"
                        onClick={() => router.push(`/dashboard/coupon/AddEdit/${coupon._id}`)}
                    >
                        <Edit /> <span>Edit</span>
                    </button>
                }
            />
            <div className="bg-white rounded-xl p-1 grid gap-8">
                <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
                    <Tabs
                        value={tabIndex}
                        onChange={(_, v) => setTabIndex(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        aria-label="coupon details tabs"
                    >
                        <Tab label="Details" />
                        <Tab label="Coupon Usage History" />
                    </Tabs>
                </Box>
                <div className="">
                    {tabIndex === 0 && (
                        <div className="space-y-6">
                            <div className="flex flex-wrap gap-3 items-center">
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                                    <span className="material-icons text-sm">Code</span>
                                    <span>{coupon?.code}</span>
                                </span>
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                                    <span className="material-icons text-sm">Active</span>
                                    <span>: {coupon?.isActive ? "Yes" : "No"}</span>
                                </span>
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-50 text-yellow-800 rounded-full text-xs font-semibold">
                                    <span className="material-icons text-sm">Secret</span>
                                    <span>: {coupon?.isSecret ? "Yes" : "No"}</span>
                                </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 p-3 rounded-md text-center">
                                    <div className="text-xs text-gray-500">Code</div>
                                    <div className="text-lg font-bold text-green-700">{coupon.code || "-"}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md text-center">
                                    <div className="text-xs text-gray-500">Title</div>
                                    <div className="text-sm font-semibold">{coupon?.title || "-"}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md text-center">
                                    <div className="text-xs text-gray-500">Type</div>
                                    <div className="text-sm">{coupon?.type || "-"}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md text-center">
                                    <div className="text-xs text-gray-500">Value</div>
                                    <div className="text-sm">{coupon?.value || "-"}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md text-center">
                                    <div className="text-xs text-gray-500">Max Discount</div>
                                    <div className="text-sm">{coupon?.maxDiscountAmount || "-"}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md text-center">
                                    <div className="text-xs text-gray-500">Scope</div>
                                    <div className="text-sm">{coupon?.scope || "-"}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md text-center">
                                    <div className="text-xs text-gray-500">Start Date</div>
                                    <div className="text-sm">{coupon?.startAt ? new Date(coupon.startAt).toLocaleString() : "-"}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md text-center">
                                    <div className="text-xs text-gray-500">End Date</div>
                                    <div className="text-sm">{coupon?.endAt ? new Date(coupon.endAt).toLocaleString() : "-"}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md text-center">
                                    <div className="text-xs text-gray-500">Min Order Value</div>
                                    <div className="text-sm">{`₹${coupon?.minOrderValue?.toFixed(2) || "0.00"}`}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md text-center">
                                    <div className="text-xs text-gray-500">Total Uses</div>
                                    <div className="text-sm">{coupon?.totalUses || "-"}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md text-center">
                                    <div className="text-xs text-gray-500">Used Count</div>
                                    <div className="text-sm">{coupon?.usedCount || 0}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md text-center">
                                    <div className="text-xs text-gray-500">Per User Limit</div>
                                    <div className="text-sm">{coupon?.perUserLimit || "-"}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md text-center">
                                    <div className="text-xs text-gray-500">Unique Code</div>
                                    <div className="text-sm">{coupon?.uniqueCode || "-"}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md text-center">
                                    <div className="text-xs text-gray-500">Created At</div>
                                    <div className="text-sm">{coupon?.createdAt ? new Date(coupon.createdAt).toLocaleString() : "-"}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md text-center">
                                    <div className="text-xs text-gray-500">Updated At</div>
                                    <div className="text-sm">{coupon?.updatedAt ? new Date(coupon.updatedAt).toLocaleString() : "-"}</div>
                                </div>
                            </div>
                            <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                                <h2 className="text-lg font-semibold text-gray-800 inline-flex items-center gap-2">Overview</h2>
                                <div className="mt-3 text-gray-700">{coupon?.description}</div>
                            </section>
                        </div>
                    )}
                    {tabIndex === 1 && couponId && (
                        <CouponOtherTab couponId={couponId} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CouponDetailPageWrapper() {
    return (
        <Suspense fallback={<div className="containerStyle scrollbar-hide"><Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}><CircularProgress /></Box></div>}>
            <CouponDetailContent />
        </Suspense>
    );
}
