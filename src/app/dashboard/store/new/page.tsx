"use client";
import React, { useState } from "react";
import { CustomButton, ErrorMessageCom } from "../../components/miniComponents";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import HeaderWithAction from "../../components/HeaderWithAction";
import axios from "axios";
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";
import AddressFields from "../AddressFields";
import PincodeSelect from "../PincodeSelect";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

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
};

export default function AddStorePage() {
  const [form, setForm] = useState<StoreForm>({
    name: "",
    servicePinCodes: [],
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
      gps: "",
    },
    status: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pincodes, setPincodes] = useState<any[]>([]);

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
      await axios.post("/api/admin/store", form);
      setSuccess("Store added successfully!");
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Store added successfully!",
        showConfirmButton: false,
        timer: 2000,
      });
      setForm({
        name: "",
        servicePinCodes: [],
        address: {
          street: "",
          city: "",
          state: "",
          country: "",
          pincode: "",
          gps: "",
        },
        status: 1,
      });
      setFieldErrors({});
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error adding store");
      Swal.fire({
        icon: "error",
        title: "Error adding store",
        text: err?.response?.data?.message || "Unknown error",
      });
    }
    setLoading(false);
  }

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Add Store"
        subtitle="Create a new store location"
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
              InputProps={{
                style: {
                  borderRadius: "0.75rem",
                  background: "#f0fdf4",
                },
              }}
            />
            {fieldErrors.name && <ErrorMessageCom error={fieldErrors.name} />}
          </div>
          <div>
            <PincodeSelect
              pincodes={pincodes}
              value={form.servicePinCodes}
              error={fieldErrors.servicePinCodes}
              onChange={(selected) =>
                setForm({ ...form, servicePinCodes: selected })
              }
            />
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
          <div className="w-full md:w-1/2">
            <FormControl fullWidth variant="outlined">
              <InputLabel id="status-label">Status *</InputLabel>
              <Select
                labelId="status-label"
                name="status"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: Number(e.target.value) })
                }
                label="Status *"
                error={Boolean(fieldErrors.status)}
                sx={{ borderRadius: 3, background: "#f3f4f6" }}
              >
                <MenuItem value={1}>Active</MenuItem>
                <MenuItem value={0}>Inactive</MenuItem>
              </Select>
            </FormControl>
            {fieldErrors.status && (
              <ErrorMessageCom error={fieldErrors.status} />
            )}
          </div>
          <div className="w-full md:w-1/2 flex justify-end items-end mt-4 md:mt-0">
            <CustomButton
              type="submit"
              disabled={loading}
              width="140px"
            >
              Add
            </CustomButton>
          </div>
        </div>
        {error && <ErrorMessageCom error={error} />}
      </form>
    </div>
  );
}
