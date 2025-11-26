"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function StoreDashboard() {
    const [stores, setStores] = useState([]);
    const [pincodes, setPincodes] = useState([]);
    const [showModal, setShowModal] = useState(false);
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
    const [form, setForm] = useState<StoreForm>({
        name: '',
        servicePinCodes: [],
        address: {
            street: '',
            city: '',
            state: '',
            country: '',
            pincode: '',
            gps: ''
        },
        status: 1
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editId, setEditId] = useState<string | null>(null);

    const fetchStores = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/store');
            setStores(res.data.data || []);
        } catch (err) {
            setError('Failed to fetch stores');
        }
        setLoading(false);
    };

    const fetchPincodes = async () => {
        try {
            const res = await axios.get('/api/admin/pincode');
            setPincodes(res.data.data || []);
        } catch (err) {
            setError('Failed to fetch pincodes');
        }
    };

    useEffect(() => {
        fetchStores();
        fetchPincodes();
    }, []);

    const handleAddStore = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (editId) {
                await axios.put(`/api/admin/store?id=${editId}`, form);
            } else {
                await axios.post('/api/admin/store', form);
            }
            setShowModal(false);
            setForm({
                name: '',
                servicePinCodes: [],
                address: {
                    street: '',
                    city: '',
                    state: '',
                    country: '',
                    pincode: '',
                    gps: ''
                },
                status: 1
            });
            setEditId(null);
            fetchStores();
        } catch (err: any) {
            setError(err?.response?.data?.message || (editId ? 'Error updating store' : 'Error adding store'));
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto mt-10 p-8 bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl shadow-xl border border-gray-200">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-extrabold text-green-700 flex items-center gap-2">
                    <span>🏬</span> Store Management
                </h2>
                <button
                    className="px-6 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow"
                    onClick={() => {
                        setEditId(null);
                        setForm({
                            name: '',
                            servicePinCodes: [],
                            address: {
                                street: '',
                                city: '',
                                state: '',
                                country: '',
                                pincode: '',
                                gps: ''
                            },
                            status: 1
                        });
                        setShowModal(true);
                    }}
                >
                    Add Store
                </button>
            </div>
            {error && <div className="text-red-600 mb-4 font-semibold">{error}</div>}
            <div className="overflow-x-auto mb-8">
                <table className="w-full border rounded-xl shadow bg-white">
                    <thead>
                        <tr className="bg-green-100 text-green-800">
                            <th className="py-3 px-4 text-left text-lg font-bold">Name</th>
                            <th className="py-3 px-4 text-left text-lg font-bold">Service Pincodes</th>
                            <th className="py-3 px-4 text-left text-lg font-bold">Status</th>
                            <th className="py-3 px-4 text-left text-lg font-bold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stores.map((store: any) => (
                            <tr key={store._id} className="border-t hover:bg-green-50 transition">
                                <td className="py-2 px-4 font-semibold text-gray-800">{store.name}</td>
                                <td className="py-2 px-4">
                                    {store.servicePinCodes?.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {store.servicePinCodes.map((pin: string) => (
                                                <span key={pin} className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">{pin}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">None</span>
                                    )}
                                </td>
                                <td className="py-2 px-4">
                                    {store.status === 1 ? (
                                        <span className="inline-block px-3 py-1 rounded-full bg-green-200 text-green-800 font-semibold">Active</span>
                                    ) : (
                                        <span className="inline-block px-3 py-1 rounded-full bg-red-200 text-red-800 font-semibold">Inactive</span>
                                    )}
                                </td>
                                <td className="py-2 px-4">
                                    <button
                                        className="px-4 py-1 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-white font-bold shadow mr-2"
                                        onClick={() => {
                                            setForm({
                                                name: store.name,
                                                servicePinCodes: store.servicePinCodes || [],
                                                address: {
                                                    street: store.address?.street || '',
                                                    city: store.address?.city || '',
                                                    state: store.address?.state || '',
                                                    country: store.address?.country || '',
                                                    pincode: store.address?.pincode || '',
                                                    gps: store.address?.gps || ''
                                                },
                                                status: store.status
                                            });
                                            setEditId(store._id);
                                            setShowModal(true);
                                        }}
                                    >Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Add Store Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
                        <h3 className="text-2xl font-bold mb-6 text-green-700 flex items-center gap-2">
                            <span>{editId ? '✏️' : '➕'}</span> {editId ? 'Edit Store' : 'Add Store'}
                        </h3>
                        <form onSubmit={handleAddStore} className="space-y-4">
                            <div>
                                <label className="block mb-1 font-semibold">Store Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    required
                                    className="border-2 border-green-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:border-green-500 text-lg"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 font-semibold">Service Pincodes</label>
                                <div className="flex flex-wrap gap-2">
                                    {pincodes.map((pin: any) => (
                                        <label key={pin._id} className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg">
                                            <input
                                                type="checkbox"
                                                checked={form.servicePinCodes.includes(String(pin.pincode))}
                                                onChange={e => {
                                                    const pinCodeStr = String(pin.pincode);
                                                    if (e.target.checked) {
                                                        setForm({ ...form, servicePinCodes: [...form.servicePinCodes, pinCodeStr] });
                                                    } else {
                                                        setForm({ ...form, servicePinCodes: form.servicePinCodes.filter((p: string) => p !== pinCodeStr) });
                                                    }
                                                }}
                                            />
                                            <span className="font-mono text-blue-700">{pin.pincode}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 font-semibold">Address</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Street"
                                        value={form.address.street}
                                        onChange={e => setForm({ ...form, address: { ...form.address, street: e.target.value } })}
                                        className="border px-3 py-2 rounded-lg w-full"
                                    />
                                    <input
                                        type="text"
                                        placeholder="City"
                                        value={form.address.city}
                                        onChange={e => setForm({ ...form, address: { ...form.address, city: e.target.value } })}
                                        className="border px-3 py-2 rounded-lg w-full"
                                    />
                                    <input
                                        type="text"
                                        placeholder="State"
                                        value={form.address.state}
                                        onChange={e => setForm({ ...form, address: { ...form.address, state: e.target.value } })}
                                        className="border px-3 py-2 rounded-lg w-full"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Country"
                                        value={form.address.country}
                                        onChange={e => setForm({ ...form, address: { ...form.address, country: e.target.value } })}
                                        className="border px-3 py-2 rounded-lg w-full"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Pincode"
                                        value={form.address.pincode}
                                        onChange={e => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })}
                                        className="border px-3 py-2 rounded-lg w-full"
                                    />
                                    <input
                                        type="text"
                                        placeholder="GPS (lat,long)"
                                        value={form.address.gps}
                                        onChange={e => setForm({ ...form, address: { ...form.address, gps: e.target.value } })}
                                        className="border px-3 py-2 rounded-lg w-full"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 font-semibold">Status</label>
                                <select
                                    value={form.status}
                                    onChange={e => setForm({ ...form, status: Number(e.target.value) })}
                                    className="border px-3 py-2 rounded-lg w-full"
                                >
                                    <option value={1}>Active</option>
                                    <option value={0}>Inactive</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-4 mt-6">
                                <button
                                    type="button"
                                    className="px-6 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 font-bold text-gray-700 shadow"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditId(null);
                                        setForm({
                                            name: '',
                                            servicePinCodes: [],
                                            address: {
                                                street: '',
                                                city: '',
                                                state: '',
                                                country: '',
                                                pincode: '',
                                                gps: ''
                                            },
                                            status: 1
                                        });
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow"
                                    disabled={loading}
                                >
                                    {editId ? 'Update Store' : 'Add Store'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {loading && <div className="mt-6 text-gray-500 text-lg font-semibold">Loading...</div>}
        </div>
    );
}
