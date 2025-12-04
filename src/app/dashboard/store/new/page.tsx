"use client";
import React, { useState } from "react";
import HeaderWithAction from "../../components/HeaderWithAction";
import axios from "axios";
import Swal from 'sweetalert2';
import CircularProgress from '@mui/material/CircularProgress';
import AddressFields from '../AddressFields';
import PincodeSelect from '../PincodeSelect';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

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
                position: 'top-end',
                icon: 'success',
                title: 'Store added successfully!',
                showConfirmButton: false,
                timer: 2000
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
                icon: 'error',
                title: 'Error adding store',
                text: err?.response?.data?.message || 'Unknown error',
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
            <div className="w-full bg-white rounded-2xl shadow-lg p-0 mt-8 border border-gray-200">
                <div className="border-b px-8 pt-8 pb-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-green-700 mb-1">Add Store</h2>
                    <p className="text-gray-500 text-base">Fill in the details below to create a new store location.</p>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-8 px-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block mb-2 font-semibold text-base text-gray-700">Store Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className={`border px-4 py-3 rounded-xl w-full text-base transition-all duration-200 shadow-sm bg-green-50 ${fieldErrors.name ? 'border-red-400 focus:border-red-500' : 'border-green-400 focus:border-blue-500'}`}
                            />
                            {fieldErrors.name && <div className="text-red-500 text-sm mt-1">{fieldErrors.name}</div>}
                        </div>
                        <div>
                            <PincodeSelect
                                pincodes={pincodes}
                                value={form.servicePinCodes}
                                error={fieldErrors.servicePinCodes}
                                onChange={selected => setForm({ ...form, servicePinCodes: selected })}
                            />
                        </div>
                    </div>
                    <AddressFields
                        address={form.address}
                        errors={fieldErrors}
                        onChange={(field, value) => setForm({ ...form, address: { ...form.address, [field]: value } })}
                    />
                    <div className="border-t pt-8 flex flex-col md:flex-row gap-8 items-center">
                        <div className="w-full md:w-1/2">
                            <label className="block mb-2 font-semibold text-base text-gray-700">Status <span className="text-red-500">*</span></label>
                            <select
                                value={form.status}
                                onChange={e => setForm({ ...form, status: Number(e.target.value) })}
                                className={`border px-4 py-3 rounded-xl w-full text-base transition-all duration-200 shadow-sm bg-gray-50 ${fieldErrors.status ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-400'}`}
                            >
                                <option value={1}>Active</option>
                                <option value={0}>Inactive</option>
                            </select>
                            {fieldErrors.status && <div className="text-red-500 text-sm mt-1">{fieldErrors.status}</div>}
                        </div>
                        <div className="w-full md:w-1/2 flex justify-end items-end mt-4 md:mt-0">
                            <button
                                type="submit"
                                className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg text-lg transition-all duration-200 flex items-center justify-center"
                                disabled={loading}
                                style={{ minWidth: 140 }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : "Add Store"}
                            </button>
                        </div>
                    </div>
                    {error && <div className="text-red-600 font-semibold mt-2 text-center">{error}</div>}
                </form>
            </div>
        </div>
    );
}
