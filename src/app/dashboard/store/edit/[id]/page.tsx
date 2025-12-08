"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import HeaderWithAction from "../../../components/HeaderWithAction";
import CircularProgress from "@mui/material/CircularProgress";
import { CustomButton, ErrorMessageCom } from "../../../components/miniComponents";
import { FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import Swal from "sweetalert2";
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
};

export default function EditStorePage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
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
    const [pincodes, setPincodes] = useState<any[]>([]);
    const [fieldErrors, setFieldErrors] = useState<any>({});

    useEffect(() => {
        if (id) fetchStore();
        fetchPincodes();
    }, [id]);

    async function fetchStore() {
        setLoading(true);
        try {
            const res = await axios.get(`/api/admin/store/${id}`);
            const store = res.data.data;
            setForm({
                name: store.name || "",
                servicePinCodes: store.servicePinCodes || [],
                address: store.address || {
                    street: "",
                    city: "",
                    state: "",
                    country: "",
                    pincode: "",
                    gps: "",
                },
                status: store.status ?? 1,
            });
        } catch {
            Swal.fire({
                icon: 'error',
                title: 'Failed to fetch store',
                text: 'Store not found',
            });
            router.push("/dashboard/store");
        }
        setLoading(false);
    }

    async function fetchPincodes() {
        try {
            const res = await axios.get("/api/admin/pincode");
            setPincodes(res.data.data || []);
        } catch {
            setPincodes([]);
        }
    }

    function validateFields() {
        const errors: any = {};
        if (!form.name.trim()) errors.name = "Store name is required";
        if (!form.servicePinCodes.length) errors.servicePinCodes = "Select at least one pincode";
        if (!form.address.street.trim()) errors.street = "Street is required";
        if (!form.address.city.trim()) errors.city = "City is required";
        if (!form.address.state.trim()) errors.state = "State is required";
        if (!form.address.country.trim()) errors.country = "Country is required";
        if (!form.address.pincode.trim()) errors.pincode = "Pincode is required";
        if (!form.address.gps.trim()) errors.gps = "GPS is required";
        if (form.status === null || form.status === undefined) errors.status = "Status is required";
        return errors;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFieldErrors({});
        const errors = validateFields();
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;
        setLoading(true);
        try {
            await axios.put(`/api/admin/store?id=${id}`, form);
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Store updated successfully!',
                showConfirmButton: false,
                timer: 2000
            });
            router.push("/dashboard/store");
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error updating store',
                text: err?.response?.data?.message || 'Unknown error',
            });
        }
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <CircularProgress />
            </div>
        );
    }

    return (
        <div className="containerStyle scrollbar-hide">
            <HeaderWithAction
                title="Edit Store"
                subtitle="Update store details"
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
                                onChange={e => setForm({ ...form, name: e.target.value })}
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
                                onChange={selected => setForm({ ...form, servicePinCodes: selected })}
                            />
                            {fieldErrors.servicePinCodes && <ErrorMessageCom error={fieldErrors.servicePinCodes} />}
                        </div>
                    </div>
                    <AddressFields  
                        address={form.address}
                        errors={fieldErrors}
                        onChange={(field, value) => setForm({ ...form, address: { ...form.address, [field]: value } })}
                    />
                    <div className=" pt-8 flex flex-col md:flex-row gap-8 items-center">
                        <div className="w-full md:w-1/2">
                            <FormControl fullWidth variant="outlined">
                                <InputLabel id="status-label">Status *</InputLabel>
                                <Select
                                    labelId="status-label"
                                    name="status"
                                    value={form.status}
                                    onChange={e => setForm({ ...form, status: Number(e.target.value) })}
                                    label="Status *"
                                    error={Boolean(fieldErrors.status)}
                                    sx={{ borderRadius: 3, background: "#f3f4f6" }}
                                >
                                    <MenuItem value={1}>Active</MenuItem>
                                    <MenuItem value={0}>Inactive</MenuItem>
                                </Select>
                            </FormControl>
                            {fieldErrors.status && <ErrorMessageCom error={fieldErrors.status} />}
                        </div>
                        <div className="w-full md:w-1/2 flex justify-end items-end mt-4 md:mt-0">
                            <CustomButton
                                type="submit"
                                disabled={loading}
                                width="140px"
                            >Update</CustomButton>
                        </div>
                    </div>
                </form>
           
        </div>
    );
}
