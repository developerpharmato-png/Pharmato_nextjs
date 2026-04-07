"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import HeaderWithAction from "../../components/HeaderWithAction";
import { Box, Tabs, Tab, CircularProgress, Typography, Card, CardContent } from "@mui/material";

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
            />
            <div className="bg-white rounded-xl p-6 md:p-8 grid gap-8">
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
                        <Tab label="Other" />
                    </Tabs>
                </Box>
                <div className="mt-6">
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
                                    <span className="material-icons text-sm">Lock</span>
                                    <span>Secret: {coupon?.isSecret ? "Yes" : "No"}</span>
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
                    {tabIndex === 1 && (
                        <Card elevation={2}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Coupon Usage by Users/Guests
                                </Typography>
                                {coupon.usersOrGuestsUsed && coupon.usersOrGuestsUsed.length > 0 ? (
                                    <Box sx={{ overflowX: 'auto' }}>
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uses</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {coupon.usersOrGuestsUsed.map((u, idx) => (
                                                    <tr key={u.userId || idx}>
                                                        <td className="px-4 py-2 text-sm text-blue-700 font-mono">{u.userId}</td>
                                                        <td className="px-4 py-2 text-sm">{u.name || '-'}</td>
                                                        <td className="px-4 py-2 text-sm">{u.email || '-'}</td>
                                                        <td className="px-4 py-2 text-sm">
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-semibold">
                                                                {u.mobile || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2 text-sm font-bold text-gray-800">{u.uses}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No usage data found.
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
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
