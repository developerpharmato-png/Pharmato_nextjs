"use client";
import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useFormik } from "formik";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import axios from "axios";
import Swal from "sweetalert2";
import { ToastMessages } from "@/utils/ToasterMessage";
import TextField from "@mui/material/TextField";
import {
  StoreCreateStore,
  StoreUpdateStore,
  StoreDetailStore,
  StoreManagersStore,
  BulkUploadPincodeStore,
} from "@/app/dashboard/storeAPICall/useUserStore";
import {
  PincodeActiveListPath,
  StoreManagersPath,
  StorePath,
  BulkUploadPincodePath,
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
import { MdSave } from "react-icons/md";
import StoreSkeleton from "@/app/dashboard/components/skeleton/StoreSkeleton";

export default function AddStorePage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string[] | undefined)?.[0];
  const isEditMode = !!id;

  const [pincodes, setPincodes] = useState<any[]>([]);

  const [pincodeFile, setPincodeFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const { postData: BulkUploadPincode, loading: bulkUploadLoading } =
    BulkUploadPincodeStore();

  const formik = useFormik({
    initialValues: StoreInitialValues,
    validationSchema: StoreValidationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      alert("Dd")
      try {
        let response: any;
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
              ? ToastMessages.STORE_UPDATED
              : ToastMessages.STORE_CREATED,
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
          toast: true,
          position: "top-end",
          icon: "error",
          title: isEditMode ? ToastMessages.STORE_UPDATE_FAILED : ToastMessages.STORE_CREATE_FAILED,
          text: errorMsg,
          showConfirmButton: false,
          timer: 2000,
        });
      }
    },
  });
  console.log(formik.errors, "formik.errors");

  React.useEffect(() => {
    async function fetchPincodes() {
      try {
        const res = await axios.get(PincodeActiveListPath);
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
      formik.resetForm({
        values: {
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
          GoogleAddress: store.GoogleAddress || "",
          status: store.status ?? 1,
          adminManagerId: store.adminManagerId?._id || store.adminManagerId || "",
        },
      });
    }
  }, [storeDetailData, isEditMode]);

  const getFieldError = (fieldName: string) => {
    return formik.touched[fieldName as keyof typeof formik.touched] &&
      formik.errors[fieldName as keyof typeof formik.errors]
      ? formik.errors[fieldName as keyof typeof formik.errors]
      : null;
  };

  const handleBulkUpload = async () => {
    if (!pincodeFile) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: "Please select a file to upload",
        showConfirmButton: false,
        timer: 2000,
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", pincodeFile);

    try {
      const response = await BulkUploadPincode(BulkUploadPincodePath, formData);
      if (response?.success && response?.pinCodeArray) {
        const newPincodes = response.pinCodeArray.map((p: number) => p.toString());
        const existing = (formik.values.servicePinCodes || []) as string[];

        // Find duplicates and new pincodes
        const duplicates = newPincodes.filter((p: string) => existing.includes(p));
        const newPincodesToAdd = newPincodes.filter((p: string) => !existing.includes(p));

        // Check if all pincodes already exist
        if (duplicates.length === newPincodes.length) {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "info",
            title: "All pincodes already exist",
            text: `All ${newPincodes.length} pincodes are already in the service area.`,
            showConfirmButton: false,
            timer: 3000,
          });
          return;
        }

        // Merge all pincodes
        const merged = [...new Set([...existing, ...newPincodes])];
        formik.setFieldValue("servicePinCodes", merged);

        // Show appropriate message based on duplicates
        let toastTitle = "Pincodes uploaded successfully";
        let toastText = `Added ${newPincodesToAdd.length} new pincode(s).`;

        if (duplicates.length > 0) {
          toastTitle = "Upload completed with duplicates";
          toastText = `Added ${newPincodesToAdd.length} new pincode(s). ${duplicates.length} pincode(s) already existed.`;
        }

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: toastTitle,
          text: toastText,
          showConfirmButton: false,
          timer: 3000,
        }).then(() => {
          // Clear file input after toast closes
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          setPincodeFile(null);
        });
      } else {
        throw new Error(response?.message || "Upload failed");
      }
    } catch (err: any) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: err?.message || "Failed to upload pincodes",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  return (
    <div className="containerStyleStick  scrollbar-hide ">


      {isEditMode && storeDetailLoading ? (
        <StoreSkeleton />
      ) : (


        <form
          onSubmit={formik.handleSubmit}
          className="flex flex-col gap-8 px-8 py-8"
        >


          <div className="stikcHeader ">
            <HeaderWithAction
              title={isEditMode ? "Edit Store" : "Add Store"}
              subtitle={
                isEditMode ? "Update store details" : "Create a new store location"
              }
              showBack={true}
              showSearch={false}
              isunsaved={formik.dirty}
            />
            <div className="">

              <CustomButton
                type="submit"
                disabled={
                  formik.isSubmitting ||
                  createStoreLoading ||
                  storeDetailLoading ||
                  updateStoreLoading
                }
                width="100%"
              >
                {" "}
                <MdSave size={22} /> {isEditMode ? "Update Store" : "Add Store"}
              </CustomButton>
            </div>

          </div>
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

          <div>
            <PincodeSelect
              pincodes={pincodes}
              value={formik.values.servicePinCodes}

              onChange={(selected) =>
                formik.setFieldValue("servicePinCodes", selected)
              }
            />
            {formik.touched.servicePinCodes && formik.errors.servicePinCodes && (
              <ErrorMessageCom error={formik.errors.servicePinCodes as string} />
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setPincodeFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <CustomButton
              onClick={handleBulkUpload}
              disabled={bulkUploadLoading || !pincodeFile}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${bulkUploadLoading || !pincodeFile
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
            >
              {bulkUploadLoading ? "Uploading..." : "Bulk Upload Pincodes"}
            </CustomButton>
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
              addressValue={formik.values.GoogleAddress}
              onLocationSelect={(lat, lng) => {
                formik.setFieldValue("address.gps", `${lat},${lng}`);
              }}
              onAddressSelect={(address) => {
                formik.setFieldValue("GoogleAddress", address);
              }}
              disabled={formik.isSubmitting}
            />
            {formik.touched.address?.gps && formik.errors.address?.gps && (
              <ErrorMessageCom error={formik.errors.address.gps as string} />
            )}
          </div>

        </form>
      )}
    </div>
  );
}
