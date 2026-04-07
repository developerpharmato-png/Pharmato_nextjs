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
import { CustomButton } from "../../components/miniComponents";

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
                    <CustomButton
                            onClick={() => router.push(`/dashboard/coupon/AddEdit/${coupon._id}`)}
                        icon={<Edit />}
                        label="Edit"
                        variant="primary"
                    />
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
                    {tabIndex === 0 && coupon && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Section: Primary Info */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">Basic Information</h3>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Coupon Code</div>
                                            <div className="text-lg font-bold text-(--secondary) font-mono">{coupon.code}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Title</div>
                                            <div className="text-sm font-semibold text-gray-800">{coupon.title || "-"}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Secret Coupon</div>
                                            <div className={`text-sm font-bold ${coupon.isSecret ? "text-yellow-600" : "text-gray-600"}`}>
                                                {coupon.isSecret ? "Yes" : "No"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Discount Rules */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">Discount Rules</h3>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Discount Type </div>
                                            <div className="text-sm font-bold text-green-700 uppercase">{coupon.type === "percentage" ? "Percentage (%)" : "Flat Amount"}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Min Order Value</div>
                                            <div className="text-sm font-bold">₹{coupon.minOrderValue?.toLocaleString() || "0"}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Maximum Rs. Discount</div>
                                            <div className="text-sm font-bold">{coupon.maxDiscountAmount ? `₹${coupon.maxDiscountAmount.toLocaleString()}` : "No Limit"}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Limits & Status */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">Usage & Status</h3>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Status </div>
                                            <div className="text-sm">
                                                {(() => {
                                                    const now = new Date();
                                                    const isExpired = coupon.endAt ? new Date(coupon.endAt) < now : false;
                                                    const isExhausted = coupon.totalUses && coupon.usedCount ? coupon.usedCount >= coupon.totalUses : false;
                                                    
                                                    if (isExpired) return <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wide">Expired</span>;
                                                    if (isExhausted) return <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs font-bold uppercase tracking-wide">Exhausted</span>;
                                                    return <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${coupon.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                                                        {coupon.isActive ? "Active" : "Inactive"}
                                                    </span>;
                                                })()}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Total Usage Limit</div>
                                            <div className="text-sm font-bold">{coupon.totalUses || "Unlimited"}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Per User Limit</div>
                                            <div className="text-sm font-bold">{coupon.perUserLimit || "No Limit"}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Dates */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">Timeline</h3>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Start Date</div>
                                            <div className="text-sm font-medium">{coupon.startAt ? new Date(coupon.startAt).toLocaleString('en-IN') : "-"}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Expiry Date</div>
                                            <div className="text-sm font-medium text-red-600">{coupon.endAt ? new Date(coupon.endAt).toLocaleString('en-IN') : "-"}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Description/Overview */}
                            <div className="bg-[#f0fff4] border border-green-100 rounded-xl p-6">
                                <h3 className="text-sm font-bold text-(--secondary) uppercase tracking-wider mb-2">Description</h3>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                    {coupon.description || "No description provided for this coupon."}
                                </p>
                            </div>
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
