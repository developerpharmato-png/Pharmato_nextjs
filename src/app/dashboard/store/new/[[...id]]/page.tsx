"use client";
import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useFormik } from "formik";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import axios from "axios";
import Swal from "sweetalert2";
import TextField from "@mui/material/TextField";
import {
  StoreCreateStore,
  StoreUpdateStore,
  StoreDetailStore,
  StoreManagersStore,
} from "@/app/dashboard/storeAPICall/useUserStore";
import {
  StoreManagersPath,
  StorePath,
} from "@/app/dashboard/storeAPICall/API/BaseApi";
import HeaderWithAction from "@/app/dashboard/components/HeaderWithAction";
import {
  CustomButton,
  ErrorMessageCom,
} from "@/app/dashboard/components/miniComponents";
import PincodeSelect from "../../PincodeSelect";
import AddressFields from "../../AddressFields";
import StoreMapComponent from "../../StoreMapComponent";
import { StoreInitialValues } from "@/utils/initCategory";
import { StoreValidationSchema } from "@/utils/validateCategory";

export default function AddStorePage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string[] | undefined)?.[0];
  const isEditMode = !!id;

  const [pincodes, setPincodes] = useState<any[]>([]);

  const {
    fetchData: GetStoreManagers,
    loading: storeManagersLoading,
    data: storeManagersData,
  } = StoreManagersStore();

  const { postData: CreateStore, loading: createStoreLoading } =
    StoreCreateStore();

  const {
    fetchData: GetStoreById,
    loading: storeDetailLoading,
    data: storeDetailData,
  } = StoreDetailStore();

  const { putData: UpdateStore, loading: updateStoreLoading } =
    StoreUpdateStore();

  const formik = useFormik({
    initialValues: StoreInitialValues,
    validationSchema: StoreValidationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        let response;
        if (isEditMode && id) {
          response = await UpdateStore(`${StorePath}?id=${id}`, values);
        } else {
          response = await CreateStore(StorePath, values);
        }

        if (response?.success) {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: isEditMode
              ? "Store updated successfully!"
              : "Store added successfully!",
            showConfirmButton: false,
            timer: 2000,
          });
          setTimeout(() => {
            router.push("/dashboard/store");
          }, 1000);
        } else {
          throw new Error(
            response?.message || response?.error || "Failed to save store"
          );
        }
      } catch (err: any) {
        const errorMsg =
          err?.message || err?.response?.data?.message || "Error saving store";
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMsg,
        });
      }
    },
  });

  React.useEffect(() => {
    async function fetchPincodes() {
      try {
        const res = await axios.get("/api/admin/pincode");
        setPincodes(res.data.data || []);
      } catch {
        setPincodes([]);
      }
    }
    fetchPincodes();
  }, []);

  React.useEffect(() => {
    GetStoreManagers({ url: StoreManagersPath });
    if (isEditMode && id) {
      GetStoreById({ url: `${StorePath}/${id}` });
    }
  }, [id, isEditMode]);

  React.useEffect(() => {
    if (isEditMode && storeDetailData?.data) {
      const store = storeDetailData.data;
      formik.setValues({
        name: store.name || "",
        servicePinCodes: store.servicePinCodes || [],
        address: store.address || {
          street: "",
          city: "",
          state: "",
          country: "India",
          pincode: "",
          gps: "",
        },
        status: store.status ?? 1,
        adminManagerId: store.adminManagerId?._id || store.adminManagerId || "",
      });
    }
  }, [storeDetailData, isEditMode]);

  const getFieldError = (fieldName: string) => {
    return formik.touched[fieldName as keyof typeof formik.touched] &&
      formik.errors[fieldName as keyof typeof formik.errors]
      ? formik.errors[fieldName as keyof typeof formik.errors]
      : null;
  };

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title={isEditMode ? "Edit Store" : "Add Store"}
        subtitle={
          isEditMode ? "Update store details" : "Create a new store location"
        }
        showBack={true}
        showSearch={false}
      />

      <form
        onSubmit={formik.handleSubmit}
        className="flex flex-col gap-8 px-8 py-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <TextField
              name="name"
              label="Store Name *"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              fullWidth
              variant="outlined"
              placeholder="Enter store name"
              error={Boolean(getFieldError("name"))}
            />
            {getFieldError("name") && (
              <ErrorMessageCom error={getFieldError("name") as string} />
            )}
          </div>
          <div>
            <FormControl
              fullWidth
              variant="outlined"
              error={Boolean(
                formik.touched.adminManagerId && formik.errors.adminManagerId
              )}
            >
              <InputLabel id="admin-manager-label">Store Manager *</InputLabel>
              <Select
                labelId="admin-manager-label"
                name="adminManagerId"
                value={formik.values.adminManagerId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                label="Store Manager *"
                disabled={storeManagersLoading}
              >
                <MenuItem value="">
                  <em>
                    {storeManagersLoading
                      ? "Loading..."
                      : "Select Store Manager"}
                  </em>
                </MenuItem>
                {(storeManagersData?.data || []).map((admin: any) => (
                  <MenuItem key={admin._id} value={admin._id}>
                    {admin.email} - {admin.firstName} {admin.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formik.touched.adminManagerId && formik.errors.adminManagerId && (
              <ErrorMessageCom error={formik.errors.adminManagerId as string} />
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div></div>
          <div>
            <PincodeSelect
              pincodes={pincodes}
              value={formik.values.servicePinCodes}
              error={
                formik.touched.servicePinCodes
                  ? (formik.errors.servicePinCodes as string)
                  : ""
              }
              onChange={(selected) =>
                formik.setFieldValue("servicePinCodes", selected)
              }
            />
            {formik.touched.servicePinCodes &&
              formik.errors.servicePinCodes && (
                <ErrorMessageCom
                  error={formik.errors.servicePinCodes as string}
                />
              )}
          </div>
        </div>

        <AddressFields
          address={formik.values.address}
          errors={formik.errors.address as Record<string, string> | undefined}
          touched={formik.touched.address}
          onBlur={(field) => formik.setFieldTouched(`address.${field}`, true)}
          onChange={(field, value) =>
            formik.setFieldValue("address", {
              ...formik.values.address,
              [field]: value,
            })
          }
        />

        {/* OpenStreetMap for GPS Location Selection */}
        <div className="w-full">
          <StoreMapComponent
            gpsValue={formik.values.address.gps}
            onLocationSelect={(lat, lng) => {
              formik.setFieldValue("address.gps", `${lat},${lng}`);
            }}
            disabled={formik.isSubmitting}
          />
          {formik.touched.address?.gps && formik.errors.address?.gps && (
            <ErrorMessageCom error={formik.errors.address.gps as string} />
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="w-full md:w-1/2 flex justify-end items-end mt-4 md:mt-0">
            <CustomButton
              type="submit"
              disabled={
                formik.isSubmitting ||
                createStoreLoading ||
                storeDetailLoading ||
                updateStoreLoading
              }
              width="140px"
            >
              {isEditMode ? "Update" : "Add"}
            </CustomButton>
          </div>
        </div>
      </form>
    </div>
  );
}
