"use client";
import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { TextField, InputAdornment, Divider } from "@mui/material";
import { Truck, CreditCard, Save, Info } from "lucide-react";

import HeaderWithAction from "@/app/dashboard/components/HeaderWithAction";
import { CustomButton, ErrorMessageCom } from "@/app/dashboard/components/miniComponents";
import Toast from "@/utils/Toast";
import { PaymentSettingsPath } from "@/app/dashboard/storeAPICall/API/BaseApi";
import { PaymentSettingsStore } from "../storeAPICall/useUserStore";
import SettingSkeleton from "../components/skeleton/SettingSkeleton";

const SettingsService = {
  getSettings: async () => {
    const res = await fetch(PaymentSettingsPath);
    if (!res.ok) throw new Error("Fetch failed");
    const json = await res.json();
    return json?.data || {};
  },
  saveSettings: async (postFn: any, values: any) => {
    return await postFn(PaymentSettingsPath, values);
  },
};

export default function SettingsPage() {
  const { postData, loading, clearData } = PaymentSettingsStore();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [initialValues, setInitialValues] = useState({
    deliveryAmount: "",
    deliveryAmountThreshold: "",
    paymentGatewayFeesPercent: "",
    paymentGatewayFeesGSTPercent: "",
  });
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingSettings(true);
      try {
        const data = await SettingsService.getSettings();
        if (!mounted) return;
        setInitialValues({
          deliveryAmount: data.deliveryAmount ?? "",
          deliveryAmountThreshold: data.deliveryAmountThreshold ?? "",
          paymentGatewayFeesPercent: data.paymentGatewayFeesPercent ?? "",
          paymentGatewayFeesGSTPercent: data.paymentGatewayFeesGSTPercent ?? "",
        });
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoadingSettings(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // --- Logic to prevent typing > 100 ---
  const handlePercentageInput = (e: React.ChangeEvent<HTMLInputElement>, setFieldValue: any) => {
    const { name, value } = e.target;
    // Allow empty string for clearing input, otherwise cap at 100
    if (value === "" || (Number(value) <= 100 && Number(value) >= 0)) {
      setFieldValue(name, value);
    }
  };

  const validationSchema = Yup.object({
    deliveryAmount: Yup.number().required("Mandatory field").min(0, "No negative values"),
    deliveryAmountThreshold: Yup.number()
      .required("Mandatory field")
      .min(0, "No negative values")
      .test("is-greater", "Threshold must be ≥ Delivery Fee", function (value) {
        return value >= (this.parent.deliveryAmount || 0);
      }),
    paymentGatewayFeesPercent: Yup.number().required("Mandatory field").max(100, "Max 100%"),
    paymentGatewayFeesGSTPercent: Yup.number().required("Mandatory field").max(100, "Max 100%"),
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
          const res = await SettingsService.saveSettings(postData, values);
          setToastMsg(res?.message || "Settings saved successfully");
          try { clearData && clearData(); } catch (e) {}
        } catch (e: any) {
          setToastMsg(e?.message || "Error saving settings");
        }
      }}
    >
      {({ values, handleChange, handleBlur, touched, errors, setFieldValue }) => (
        <Form className="space-y-10 mt-8 max-w-5xl">
        
        {/* --- Section 1: Logistics --- */}
        <div className="space-y-4">
          {/* Label Row */}
          <div className="border-l-4 border-green-600 pl-4 py-1">
            <div className="flex items-center gap-2 text-green-700">
              <Truck size={22} />
              <h3 className="font-bold text-xl">Logistics</h3>
            </div>
            <p className="text-sm text-gray-500 ml-1">Configure shipping fees and free delivery milestones.</p>
          </div>

          {/* Input Row - Fields appear below the heading */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-1">
              <TextField
                label="Standard Delivery Fee"
                name="deliveryAmount"
                type="number"
                variant="outlined"
                value={values.deliveryAmount}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.deliveryAmount && !!errors.deliveryAmount}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                fullWidth
              />
              {touched.deliveryAmount && errors.deliveryAmount && <ErrorMessageCom error={errors.deliveryAmount} />}
            </div>

            <div className="flex flex-col gap-1">
              <TextField
                label="Free Delivery Threshold"
                name="deliveryAmountThreshold"
                type="number"
                variant="outlined"
                value={values.deliveryAmountThreshold}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.deliveryAmountThreshold && !!errors.deliveryAmountThreshold}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                fullWidth
              />
              {touched.deliveryAmountThreshold && errors.deliveryAmountThreshold && <ErrorMessageCom error={errors.deliveryAmountThreshold} />}
            </div>
          </div>
        </div>

        <Divider />

        {/* --- Section 2: Financials --- */}
        <div className="space-y-4">
          {/* Label Row */}
          <div className="border-l-4 border-blue-600 pl-4 py-1">
            <div className="flex items-center gap-2 text-blue-700">
              <CreditCard size={22} />
              <h3 className="font-bold text-xl">Financials</h3>
            </div>
            <p className="text-sm text-gray-500 ml-1">Set gateway commission and tax percentages (Max 100%).</p>
          </div>

          {/* Input Row */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-1">
              <TextField
                label="Gateway Commission"
                name="paymentGatewayFeesPercent"
                type="number"
                variant="outlined"
                value={values.paymentGatewayFeesPercent}
                onChange={(e: any) => handlePercentageInput(e, setFieldValue)}
                onBlur={handleBlur}
                error={touched.paymentGatewayFeesPercent && !!errors.paymentGatewayFeesPercent}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                fullWidth
              />
              {touched.paymentGatewayFeesPercent && errors.paymentGatewayFeesPercent && <ErrorMessageCom error={errors.paymentGatewayFeesPercent} />}
            </div>

            <div className="flex flex-col gap-1">
              <TextField
                label="GST on Commission"
                name="paymentGatewayFeesGSTPercent"
                type="number"
                variant="outlined"
                value={values.paymentGatewayFeesGSTPercent}
                onChange={(e: any) => handlePercentageInput(e, setFieldValue)}
                onBlur={handleBlur}
                error={touched.paymentGatewayFeesGSTPercent && !!errors.paymentGatewayFeesGSTPercent}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                fullWidth
              />
              {touched.paymentGatewayFeesGSTPercent && errors.paymentGatewayFeesGSTPercent && <ErrorMessageCom error={errors.paymentGatewayFeesGSTPercent} />}
            </div>
          </div>
        </div>

        {/* --- Action Row --- */}
         <div className="mt-8 flex ButtonOuter w-full">
              {" "}
              <div className="buttoninner  w-full max-w-sm">
            
            <CustomButton
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-10 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              {loading ? "Processing..." : <><Save size={20} /> Update Settings</>}
            </CustomButton>
          </div>
        </div>
      </Form>
    )}
  </Formik>
  )}
  {toastMsg && <Toast message={toastMsg} />}
</div>
  );
}