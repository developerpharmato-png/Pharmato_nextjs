"use client";
import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { ToastMessages } from "@/utils/ToasterMessage";
import { TextField, InputAdornment } from "@mui/material";
import { Truck, Save } from "lucide-react";

import HeaderWithAction from "@/app/dashboard/components/HeaderWithAction";
import { CustomButton, ErrorMessageCom } from "@/app/dashboard/components/miniComponents";
import { PaymentSettingsPath } from "@/app/dashboard/storeAPICall/API/BaseApi";
import { PaymentSettingsStore } from "../storeAPICall/useUserStore";
import SettingSkeleton from "../components/skeleton/SettingSkeleton";

const SettingsService = {
  getSettings: async () => {
    const res = await fetch(PaymentSettingsPath);
    if (!res.ok) throw new Error("Fetch failed");
    const json = await res.json();
    return json?.data || [];
  },
  saveSettings: async (postFn: any, values: any) => {
    return await postFn(PaymentSettingsPath, values);
  },
};

export default function SettingsPage() {
  const { postData, loading, clearData } = PaymentSettingsStore();
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [initialValues, setInitialValues] = useState({
    deliveryFee: "",
    deliveryFeeThreshold: "",
    deliveryFeeId: "",
    deliveryFeeThresholdId: "",
  });
  const [adminPermissions, setAdminPermissions] = useState<any>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem("adminPermissions");
      if (p) setAdminPermissions(JSON.parse(p));
    } catch (e) {
      // ignore
    }
  }, []);

  const canEditSettings =
    adminPermissions?.Setting?.edit ?? adminPermissions?.Settings?.edit ?? true;
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingSettings(true);
      try {
        const list = await SettingsService.getSettings();
        if (!mounted) return;
        const fee = (list || []).find((s: any) => s.type === 'deliveryFee');
        const thresh = (list || []).find((s: any) => s.type === 'deliveryFeeThreshold');
        setInitialValues({
          deliveryFee: fee ? String(fee.data) : "",
          deliveryFeeThreshold: thresh ? String(thresh.data) : "",
          deliveryFeeId: fee ? String(fee._id) : "",
          deliveryFeeThresholdId: thresh ? String(thresh._id) : "",
        });
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoadingSettings(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const validationSchema = Yup.object({
    deliveryFee: Yup.number().required("Mandatory field").min(0, "No negative values"),
    deliveryFeeThreshold: Yup.number()
      .required("Mandatory field")
      .min(0, "No negative values")
      .test("is-greater", ToastMessages.THRESHOLD_VALIDATION, function (value) {
        return value >= (this.parent.deliveryFee || 0);
      }),
  });

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Settings & Policies"
        subtitle="Global configuration for your pharmacy platform"
        showBack={false}
      />

      {loadingSettings ? (
        <div className="mt-6">
          <SettingSkeleton />
        </div>
      ) : (
        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            try {
              // prepare updates array with ids
              const updates: any[] = [];
              if (values.deliveryFeeId || values.deliveryFee !== undefined) {
                updates.push({ _id: values.deliveryFeeId || undefined, type: 'deliveryFee', data: String(values.deliveryFee), data_value_in: 'number', description: 'delivery fee', is_active: 1 });
              }
              if (values.deliveryFeeThresholdId || values.deliveryFeeThreshold !== undefined) {
                updates.push({ _id: values.deliveryFeeThresholdId || undefined, type: 'deliveryFeeThreshold', data: String(values.deliveryFeeThreshold), data_value_in: 'number', description: 'free delivery threshold', is_active: 1 });
              }
              const res = await SettingsService.saveSettings(postData, { updates });
              Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: ToastMessages.SETTINGS_UPDATED,
                showConfirmButton: false,
                timer: 2000,
              });
              try { clearData && clearData(); } catch (e) { }
            } catch (e: any) {
              Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title: ToastMessages.SETTINGS_UPDATE_FAILED,
                text: e?.message || "An error occurred",
                showConfirmButton: false,
                timer: 2000,
              });
            }
          }}
        >
          {({ values, handleChange, handleBlur, touched, errors }) => (
            <Form className="space-y-10 mt-8 max-w-5xl">
              {/* --- Only show Delivery Fee and Threshold --- */}
              <div className="space-y-4">
                <div className="border-l-4 border-green-600 pl-4 py-1">
                  <div className="flex items-center gap-2 text-green-700">
                    <Truck size={22} />
                    <h3 className="font-bold text-xl">Logistics</h3>
                  </div>
                  <p className="text-sm text-gray-500 ml-1">Configure standard delivery fee and free delivery threshold.</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-1">
                    <TextField
                      label="Standard Delivery Fee"
                      name="deliveryFee"
                      type="number"
                      variant="outlined"
                      value={values.deliveryFee}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.deliveryFee && !!errors.deliveryFee}
                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                      fullWidth
                    />
                    {touched.deliveryFee && errors.deliveryFee && <ErrorMessageCom error={errors.deliveryFee} />}
                  </div>

                  <div className="flex flex-col gap-1">
                    <TextField
                      label="Free Delivery Threshold"
                      name="deliveryFeeThreshold"
                      type="number"
                      variant="outlined"
                      value={values.deliveryFeeThreshold}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.deliveryFeeThreshold && !!errors.deliveryFeeThreshold}
                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                      fullWidth
                    />
                    {touched.deliveryFeeThreshold && errors.deliveryFeeThreshold && <ErrorMessageCom error={errors.deliveryFeeThreshold} />}
                  </div>
                </div>
              </div>

              {/* --- Action Row --- */}
              {canEditSettings && (
                <div className="ButtonOuter">
                  {" "}
                  <div className="buttoninner">
                    <CustomButton
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-10 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all"
                    >
                      {loading ? "Processing..." : <><Save size={20} /> Update Settings</>}
                    </CustomButton>
                  </div>
                </div>
              )}
            </Form>
          )}
        </Formik>
      )}
    </div>
  );
}
