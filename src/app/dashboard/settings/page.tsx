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
  const [initialValues, setInitialValues] = useState({
    deliveryAmount: "",
    deliveryAmountThreshold: "",
    paymentGatewayFeesPercent: "",
    paymentGatewayFeesGSTPercent: "",
  });

  useEffect(() => {
    SettingsService.getSettings()
      .then((data) => setInitialValues({
        deliveryAmount: data.deliveryAmount ?? "",
        deliveryAmountThreshold: data.deliveryAmountThreshold ?? "",
        paymentGatewayFeesPercent: data.paymentGatewayFeesPercent ?? "",
        paymentGatewayFeesGSTPercent: data.paymentGatewayFeesGSTPercent ?? "",
      }))
      .catch(console.error);
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
    <div className="containerStyle scrollbar-hide ">
      <HeaderWithAction
        title="Settings & Policies"
        subtitle="Global configuration for your pharmacy platform"
        showBack={false}
      />


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
          <Form className="space-y-8 mt-8">
            
            {/* Section 1: Logistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-green-700">
                  <Truck size={20} />
                  <h3 className="font-bold text-lg">Logistics</h3>
                </div>
                <p className="text-sm text-gray-500">Shipping and delivery costs.</p>
              </div>

              <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <TextField
                    label="Standard Delivery Fee"
                    name="deliveryAmount"
                    type="number"
                    value={values.deliveryAmount}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.deliveryAmount && !!errors.deliveryAmount}
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                    fullWidth
                  />
                  {touched.deliveryAmount && errors.deliveryAmount && <ErrorMessageCom error={errors.deliveryAmount} />}
                </div>

                <div>
                  <TextField
                    label="Free Delivery Threshold"
                    name="deliveryAmountThreshold"
                    type="number"
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

            {/* Section 2: Financials */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-blue-700">
                  <CreditCard size={20} />
                  <h3 className="font-bold text-lg">Financials</h3>
                </div>
                <p className="text-sm text-gray-500">Gateway fees (Max 100%).</p>
              </div>

              <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <TextField
                    label="Gateway Commission"
                    name="paymentGatewayFeesPercent"
                    type="number"
                    value={values.paymentGatewayFeesPercent}
                    onChange={(e: any) => handlePercentageInput(e, setFieldValue)} // Restricted Input
                    onBlur={handleBlur}
                    error={touched.paymentGatewayFeesPercent && !!errors.paymentGatewayFeesPercent}
                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                    fullWidth
                  />
                  {touched.paymentGatewayFeesPercent && errors.paymentGatewayFeesPercent && <ErrorMessageCom error={errors.paymentGatewayFeesPercent} />}
                </div>

                <div>
                  <TextField
                    label="GST on Commission"
                    name="paymentGatewayFeesGSTPercent"
                    type="number"
                    value={values.paymentGatewayFeesGSTPercent}
                    onChange={(e: any) => handlePercentageInput(e, setFieldValue)} // Restricted Input
                    onBlur={handleBlur}
                    error={touched.paymentGatewayFeesGSTPercent && !!errors.paymentGatewayFeesGSTPercent}
                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                    fullWidth
                  />
                  {touched.paymentGatewayFeesGSTPercent && errors.paymentGatewayFeesGSTPercent && <ErrorMessageCom error={errors.paymentGatewayFeesGSTPercent} />}
                </div>
              </div>
            </div>

           <div className="mt-8 flex ButtonOuter w-full">
              {" "}
              <div className="buttoninner  w-full max-w-sm">
            
               <CustomButton
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-2xl transition-all"
              >
                {loading ? "Saving..." : <><Save size={20} /> Update Settings</>}
              </CustomButton>
           </div>
           </div>
          </Form>
        )}
      </Formik>
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
    </div>
  );
}