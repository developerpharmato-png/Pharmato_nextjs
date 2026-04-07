"use client";
import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
    TextField,
    MenuItem,
    CircularProgress,
    FormControlLabel,
    Switch,
    Box,
    Button,
} from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import Swal from "sweetalert2";
import HeaderWithAction from "@/app/dashboard/components/HeaderWithAction";
import {
    CustomButton,
    ErrorMessageCom,
} from "@/app/dashboard/components/miniComponents";
import { CouponCreateStore, CouponUpdateStore, CouponSGEtBYIDsStore } from "@/app/dashboard/storeAPICall/useUserStore";
import { CouponCreatePath, CouponUpdatePath } from "@/app/dashboard/storeAPICall/API/BaseApi";
import Toast from "@/utils/Toast";
import { MdSave } from "react-icons/md";
import moment from "moment-timezone";
import { TextareaField } from "@/app/dashboard/components/skeleton/FieldCom";
import { getCouponsValidationSchema } from "@/utils/validateCategory";
import CoponSkeleton from "@/app/dashboard/components/skeleton/CoponSkeleton";

interface CouponFormValues {
    code: string;
    title: string;
    description: string;
    type: "fixed" | "percentage";
    value: number | string;
    maxDiscountAmount?: number | string;
    minOrderValue: number | string;
    scope: string;
    startAt: string;
    endAt: string;
    totalUses: number;
    perUserLimit: number;
    isStackable: boolean;
    isSecret: boolean;
    isActive: boolean;
}



const getISODateWithTimezone = (): string => {
    const now = new Date();
    const isoString = now.toISOString();
    return isoString.replace('Z', '+00:00');
};

const initialValues: CouponFormValues = {
    code: "",
    title: "",
    description: "",
    type: "fixed",
    value: "",
    maxDiscountAmount: "",
    minOrderValue: "",
    scope: "global",
    startAt: "",
    endAt: "",
    totalUses: 1,
    perUserLimit: 1,
    isStackable: false,
    isSecret: false,
    isActive: true,
};
export default function CouponAddEditPage() {
    const [codeAvailable, setCodeAvailable] = useState<null | boolean>(null);
    const [codeCheckLoading, setCodeCheckLoading] = useState(false);
    const [codeCheckMsg, setCodeCheckMsg] = useState<string>("");
    const router = useRouter();
    const params = useParams();
    const couponId = (params as any)?.id?.[0];

    const [isEdit, setIsEdit] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [fetchedInitialValues, setFetchedInitialValues] = useState<CouponFormValues>(initialValues);

    const { postData: createCoupon, data: data } = CouponCreateStore();
    const { postData: updateCoupon, data: Updatedata, clearData: ClearUpdateDAta } = CouponUpdateStore();
    const {
        fetchData: GetBYIDGet,
        loading: GetBYIDLoading,
        data: GetBYData,
        clearData: ClearBYData,
    } = CouponSGEtBYIDsStore(); console.log(Updatedata, "UpdatedataUpdatedata");

    // Fetch coupon if editing
    useEffect(() => {
        if (couponId && couponId !== "undefined") {
            setIsEdit(true);
            setFetchLoading(true);

            fetch(`/api/admin/coupon/detail?id=${couponId}`)
                .then(async (res) => {
                    const data = await res.json();
                    if (data.success && data.data) {
                        const coupon = data.data;
                        const toDateTimeLocal = (dateStr?: string) => {
                            if (!dateStr) return moment().format("YYYY-MM-DDTHH:mm");
                            // Try parsing with the custom format first, then fallback to default
                            const m = moment(dateStr, "DD:MM:YY HH:mm", true);
                            if (m.isValid()) {
                                return m.format("YYYY-MM-DDTHH:mm");
                            }
                            return moment(dateStr).format("YYYY-MM-DDTHH:mm");
                        };
                        setFetchedInitialValues({
                            code: coupon.code || "",
                            title: coupon.title || "",
                            description: coupon.description || "",
                            type: coupon.type || "fixed",
                            value: coupon.value !== undefined ? coupon.value : "",
                            maxDiscountAmount: coupon.maxDiscountAmount !== undefined ? coupon.maxDiscountAmount : "",
                            minOrderValue: coupon.minOrderValue !== undefined ? coupon.minOrderValue : "",
                            scope: coupon.scope || "global",
                            startAt: toDateTimeLocal(coupon.startAt),
                            endAt: toDateTimeLocal(coupon.endAt),
                            totalUses: coupon.totalUses || 1,
                            perUserLimit: coupon.perUserLimit || 1,
                            isStackable: coupon.isStackable || false,
                            isSecret: coupon.isSecret || false,
                            isActive: coupon.isActive !== undefined ? coupon.isActive : true,
                        });
                    } else {
                        // Toast.error("Coupon not found");
                        router.push("/dashboard/coupon");
                    }
                })
                .catch(() => {
                    // Toast.error("Failed to fetch coupon");
                    router.push("/dashboard/coupon");
                })
                .finally(() => setFetchLoading(false));
        } else {
            setIsEdit(false);
            setFetchLoading(false);
        }
    }, [couponId, router]);

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: fetchedInitialValues,
        validationSchema: getCouponsValidationSchema(isEdit),
        onSubmit: async (values) => {
            if (!isEdit && codeAvailable === false) {
                Swal.fire({
                    icon: "error",
                    title: "Code not available",
                    text: codeCheckMsg || "This coupon code is already taken.",
                });
                return;
            }
            setLoading(true);
            try {
                const payload = {
                    code: values.code.toUpperCase(),
                    title: values.title,
                    description: values.description,
                    type: values.type,
                    value: Number(values.value) || 0,
                    minOrderValue: Number(values.minOrderValue) || 0,
                    scope: values.scope,
                    startAt: new Date(values.startAt).toISOString(),
                    endAt: new Date(values.endAt).toISOString(),
                    maxDiscountAmount: Number(values.maxDiscountAmount) || 0,
                    totalUses: values.totalUses,
                    perUserLimit: values.perUserLimit,
                    isStackable: values.isStackable,
                    isSecret: values.isSecret,
                    isActive: values.isActive,
                };

                if (isEdit && couponId) {
                    await updateCoupon(CouponUpdatePath, {
                        id: couponId,
                        ...payload,
                    });
                } else {
                    await createCoupon(CouponCreatePath, payload);
                }

                setTimeout(() => router.push("/dashboard/coupon"), 1000);
            } catch (error) {
                console.error("Error saving coupon:", error);
            } finally {
                setLoading(false);
            }
        },
    });

    // 1. Move this useEffect ABOVE the early return
    useEffect(() => {
        if (Updatedata?.success === true) {
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                text: Updatedata?.message || "Updated successfully",
                showConfirmButton: false,
                timer: 2000,
            });
            ClearUpdateDAta()
        } else if (Updatedata?.success === false) {
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                text: Updatedata?.message || "Something went wrong",
                showConfirmButton: false,
                timer: 2000,
            });
            ClearUpdateDAta()

        }
    }, [Updatedata]);

    // 2. PLACE THE EARLY RETURN HERE (After all hooks)
    if (fetchLoading) {
        return (
            <div >
                <CoponSkeleton />
            </div>
        );
    }


    // Coupon code check handler
    const handleCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (val.length <= 8) {
            formik.setFieldValue("code", val);
            setCodeAvailable(null);
            setCodeCheckMsg("");
            if (val.length >= 3 && !isEdit) {
                setCodeCheckLoading(true);
                try {
                    const res = await fetch("/api/admin/coupon/check-code", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ code: val })
                    });
                    const data = await res.json();
                    setCodeAvailable(data.available);
                    setCodeCheckMsg(data.message);
                } catch (err) {
                    setCodeAvailable(false);
                    setCodeCheckMsg("Error checking code");
                } finally {
                    setCodeCheckLoading(false);
                }
            }
        }
    };

    return (
        <div className="containerStyle scrollbar-hide">
            <HeaderWithAction
                title={isEdit ? "Edit Coupon" : "Create Coupon"}
                subtitle={isEdit ? `Edit coupon - ${formik.values.code}` : "Create a new coupon"}
                showBack={true}
            />

            <form onSubmit={formik.handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Code */}
                    <div>
                        <TextField
                            fullWidth
                            label="Coupon Code *"
                            name="code"
                            value={formik.values.code}
                            onChange={handleCodeChange}
                            onBlur={formik.handleBlur}
                            placeholder="e.g., DAILY8"
                            inputProps={{
                                style: { textTransform: "uppercase" },
                                maxLength: 8
                            }}
                            disabled={isEdit}
                            error={codeAvailable === false}
                            helperText={
                                codeCheckLoading
                                    ? "Checking..."
                                    : codeAvailable === false
                                        ? codeCheckMsg || "Code is not available"
                                        : codeAvailable === true && formik.values.code.length >= 3
                                            ? codeCheckMsg || "Code is available"
                                            : ""
                            }
                        />
                        {formik.touched.code && formik.errors.code && (
                            <ErrorMessageCom error={formik.errors.code} />
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <TextField
                            fullWidth
                            label="Coupon Title *"
                            name="title"
                            value={formik.values.title}
                            onChange={(e) => {
                                const val = e.target.value.slice(0, 40);
                                formik.setFieldValue("title", val);
                            }}
                            onBlur={formik.handleBlur}
                            placeholder="e.g., 20% Off All Daily OTC"
                            inputProps={{ maxLength: 40 }}
                        />
                        <div style={{ fontSize: '12px', color: '#888', textAlign: 'right' }}>
                            {formik.values.title.length}/40
                        </div>
                        {formik.touched.title && formik.errors.title && (
                            <ErrorMessageCom error={formik.errors.title} />
                        )}
                    </div>
                </div>
                {/* Description */}
                <div>

                    <TextareaField
                        id="targetScreen"
                        name="description"
                        label="Description *"
                        value={formik.values.description}
                        onChange={(e) => {
                            const val = e.target.value.slice(0, 150);
                            formik.setFieldValue("description", val);
                        }}
                        placeholder="Enter message here"
                        maxLength={150}
                        rows={5}
                        showCount={true}
                        className=""
                        disabled={isEdit ? false : false}
                    />
                    {/* <div style={{ fontSize: '12px', color: '#888', textAlign: 'right' }}>
                        {formik.values.description.length}/150
                    </div> */}
                    {formik.touched.description && formik.errors.description && (
                        <ErrorMessageCom error={formik.errors.description} />
                    )}

                </div>

                {/* Discount Type and Value Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Type */}
                    <div>
                        <TextField
                            fullWidth
                            label="Discount Type *"
                            name="type"
                            select
                            value={formik.values.type}
                            onChange={(e) => {
                                formik.handleChange(e);
                                if (e.target.value === "fixed") {
                                    formik.setFieldValue("maxDiscountAmount", "");
                                }
                            }}
                            onBlur={formik.handleBlur}
                            disabled={isEdit}
                        >
                            <MenuItem value="fixed">Fixed Amount (₹)</MenuItem>
                            <MenuItem value="percentage">Percentage (%)</MenuItem>
                        </TextField>
                        {formik.touched.type && formik.errors.type && (
                            <ErrorMessageCom error={formik.errors.type} />
                        )}
                    </div>

                    {/* Value */}
                    <div>
                        <TextField
                            fullWidth
                            label={formik.values.type === "fixed" ? "Discount Amount (₹) *" : "Discount Percentage (1-100) *"}
                            name="value"
                            value={formik.values.value}
                            onChange={(e) => {
                                let val = e.target.value.replace(/[^0-9]/g, "");
                                if (formik.values.type === "percentage" && Number(val) > 100) {
                                    return;
                                }
                                formik.setFieldValue("value", val);
                            }}
                            onBlur={formik.handleBlur}
                            inputProps={{
                                min: "0",
                                max: formik.values.type === "percentage" ? "100" : undefined,
                            }}
                            disabled={isEdit}
                        />
                        {formik.touched.value && formik.errors.value && (
                            <ErrorMessageCom error={formik.errors.value} />
                        )}
                    </div>
                </div>




                {/* Min Order Value and Scope */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Min Order Value */}
                    <div>
                        <TextField
                            fullWidth
                            label="Min Order Value (₹) *"
                            name="minOrderValue"
                            value={formik.values.minOrderValue}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, "");
                                formik.setFieldValue("minOrderValue", val);
                            }}
                            onBlur={formik.handleBlur}
                            disabled={isEdit}
                        />
                        {formik.touched.minOrderValue && formik.errors.minOrderValue && (
                            <ErrorMessageCom error={formik.errors.minOrderValue} />
                        )}
                    </div>
                    {/* Max Discount - Only for percentage */}
                    {formik.values.type === "percentage" && (
                        <div>
                            <TextField
                                fullWidth
                                label="Max Rs Discount (Optional)"
                                name="maxDiscountAmount"
                                value={formik.values.maxDiscountAmount || ""}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, "");
                                    formik.setFieldValue("maxDiscountAmount", val);
                                }}
                                onBlur={formik.handleBlur}
                                placeholder="e.g., 500"
                                inputProps={{ min: "0" }}
                                disabled={isEdit}
                            />
                            {formik.touched.maxDiscountAmount && formik.errors.maxDiscountAmount && (
                                <ErrorMessageCom error={formik.errors.maxDiscountAmount} />
                            )}
                        </div>
                    )}


                    {/* Scope */}
                    {/* <div>
                        <TextField
                            fullWidth
                            label="Scope *"
                            name="scope"
                            select
                            value={formik.values.scope}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        >
                            <MenuItem value="global">Global</MenuItem>
                            <MenuItem value="category">Category</MenuItem>
                            <MenuItem value="product">Product</MenuItem>
                        </TextField>
                        {formik.touched.scope && formik.errors.scope && (
                            <ErrorMessageCom error={formik.errors.scope} />
                        )}
                    </div> */}
                </div>

                {/* Start Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div >
                        <TextField
                            fullWidth
                            label="Start Date *"
                            name="startAt"
                            type="datetime-local"
                            value={formik.values.startAt || ""}
                            onChange={(e) => {
                                const localVal = e.target.value;
                                formik.setFieldValue('startAt', localVal);
                                if (formik.values.endAt && localVal > formik.values.endAt) {
                                    formik.setFieldValue('endAt', "");
                                }
                            }}
                            onBlur={formik.handleBlur}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                min: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
                                    .toISOString()
                                    .substring(0, 16)
                            }}
                            disabled={isEdit}
                        />
                        {formik.touched.startAt && formik.errors.startAt && (
                            <ErrorMessageCom error={formik.errors.startAt} />
                        )}
                    </div>

                    {/* End Date */}
                    <div>
                        <TextField
                            fullWidth
                            label="End Date *"
                            name="endAt"
                            type="datetime-local"
                            value={formik.values.endAt || ""}
                            onChange={(e) => {
                                formik.setFieldValue('endAt', e.target.value);
                            }}
                            onBlur={formik.handleBlur}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                min: formik.values.startAt || new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
                                    .toISOString()
                                    .substring(0, 16)
                            }}
                            disabled={isEdit}
                        />
                        {formik.touched.endAt && formik.errors.endAt && (
                            <ErrorMessageCom error={formik.errors.endAt} />
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Per User Limit */}
                    <div>
                        <TextField
                            fullWidth
                            label="Max Coupons Per User *"
                            name="perUserLimit"
                            value={formik.values.perUserLimit}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, "");
                                formik.setFieldValue("perUserLimit", val);
                            }}
                            onBlur={formik.handleBlur}
                            helperText="How many times one user can use this coupon"
                            disabled={isEdit}
                        />
                        {formik.touched.perUserLimit && formik.errors.perUserLimit && (
                            <ErrorMessageCom error={formik.errors.perUserLimit} />
                        )}
                    </div>

                    {/* Max Coupons */}
                    <div>
                        <TextField
                            fullWidth
                            label="Max No. of Coupons (Global) *"
                            name="totalUses"
                            value={formik.values.totalUses}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, "");
                                formik.setFieldValue("totalUses", val);
                            }}
                            onBlur={formik.handleBlur}
                            helperText="Total number of times this coupon can be used"
                            disabled={isEdit}
                        />
                        {formik.touched.totalUses && formik.errors.totalUses && (
                            <ErrorMessageCom error={formik.errors.totalUses} />
                        )}
                    </div>
                </div>

                {/* Toggles */}
                <Box className="border-t pt-6">
                    <div className="space-y-4">

                        {/* <FormControlLabel
                            control={
                                <Switch
                                    name="isStackable"
                                    checked={formik.values.isStackable}
                                    onChange={undefined}
                                    disabled={isEdit}
                                />
                            }
                            label={
                                <div>
                                    <p className="font-medium">Stackable</p>
                                    <p className="text-xs text-gray-600">Can be combined with other coupons</p>
                                </div>
                            }
                        /> */}
                        <FormControlLabel
                            control={
                                <Switch
                                    name="isSecret"
                                    checked={formik.values.isSecret}
                                    onChange={formik.handleChange}
                                    disabled={isEdit}
                                />
                            }
                            label={
                                <div>
                                    <p className="font-medium">Secret Coupon</p>
                                    <p className="text-xs text-gray-600">
                                        Won't appear in customer-facing lists. Customers must apply manually.
                                    </p>
                                </div>
                            }
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    name="isActive"
                                    checked={formik.values.isActive}
                                    onChange={formik.handleChange}
                                    disabled={isEdit}
                                />
                            }
                            label={
                                <div>
                                    <p className="font-medium">Active Status</p>
                                    <p className="text-xs text-gray-600">Turn OFF to manually deactivate this coupon</p>
                                </div>
                            }
                        />
                    </div>
                </Box>



                <div className="  ButtonOuter">
                    {" "}
                    <div className="buttoninner  ">
                        <CustomButton type="submit"
                            disabled={loading || (!isEdit && codeAvailable === false)}
                            width="100%">
                            {loading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (

                                <MdSave size={22} />
                            )}
                            {isEdit
                                ? "Update Coupon"
                                : "Add Coupon"}
                        </CustomButton>
                    </div>
                </div>
            </form>


        </div>
    );
}
