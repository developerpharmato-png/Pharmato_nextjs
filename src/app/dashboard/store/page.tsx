
"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import HeaderWithAction from "../components/HeaderWithAction";

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

export default function StoreDashboard() {
    const [stores, setStores] = useState<any[]>([]);
    const [pincodes, setPincodes] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
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
    const [editId, setEditId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchStores();
        fetchPincodes();
    }, []);

    async function fetchStores() {
        setLoading(true);
        setError("");
        try {
            const res = await axios.get("/api/admin/store");
            setStores(res.data.data || []);
        } catch {
            setError("Failed to fetch stores");
        }
        setLoading(false);
    }

    async function fetchPincodes() {
        try {
            const res = await axios.get("/api/admin/pincode");
            setPincodes(res.data.data || []);
        } catch {
            setError("Failed to fetch pincodes");
        }
    }

    async function handleStoreSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            if (editId) {
                await axios.put(`/api/admin/store?id=${editId}`, form);
            } else {
                await axios.post("/api/admin/store", form);
            }
            setShowModal(false);
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
            setEditId(null);
            fetchStores();
        } catch (err: any) {
            setError(
                err?.response?.data?.message || (editId ? "Error updating store" : "Error adding store")
            );
        }
        setLoading(false);
    }

    function openAddStore() {
        window.location.href = "/dashboard/store/new";
    }

    function openEditStore(store: any) {
        setEditId(store._id);
        setForm({
            name: store.name,
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
        setShowModal(true);
    }

    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-10 px-2 sm:px-6">
            <HeaderWithAction
                title="Stores"
                subtitle="Manage your store locations and service pincodes"
                showBack={false}
                showSearch={false}
            />
            <div className="flex items-center mb-6 justify-end gap-3 w-full">
                <button
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2"
                    onClick={openAddStore}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m4-4H8" />
                    </svg>
                    Add Store
                </button>
            </div>
            <div className="w-full bg-white rounded-lg shadow-md p-8">
                <table className="w-full border rounded-lg overflow-hidden">
                    <thead className="bg-green-100">
                        <tr>
                            <th className="py-3 px-4 text-left text-lg font-bold">Name</th>
                            <th className="py-3 px-4 text-left text-lg font-bold">Service PinCodes</th>
                            <th className="py-3 px-4 text-left text-lg font-bold">Status</th>
                            <th className="py-3 px-4 text-left text-lg font-bold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stores.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-6 text-gray-500">No stores found.</td>
                            </tr>
                        ) : (
                            stores.map((store) => (
                                <tr key={store._id} className="border-b">
                                    <td className="py-3 px-4 font-semibold">{store.name}</td>
                                    <td className="py-3 px-4">
                                        {store.servicePinCodes?.map((pin: string) => (
                                            <span key={pin} className="inline-block bg-blue-100 text-blue-700 font-bold px-4 py-1 rounded-full mr-2 text-lg">
                                                {pin}
                                            </span>
                                        ))}
                                    </td>
                                    <td className="py-3 px-4">
                                        {store.status === 1 ? (
                                            <span className="inline-block bg-green-100 text-green-700 font-bold px-4 py-1 rounded-full text-lg">Active</span>
                                        ) : (
                                            <span className="inline-block bg-gray-200 text-gray-600 font-bold px-4 py-1 rounded-full text-lg">Inactive</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <Link
                                            href={`/dashboard/store/edit/${store._id}`}
                                            className="px-5 py-2 rounded-lg font-bold text-white bg-yellow-400 hover:bg-yellow-500 shadow"
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
