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


export default function CouponDetailPage() {
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
                        <Card elevation={2}>
                            <CardContent>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary">ID</Typography>
                                    <Typography variant="body1" fontWeight={600}>{coupon._id}</Typography>
                                    <Typography variant="subtitle2" color="text.secondary">Code</Typography>
                                    <Typography variant="body1">{coupon.code}</Typography>
                                    <Typography variant="subtitle2" color="text.secondary">Title</Typography>
                                    <Typography variant="body1">{coupon.title || "-"}</Typography>
                                    <Typography variant="subtitle2" color="text.secondary">Discount</Typography>
                                    <Typography variant="body1">
                                        {coupon.type === "percentage"
                                            ? `${coupon.value ?? "-"}%`
                                            : coupon.value !== undefined
                                                ? `₹${coupon.value}`
                                                : "-"}
                                    </Typography>
                                    <Typography variant="subtitle2" color="text.secondary">Usage</Typography>
                                    <Typography variant="body1">
                                        {coupon.usedCount ?? 0} / {coupon.totalUses ?? "∞"}
                                    </Typography>
                                    <Typography variant="subtitle2" color="text.secondary">Per User Limit</Typography>
                                    <Typography variant="body1">{coupon.perUserLimit ?? "∞"}</Typography>
                                    <Typography variant="subtitle2" color="text.secondary">Start Date</Typography>
                                    <Typography variant="body1">{coupon.startAt ? new Date(coupon.startAt).toLocaleString() : "-"}</Typography>
                                    <Typography variant="subtitle2" color="text.secondary">End Date</Typography>
                                    <Typography variant="body1">{coupon.endAt ? new Date(coupon.endAt).toLocaleString() : "-"}</Typography>
                                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                    <Typography variant="body1">{coupon.isActive ? "Active" : "Inactive"}</Typography>
                                    <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                                    <Typography variant="body1">{coupon.description || "-"}</Typography>
                                </Box>
                            </CardContent>
                        </Card>
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
