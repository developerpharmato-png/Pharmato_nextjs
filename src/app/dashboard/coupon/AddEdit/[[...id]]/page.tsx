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
import { CouponCreateStore, CouponUpdateStore } from "@/app/dashboard/storeAPICall/useUserStore";
import { CouponCreatePath, CouponUpdatePath } from "@/app/dashboard/storeAPICall/API/BaseApi";
import Toast from "@/utils/Toast";

interface CouponFormValues {
  code: string;
  description: string;
  type: "FIXED" | "PERCENT";
  value: number;
  maxDiscountAmount?: number;
  startAt: string;
  endAt: string;
  maxCoupons: number;
  perUserLimit: number;
  isSecret: boolean;
  isActive: boolean;
}

const validationSchema = Yup.object().shape({
  code: Yup.string()
    .required("Code is mandatory")
    .min(2, "Code must be at least 2 characters")
    .max(50, "Code must not exceed 50 characters"),
  description: Yup.string()
    .required("Description is mandatory")
    .min(10, "Description must be at least 10 characters"),
  type: Yup.string()
    .required("Discount Type is mandatory")
    .oneOf(["FIXED", "PERCENT"]),
  value: Yup.number()
    .required("Value is mandatory")
    .test("value-validation", function (value) {
      const { type } = this.parent;
      if (type === "FIXED") {
        return value > 0 ? true : this.createError({ message: "Amount must be greater than 0" });
      } else if (type === "PERCENT") {
        return value > 0 && value <= 100
          ? true
          : this.createError({ message: "Percentage must be between 1 and 100" });
      }
      return true;
    }),
  maxDiscountAmount: Yup.number()
    .typeError("Max Discount must be a number")
    .test("discount-validation", function (value) {
      const { type } = this.parent;
      if (type === "FIXED") {
        return true; // Not applicable for FIXED
      }
      if (value !== undefined && value !== null && value !== "") {
        return value > 0
          ? true
          : this.createError({ message: "Max Rs Discount must be greater than 0 if provided" });
      }
      return true;
    }),
  startAt: Yup.string()
    .required("Start Date is mandatory")
    .test("start-date-validation", "Start Date must be today or in the future", function (value) {
      if (!value) return false;
      const today = new Date().toISOString().split("T")[0];
      return value >= today;
    }),
  endAt: Yup.string()
    .required("End Date is mandatory")
    .test("end-date-validation", "End Date must be on or after Start Date", function (value) {
      const { startAt } = this.parent;
      if (!value || !startAt) return false;
      return value >= startAt;
    }),
  maxCoupons: Yup.number()
    .required("Max Coupons is mandatory")
    .min(1, "Max Coupons must be at least 1"),
  perUserLimit: Yup.number()
    .required("Max Coupons Per User is mandatory")
    .min(1, "Max Per User must be at least 1"),
});

const initialValues: CouponFormValues = {
  code: "",
  description: "",
  type: "FIXED",
  value: 0,
  maxDiscountAmount: undefined,
  startAt: new Date().toISOString().split("T")[0],
  endAt: new Date().toISOString().split("T")[0],
  maxCoupons: 1,
  perUserLimit: 1,
  isSecret: false,
  isActive: true,
};

export default function CouponAddEditPage() {
  const router = useRouter();
  const params = useParams();
  const couponId = (params as any)?.id?.[0];

  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchedInitialValues, setFetchedInitialValues] = useState<CouponFormValues>(initialValues);

  const { postData: createCoupon } = CouponCreateStore();
  const { postData: updateCoupon } = CouponUpdateStore();

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
            setFetchedInitialValues({
              code: coupon.code || "",
              description: coupon.description || "",
              type: coupon.type || "FIXED",
              value: coupon.value || 0,
              maxDiscountAmount: coupon.maxDiscountAmount || undefined,
              startAt: coupon.startAt
                ? new Date(coupon.startAt).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
              endAt: coupon.endAt
                ? new Date(coupon.endAt).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
              maxCoupons: coupon.maxCoupons || 1,
              perUserLimit: coupon.perUserLimit || 1,
              isSecret: coupon.isSecret || false,
              isActive: coupon.isActive !== undefined ? coupon.isActive : true,
            });
          } else {
            Toast.error("Coupon not found");
            router.push("/dashboard/coupon");
          }
        })
        .catch(() => {
          Toast.error("Failed to fetch coupon");
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
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const payload = {
          code: values.code.toUpperCase(),
          description: values.description,
          type: values.type,
          value: values.value,
          ...(values.type === "PERCENT" && values.maxDiscountAmount && { maxDiscountAmount: values.maxDiscountAmount }),
          startAt: new Date(values.startAt).toISOString(),
          endAt: new Date(values.endAt).toISOString(),
          maxCoupons: values.maxCoupons,
          perUserLimit: values.perUserLimit,
          isSecret: values.isSecret,
          isActive: values.isActive,
        };

        if (isEdit && couponId) {
          await updateCoupon(CouponUpdatePath, {
            _id: couponId,
            ...payload,
          });
          Toast.success("Coupon updated successfully");
        } else {
          await createCoupon(CouponCreatePath, payload);
          Toast.success("Coupon created successfully");
        }

        setTimeout(() => router.push("/dashboard/coupon"), 1000);
      } catch (error) {
        console.error("Error saving coupon:", error);
        Toast.error(isEdit ? "Failed to update coupon" : "Failed to create coupon");
      } finally {
        setLoading(false);
      }
    },
  });

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title={isEdit ? "Edit Coupon" : "Create Coupon"}
        subtitle={isEdit ? `Edit coupon - ${formik.values.code}` : "Create a new coupon"}
        showBack={true}
      />

      <div className="mt-10 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            {/* Code */}
            <div>
              <TextField
                fullWidth
                label="Coupon Code *"
                name="code"
                value={formik.values.code}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g., DAILYNEEDS"
                inputProps={{ style: { textTransform: "uppercase" } }}
                disabled={isEdit}
              />
              {formik.touched.code && formik.errors.code && (
                <ErrorMessageCom error={formik.errors.code} />
              )}
            </div>

            {/* Description */}
            <div>
              <TextField
                fullWidth
                label="Description *"
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                multiline
                rows={3}
                placeholder="Describe the coupon benefits and terms..."
              />
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
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <MenuItem value="FIXED">Fixed Amount (₹)</MenuItem>
                  <MenuItem value="PERCENT">Percentage (%)</MenuItem>
                </TextField>
                {formik.touched.type && formik.errors.type && (
                  <ErrorMessageCom error={formik.errors.type} />
                )}
              </div>

              {/* Value */}
              <div>
                <TextField
                  fullWidth
                  label={formik.values.type === "FIXED" ? "Discount Amount (₹) *" : "Discount Percentage (1-100) *"}
                  name="value"
                  type="number"
                  value={formik.values.value}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  inputProps={{
                    step: formik.values.type === "FIXED" ? "0.01" : "1",
                    min: "0",
                    max: formik.values.type === "PERCENT" ? "100" : undefined,
                  }}
                />
                {formik.touched.value && formik.errors.value && (
                  <ErrorMessageCom error={formik.errors.value} />
                )}
              </div>
            </div>

            {/* Max Discount - Only for PERCENT */}
            {formik.values.type === "PERCENT" && (
              <div>
                <TextField
                  fullWidth
                  label="Max Rs Discount (Optional)"
                  name="maxDiscountAmount"
                  type="number"
                  value={formik.values.maxDiscountAmount || ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g., 500"
                  helperText="Maximum discount cap (e.g., if 20% but capped at ₹500)"
                  inputProps={{ step: "0.01", min: "0" }}
                />
                {formik.touched.maxDiscountAmount && formik.errors.maxDiscountAmount && (
                  <ErrorMessageCom error={formik.errors.maxDiscountAmount} />
                )}
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <TextField
                  fullWidth
                  label="Start Date *"
                  name="startAt"
                  type="date"
                  value={formik.values.startAt}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: new Date().toISOString().split("T")[0] }}
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
                  type="date"
                  value={formik.values.endAt}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: formik.values.startAt }}
                />
                {formik.touched.endAt && formik.errors.endAt && (
                  <ErrorMessageCom error={formik.errors.endAt} />
                )}
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Max Coupons */}
              <div>
                <TextField
                  fullWidth
                  label="Max No. of Coupons (Global) *"
                  name="maxCoupons"
                  type="number"
                  value={formik.values.maxCoupons}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  helperText="Total number of times this coupon can be used"
                  inputProps={{ step: "1", min: "1" }}
                />
                {formik.touched.maxCoupons && formik.errors.maxCoupons && (
                  <ErrorMessageCom error={formik.errors.maxCoupons} />
                )}
              </div>

              {/* Per User Limit */}
              <div>
                <TextField
                  fullWidth
                  label="Max Coupons Per User *"
                  name="perUserLimit"
                  type="number"
                  value={formik.values.perUserLimit}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  helperText="How many times one user can use this coupon"
                  inputProps={{ step: "1", min: "1" }}
                />
                {formik.touched.perUserLimit && formik.errors.perUserLimit && (
                  <ErrorMessageCom error={formik.errors.perUserLimit} />
                )}
              </div>
            </div>

            {/* Toggles */}
            <Box className="border-t pt-6">
              <div className="space-y-4">
                <FormControlLabel
                  control={
                    <Switch
                      name="isActive"
                      checked={formik.values.isActive}
                      onChange={formik.handleChange}
                    />
                  }
                  label={
                    <div>
                      <p className="font-medium">Active</p>
                      <p className="text-xs text-gray-600">Enable or disable this coupon</p>
                    </div>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      name="isSecret"
                      checked={formik.values.isSecret}
                      onChange={formik.handleChange}
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
              </div>
            </Box>

            {/* Buttons */}
            <div className="flex gap-2 justify-end border-t pt-6">
              <Button
                variant="outlined"
                onClick={() => router.push("/dashboard/coupon")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={loading || !formik.isValid}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? "Saving..." : isEdit ? "Update Coupon" : "Create Coupon"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
