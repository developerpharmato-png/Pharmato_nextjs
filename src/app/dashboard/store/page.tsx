
"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

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
        setEditId(null);
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
        setShowModal(true);
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
        <div className="flex justify-center items-center min-h-[80vh] bg-[#f3fff3]">
            <div className="w-full max-w-3xl p-8 rounded-2xl shadow-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-green-50">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="mb-4 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold flex items-center gap-2 shadow"
                >
                    <span className="text-xl">←</span> Back
                </button>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-4xl font-extrabold text-green-700 flex items-center gap-3">
                        <span className="inline-block text-4xl">🧃</span>
                        Store Management
                    </h2>
                    <button
                        className="px-6 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow"
                        onClick={openAddStore}
                    >
                        Add Store
                    </button>
                </div>
                <div className="bg-white rounded-xl shadow p-6">
                    <table className="w-full border rounded-lg overflow-hidden">
                        <thead className="bg-green-100">
                            <tr>
                                <th className="py-3 px-4 text-left text-lg font-bold">Name</th>
                                <th className="py-3 px-4 text-left text-lg font-bold">Service Pincodes</th>
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
                                            <button
                                                className="px-5 py-2 rounded-lg font-bold text-white bg-yellow-400 hover:bg-yellow-500 shadow"
                                                onClick={() => openEditStore(store)}
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Add/Edit Store Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-md">
                        <div className="bg-gradient-to-br from-white via-blue-50 to-green-50 rounded-xl shadow-xl w-full max-w-sm mx-auto border border-blue-100 p-3 sm:p-4 md:p-6 h-[100vh] my-auto flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-extrabold text-green-700 flex items-center gap-2 drop-shadow">
                                    <span className="inline-block text-2xl">{editId ? "✏️" : "➕"}</span>
                                    <span>{editId ? "Edit Store" : "Add Store"}</span>
                                </h3>
                                <button
                                    type="button"
                                    className="text-2xl text-red-600 hover:text-red-800 font-bold"
                                    onClick={() => setShowModal(false)}
                                    aria-label="Close"
                                >
                                    &#10006;
                                </button>
                            </div>
                            <form onSubmit={handleStoreSubmit} className="flex-1 flex flex-col justify-between">
                                <div className="mb-3">
                                    <label className="block mb-1 font-semibold text-base">Store Name</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        required
                                        className="border-2 border-green-400 px-3 py-2 rounded-lg w-full focus:outline-none focus:border-blue-500 text-base transition-all duration-200 shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 font-semibold text-base">Service Pincodes</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {pincodes.map((pin: any) => (
                                            <label key={pin._id} className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl shadow-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={form.servicePinCodes.includes(String(pin.pincode))}
                                                    onChange={(e) => {
                                                        const pinCodeStr = String(pin.pincode);
                                                        if (e.target.checked) {
                                                            setForm({
                                                                ...form,
                                                                servicePinCodes: [...form.servicePinCodes, pinCodeStr],
                                                            });
                                                        } else {
                                                            setForm({
                                                                ...form,
                                                                servicePinCodes: form.servicePinCodes.filter((p) => p !== pinCodeStr),
                                                            });
                                                        }
                                                    }}
                                                />
                                                <span className="font-mono text-blue-700 text-lg font-bold">{pin.pincode}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-1 font-semibold text-base">Address</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Street"
                                            value={form.address.street}
                                            onChange={(e) =>
                                                setForm({ ...form, address: { ...form.address, street: e.target.value } })
                                            }
                                            className="border-2 border-gray-300 px-3 py-2 rounded-xl w-full text-base focus:border-blue-400 focus:outline-none transition-all duration-200 shadow-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="City"
                                            value={form.address.city}
                                            onChange={(e) =>
                                                setForm({ ...form, address: { ...form.address, city: e.target.value } })
                                            }
                                            className="border-2 border-gray-300 px-3 py-2 rounded-xl w-full text-base focus:border-blue-400 focus:outline-none transition-all duration-200 shadow-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="State"
                                            value={form.address.state}
                                            onChange={(e) =>
                                                setForm({ ...form, address: { ...form.address, state: e.target.value } })
                                            }
                                            className="border-2 border-gray-300 px-3 py-2 rounded-xl w-full text-base focus:border-blue-400 focus:outline-none transition-all duration-200 shadow-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Country"
                                            value={form.address.country}
                                            onChange={(e) =>
                                                setForm({ ...form, address: { ...form.address, country: e.target.value } })
                                            }
                                            className="border-2 border-gray-300 px-3 py-2 rounded-xl w-full text-base focus:border-blue-400 focus:outline-none transition-all duration-200 shadow-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Pincode"
                                            value={form.address.pincode}
                                            onChange={(e) =>
                                                setForm({ ...form, address: { ...form.address, pincode: e.target.value } })
                                            }
                                            className="border-2 border-gray-300 px-3 py-2 rounded-xl w-full text-base focus:border-blue-400 focus:outline-none transition-all duration-200 shadow-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="GPS (lat,long)"
                                            value={form.address.gps}
                                            onChange={(e) =>
                                                setForm({ ...form, address: { ...form.address, gps: e.target.value } })
                                            }
                                            className="border-2 border-gray-300 px-3 py-2 rounded-xl w-full text-base focus:border-blue-400 focus:outline-none transition-all duration-200 shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-1 font-semibold text-base">Status</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}
                                        className="border-2 border-gray-300 px-3 py-2 rounded-lg w-full text-base focus:border-blue-400 focus:outline-none transition-all duration-200 shadow-sm"
                                    >
                                        <option value={1}>Active</option>
                                        <option value={0}>Inactive</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-4 mt-8">
                                    <div className="flex justify-center gap-4 mt-8 pb-2">
                                        <button
                                            type="button"
                                            className="px-6 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 font-bold text-gray-700 shadow"
                                            onClick={() => setShowModal(false)}
                                            style={{ minWidth: 100 }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow"
                                            disabled={loading}
                                            style={{ minWidth: 120 }}
                                        >
                                            {editId ? "Update Store" : "Add Store"}
                                        </button>
                                    </div>
                                </div>
                                {error && <div className="text-red-600 font-semibold mt-2">{error}</div>}
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
