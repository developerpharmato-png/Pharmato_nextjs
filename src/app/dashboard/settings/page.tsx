"use client";
import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { ToastMessages } from "@/utils/ToasterMessage";
import { TextField, InputAdornment, FormControlLabel, Switch, Typography } from "@mui/material";
import { Truck, Save, Zap } from "lucide-react";

import HeaderWithAction from "@/app/dashboard/components/HeaderWithAction";
import {
  CustomButton,
  ErrorMessageCom,
} from "@/app/dashboard/components/miniComponents";
import { PaymentSettingsPath } from "@/app/dashboard/storeAPICall/API/BaseApi";
import { PaymentSettingsStore } from "../storeAPICall/useUserStore";
import SettingSkeleton from "../components/skeleton/SettingSkeleton";

const defaultExtraData = [
  { day: "MON", startTime: "18:00", endTime: "22:00", surgeFee: 60, status: true },
  { day: "TUE", startTime: "18:00", endTime: "22:00", surgeFee: 60, status: true },
  { day: "WED", startTime: "18:00", endTime: "22:00", surgeFee: 60, status: true },
  { day: "THU", startTime: "18:00", endTime: "22:00", surgeFee: 60, status: true },
  { day: "FRI", startTime: "18:00", endTime: "22:00", surgeFee: 70, status: true },
  { day: "SAT", startTime: "10:00", endTime: "14:00", surgeFee: 80, status: true },
  { day: "SUN", startTime: "17:00", endTime: "23:00", surgeFee: 100, status: true },
];

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
    expectedDeliveryHours: "",
    deliveryFeeId: "",
    deliveryFeeThresholdId: "",
    expectedDeliveryHoursId: "",
    surgeFeeId: "",
    extraData: defaultExtraData,
  });
  const [globalStart, setGlobalStart] = useState("");
  const [globalEnd, setGlobalEnd] = useState("");
  const [globalSurgeFee, setGlobalSurgeFee] = useState<string | number>("");
  const [globalStatus, setGlobalStatus] = useState<boolean>(true);
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
        const fee = (list || []).find((s: any) => s.type === "deliveryFee");
        const thresh = (list || []).find(
          (s: any) => s.type === "deliveryFeeThreshold",
        );
        const hours = (list || []).find(
          (s: any) => s.type === "expectedDeliveryHours",
        );
        const surge = (list || []).find(
          (s: any) => s.type === "surgePricing",
        );
        setInitialValues({
          deliveryFee: fee ? String(fee.data) : "",
          deliveryFeeThreshold: thresh ? String(thresh.data) : "",
          expectedDeliveryHours: hours ? String(hours.data) : "",
          deliveryFeeId: fee ? String(fee._id) : "",
          deliveryFeeThresholdId: thresh ? String(thresh._id) : "",
          expectedDeliveryHoursId: hours ? String(hours._id) : "",
          surgeFeeId: surge ? String(surge._id) : "",
          extraData: (surge?.extraData || surge?.data) && Array.isArray(surge?.extraData || surge?.data)
            ? (surge.extraData || surge.data)
            : defaultExtraData,
        });
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoadingSettings(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const validationSchema = Yup.object({
    deliveryFee: Yup.number()
      .required("Mandatory field")
      .min(0, "No negative values"),
    deliveryFeeThreshold: Yup.number().min(0, "No negative values"),
    expectedDeliveryHours: Yup.number()
      .required("Mandatory field")
      .min(1, "Must be at least 1 hour")
      .max(24, "Cannot exceed 24 hours"),
    extraData: Yup.array().of(
      Yup.object({
        startTime: Yup.string().required("Required"),
        endTime: Yup.string()
          .required("Required")
          .test("is-greater", "End time must be after start time", function (value) {
            const { startTime } = this.parent;
            if (!startTime || !value) return true;
            return value > startTime;
          }),
      })
    ),
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
              const updates: any[] = [
                {
                  _id: values.deliveryFeeId || undefined,
                  type: "deliveryFee",
                  data: String(values.deliveryFee),
                  data_value_in: "number",
                  description: "delivery fee",
                  is_active: 1,
                },
                {
                  _id: values.deliveryFeeThresholdId || undefined,
                  type: "deliveryFeeThreshold",
                  data: String(values.deliveryFeeThreshold),
                  data_value_in: "number",
                  description: "free delivery threshold",
                  is_active: 1,
                },
                {
                  _id: values.expectedDeliveryHoursId || undefined,
                  type: "expectedDeliveryHours",
                  data: String(values.expectedDeliveryHours),
                  data_value_in: "number",
                  description: "expected delivery hours",
                  is_active: 1,
                },
                {
                  _id: values.surgeFeeId || undefined,
                  type: "surgePricing",
                  data: "",
                  extraData: values.extraData,
                  description: "surge fees",
                  is_active: 1,
                },
              ];
              const res = await SettingsService.saveSettings(postData, {
                updates,
              });
              Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: ToastMessages.SETTINGS_UPDATED,
                showConfirmButton: false,
                timer: 2000,
              });
              try {
                clearData && clearData();
              } catch (e) { }
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
          {({ values, handleChange, handleBlur, touched, errors, setFieldValue }) => (
            <Form className="space-y-10 mt-8 max-w-5xl">
              {/* --- Logistics Section --- */}
              <div className="space-y-4">
                  <div className="border-l-4 border-[var(--secondary)] pl-4 py-1">
                    <div className="flex items-center gap-2 text-[var(--secondary)]">
                    <Truck size={22} />
                    <h3 className="font-bold text-xl">Logistics</h3>
                  </div>
                  <p className="text-sm text-gray-500 ml-1">
                    Configure standard delivery fee and free delivery threshold.
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex flex-col gap-1">
                    <TextField
                      label="Standard Delivery Fee"
                      name="deliveryFee"
                      type="number"
                      variant="outlined"
                      value={values.deliveryFee}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || parseFloat(value) >= 0) {
                          handleChange(e);
                        }
                      }}
                      onBlur={handleBlur}
                      error={touched.deliveryFee && !!errors.deliveryFee}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₹</InputAdornment>
                        ),
                      }}
                      fullWidth
                    />
                    {touched.deliveryFee && errors.deliveryFee && (
                      <ErrorMessageCom error={errors.deliveryFee} />
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <TextField
                      label="Free Delivery Threshold"
                      name="deliveryFeeThreshold"
                      type="number"
                      variant="outlined"
                      value={values.deliveryFeeThreshold}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || parseFloat(value) >= 0) {
                          handleChange(e);
                        }
                      }}
                      onBlur={handleBlur}
                      error={
                        touched.deliveryFeeThreshold &&
                        !!errors.deliveryFeeThreshold
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₹</InputAdornment>
                        ),
                      }}
                      inputProps={{ min: "0", step: "0.01" }}
                      fullWidth
                    />
                    {touched.deliveryFeeThreshold &&
                      errors.deliveryFeeThreshold && (
                        <ErrorMessageCom error={errors.deliveryFeeThreshold} />
                      )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <TextField
                      label="Expected Delivery Hours"
                      name="expectedDeliveryHours"
                      type="number"
                      variant="outlined"
                      value={values.expectedDeliveryHours}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || parseFloat(value) >= 0) {
                          handleChange(e);
                        }
                      }}
                      onBlur={handleBlur}
                      error={
                        touched.expectedDeliveryHours &&
                        !!errors.expectedDeliveryHours
                      }
                      inputProps={{ step: "1", min: "1", max: "24" }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">hrs</InputAdornment>
                        ),
                      }}
                      fullWidth
                    />
                    {touched.expectedDeliveryHours &&
                      errors.expectedDeliveryHours && (
                        <ErrorMessageCom error={errors.expectedDeliveryHours} />
                      )}
                  </div>
                </div>
              </div>

              {/* --- Surge Pricing Section --- */}
              <div className="space-y-4">
                <div className="border-l-4 border-[var(--secondary)] pl-4 py-1">
                  <div className="flex items-center gap-2 text-[var(--secondary)]">
                    <Zap size={22} />
                    <h3 className="font-bold text-xl">Surge Pricing</h3>
                  </div>
                  <p className="text-sm text-gray-500 ml-1">
                    Manage delivery surge fees based on days and time slots.
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* --- Global Time Override Row --- */}
                  <div className="p-6 bg-blue-50/50 border-b border-gray-100">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                      <div className="w-24">
                        <Typography variant="subtitle2" className="font-bold text-blue-700 uppercase tracking-wider">
                          Apply All
                        </Typography>
                      </div>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <TextField
                          label="Global Start Time"
                          type="time"
                          size="small"
                          value={globalStart}
                          InputLabelProps={{ shrink: true }}
                          onChange={(e) => {
                            const val = e.target.value;
                            setGlobalStart(val);

                            // If end time exists and is less than or equal to new start time, clear it or warn
                            if (globalEnd && val >= globalEnd) {
                              setGlobalEnd("");
                            }

                            const newExtraData = values.extraData.map((item: any) => ({
                              ...item,
                              startTime: val,
                              // Also auto-adjust individual end times if they become invalid
                              endTime: item.endTime <= val ? "" : item.endTime
                            }));
                            setFieldValue("extraData", newExtraData);
                          }}
                          sx={{
                            backgroundColor: "white",
                            "& .MuiInputBase-root": { fontSize: "0.875rem" },
                          }}
                        />
                        <TextField
                          label="Global End Time"
                          type="time"
                          size="small"
                          value={globalEnd}
                          InputLabelProps={{ shrink: true }}
                          inputProps={{
                            min: globalStart,
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (globalStart && val <= globalStart) {
                              Swal.fire({
                                toast: true,
                                position: "top-end",
                                icon: "warning",
                                title: "End time must be after start time",
                                showConfirmButton: false,
                                timer: 2000,
                              });
                              return;
                            }

                            setGlobalEnd(val);
                            const newExtraData = values.extraData.map((item: any) => ({
                              ...item,
                              endTime: val,
                            }));
                            setFieldValue("extraData", newExtraData);
                          }}
                          sx={{
                            backgroundColor: "white",
                            "& .MuiInputBase-root": { fontSize: "0.875rem" },
                          }}
                        />
                        <TextField
                          label="Global Surge Fee"
                          type="number"
                          size="small"
                          value={globalSurgeFee}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            setGlobalSurgeFee(val);
                            const newExtraData = values.extraData.map((item: any) => ({
                              ...item,
                              surgeFee: val === "" ? 0 : parseFloat(val),
                            }));
                            setFieldValue("extraData", newExtraData);
                          }}
                          sx={{
                            backgroundColor: "white",
                            "& .MuiInputBase-root": { fontSize: "0.875rem" },
                          }}
                        />

                        <div className="flex items-center justify-between px-2 bg-white rounded-md border border-[#c4c4c4] h-[40px]">
                          {/* <span className="text-sm text-gray-500">Global Status</span> */}
                          <FormControlLabel
                            control={
                              <Switch
                                checked={globalStatus}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  setGlobalStatus(val);
                                  const newExtraData = values.extraData.map((item: any) => ({
                                    ...item,
                                    status: val,
                                  }));
                                  setFieldValue("extraData", newExtraData);
                                }}
                                sx={{
                                  "& .MuiSwitch-switchBase.Mui-checked": {
                                    color: "var(--primary)",
                                  },
                                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                    backgroundColor: "var(--primary)",
                                  },
                                }}
                              />
                            }
                            label={globalStatus ? "Active" : "Inactive"}
                            componentsProps={{ typography: { className: "text-xs font-medium" } }}
                            sx={{ ml: 0, mr: 0 }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 ml-30 lg:ml-30 flex items-center gap-2">
                      <p className="text-xs text-blue-600 italic">
                        * Adjusting any global field above will immediately update all days below. Individual edits are still possible.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 divide-y divide-gray-100">
                    {values.extraData.map((item, index) => (
                      <div key={item.day} className="p-6 transition-colors hover:bg-gray-50">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                          <div className="w-24">
                            <Typography variant="h6" className="font-bold text-gray-700">
                              {item.day}
                            </Typography>
                          </div>

                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex flex-col gap-1 w-full">
                              <TextField
                                label="Start Time"
                                type="time"
                                size="small"
                                value={item.startTime}
                                name={`extraData[${index}].startTime`}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const newExtraData = [...values.extraData];
                                  newExtraData[index].startTime = val;

                                  // Auto-clear end time if it becomes invalid
                                  if (newExtraData[index].endTime && val >= newExtraData[index].endTime) {
                                    newExtraData[index].endTime = "";
                                  }

                                  setFieldValue("extraData", newExtraData);
                                }}
                                onBlur={handleBlur}
                                error={touched.extraData?.[index]?.startTime && !!(errors.extraData as any)?.[index]?.startTime}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                              />
                              {touched.extraData?.[index]?.startTime && (errors.extraData as any)?.[index]?.startTime && (
                                <ErrorMessageCom error={(errors.extraData as any)[index].startTime} />
                              )}
                            </div>

                            <div className="flex flex-col gap-1 w-full">
                              <TextField
                                label="End Time"
                                type="time"
                                size="small"
                                value={item.endTime}
                                name={`extraData[${index}].endTime`}
                                inputProps={{
                                  min: item.startTime,
                                }}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (item.startTime && val <= item.startTime) {
                                    Swal.fire({
                                      toast: true,
                                      position: "top-end",
                                      icon: "warning",
                                      title: "End time must be after start time",
                                      showConfirmButton: false,
                                      timer: 2000,
                                    });
                                    return;
                                  }
                                  const newExtraData = [...values.extraData];
                                  newExtraData[index].endTime = val;
                                  setFieldValue("extraData", newExtraData);
                                }}
                                onBlur={handleBlur}
                                error={touched.extraData?.[index]?.endTime && !!(errors.extraData as any)?.[index]?.endTime}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                              />
                              {touched.extraData?.[index]?.endTime && (errors.extraData as any)?.[index]?.endTime && (
                                <ErrorMessageCom error={(errors.extraData as any)[index].endTime} />
                              )}
                            </div>

                            <TextField
                              label="Surge Fee"
                              type="number"
                              size="small"
                              value={item.surgeFee}
                              onChange={(e) => {
                                const newExtraData = [...values.extraData];
                                newExtraData[index].surgeFee = parseFloat(e.target.value);
                                setFieldValue("extraData", newExtraData);
                              }}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                              }}
                              fullWidth
                            />
                            <div className="flex items-center justify-between px-2">
                              <span className="text-sm text-gray-500 lg:hidden">Status</span>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={item.status}
                                    onChange={(e) => {
                                      const newExtraData = [...values.extraData];
                                      newExtraData[index].status = e.target.checked;
                                      setFieldValue("extraData", newExtraData);
                                    }}
                                    sx={{
                                      "& .MuiSwitch-switchBase.Mui-checked": {
                                        color: "var(--primary)",
                                      },
                                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                        backgroundColor: "var(--primary)",
                                      },
                                    }}
                                  />
                                }
                                label={item.status ? "Active" : "Inactive"}
                                componentsProps={{ typography: { className: "text-sm font-medium" } }}
                                sx={{ ml: 0 }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* --- Action Row --- */}
              {canEditSettings && (
                <div className="ButtonOuter">
                  <div className="buttoninner">
                    <CustomButton
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-10 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all"
                    >
                      {loading ? (
                        "Processing..."
                      ) : (
                        <>
                          <Save size={20} /> Update Settings
                        </>
                      )}
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
