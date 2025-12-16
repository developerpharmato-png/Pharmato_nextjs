"use client";
import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";

import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

import axios from "axios";
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";

import Autocomplete from "@mui/material/Autocomplete";
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

type StoreForm = {
  name: string;
  servicePinCodes: string[];
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    gps: string;
  };
  status: number;
  adminManagerId: string;
};

export default function AddStorePage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string[] | undefined)?.[0]; // Extract from optional catch-all array
  const isEditMode = !!id;

  const [form, setForm] = useState<StoreForm>({
    name: "",
    servicePinCodes: [],
    address: {
      street: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      gps: "",
    },
    status: 1,
    adminManagerId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pincodes, setPincodes] = useState<any[]>([]);

  const {
    fetchData: GetStoreManagers,
    loading: storeManagersLoading,
    data: storeManagersData,
  } = StoreManagersStore();

  const {
    postData: CreateStore,
    loading: createStoreLoading,
  } = StoreCreateStore();

  const {
    fetchData: GetStoreById,
    loading: storeDetailLoading,
    data: storeDetailData,
  } = StoreDetailStore();

  const {
    putData: UpdateStore,
    loading: updateStoreLoading,
  } = StoreUpdateStore();

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
      setForm({
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

  const [fieldErrors, setFieldErrors] = useState<any>({});

  function validateFields() {
    const errors: any = {};
    if (!form.name.trim()) errors.name = "Store name is required";
    if (!form.servicePinCodes.length)
      errors.servicePinCodes = "Select at least one pincode";
    if (!form.address.street.trim()) errors.street = "Street is required";
    if (!form.address.city.trim()) errors.city = "City is required";
    if (!form.address.state.trim()) errors.state = "State is required";
    if (!form.address.country.trim()) errors.country = "Country is required";
    if (!form.address.pincode.trim()) errors.pincode = "Pincode is required";
    if (!form.address.gps.trim()) errors.gps = "GPS is required";
    if (form.status === null || form.status === undefined)
      errors.status = "Status is required";
    if (!form.adminManagerId)
      errors.adminManagerId = "Store Manager is required";
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setLoading(true);
    try {
      let response;
      if (isEditMode && id) {
        // PUT for edit
        response = await UpdateStore(`${StorePath}?id=${id}`, form);
      } else {
        // POST for add
        response = await CreateStore(StorePath, form);
      }

      if (response?.success) {
        setSuccess(
          isEditMode
            ? "Store updated successfully!"
            : "Store added successfully!"
        );
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
          try {
            router.push("/dashboard/store");
          } catch (e) {
            if (typeof window !== "undefined")
              window.location.href = "/dashboard/store";
          }
        }, 1000);
        setForm({
          name: "",
          servicePinCodes: [],
          address: {
            street: "",
            city: "",
            state: "",
            country: "India",
            pincode: "",
            gps: "",
          },
          status: 1,
          adminManagerId: "",
        });
        setFieldErrors({});
      } else {
        throw new Error(
          response?.message || response?.error || "Failed to add store"
        );
      }
    } catch (err: any) {
      const errorMsg =
        err?.message || err?.response?.data?.message || "Error adding store";
      setError(errorMsg);
      Swal.fire({
        icon: "error",
        title: "Error adding store",
        text: errorMsg,
      });
    }
    setLoading(false);
  }

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

      <form onSubmit={handleSubmit} className="flex flex-col gap-8 px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <TextField
              name="name"
              label="Store Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              variant="outlined"
              placeholder="Enter store name"
              error={Boolean(fieldErrors.name)}
            />
            {fieldErrors.name && <ErrorMessageCom error={fieldErrors.name} />}
          </div>
          <div>
            <FormControl
              fullWidth
              variant="outlined"
              error={Boolean(fieldErrors.adminManagerId)}
            >
              <InputLabel id="admin-manager-label">Store Manager *</InputLabel>
              <Select
                labelId="admin-manager-label"
                value={form.adminManagerId}
                onChange={(e) =>
                  setForm({ ...form, adminManagerId: e.target.value })
                }
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
            {fieldErrors.adminManagerId && (
              <ErrorMessageCom error={fieldErrors.adminManagerId} />
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div></div>
          <div>
            <PincodeSelect
              pincodes={pincodes}
              value={form.servicePinCodes}
              error={fieldErrors.servicePinCodes}
              onChange={(selected) =>
                setForm({ ...form, servicePinCodes: selected })
              }
            />
            {fieldErrors.servicePinCodes && (
              <ErrorMessageCom error={fieldErrors.servicePinCodes} />
            )}
          </div>
        </div>
        <AddressFields
          address={form.address}
          errors={fieldErrors}
          onChange={(field, value) =>
            setForm({ ...form, address: { ...form.address, [field]: value } })
          }
        />
        <div className=" flex flex-col md:flex-row gap-8 items-center">
          <div className="w-full md:w-1/2 flex justify-end items-end mt-4 md:mt-0">
            <CustomButton
              type="submit"
              disabled={loading || storeDetailLoading || updateStoreLoading}
              width="140px"
            >
              {isEditMode ? "Update" : "Add"}
            </CustomButton>
          </div>
        </div>

        {error && <ErrorMessageCom error={error} />}
      </form>
    </div>
  );
}
