"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function PincodeDashboard() {
    const [pincodes, setPincodes] = useState([]);
    const [form, setForm] = useState({ pincode: '', isActive: true });
    const [editId, setEditId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchPincodes = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/pincode');
            setPincodes(res.data.data || []);
        } catch (err) {
            setError('Failed to fetch pincodes');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPincodes();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (editId) {
                await axios.put('/api/admin/pincode', { id: editId, ...form });
            } else {
                await axios.post('/api/admin/pincode', form);
            }
            setForm({ pincode: '', isActive: true });
            setEditId(null);
            fetchPincodes();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error saving pincode');
        }
        setLoading(false);
    };

    const handleEdit = (pin: any) => {
        setForm({ pincode: pin.pincode, isActive: pin.isActive });
        setEditId(pin._id);
    };

    const handleDelete = async (id: string) => {
        setLoading(true);
        setError('');
        try {
            await axios.delete('/api/admin/pincode', { data: { id } });
            fetchPincodes();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error deleting pincode');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto min-h-[80vh] flex items-center justify-center p-0 bg-gradient-to-br from-blue-50 to-green-50">
            <div className="w-full p-8 bg-white rounded-2xl shadow-xl border border-gray-200">
                <h2 className="text-3xl font-extrabold mb-6 text-green-700 flex items-center gap-2">
                    <span>📍</span> Pincode Management
                </h2>
                <form onSubmit={handleSubmit} className="mb-8 flex flex-wrap gap-4 items-end bg-white p-4 rounded-xl shadow">
                    <input
                        type="text"
                        placeholder="Enter pincode"
                        value={form.pincode}
                        required
                        className="border-2 border-green-300 px-4 py-2 rounded-lg w-44 focus:outline-none focus:border-green-500 text-lg font-mono"
                        onChange={e => setForm({ ...form, pincode: e.target.value })}
                    />
                    <label className="flex items-center gap-2 text-lg">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={e => setForm({ ...form, isActive: e.target.checked })}
                            className="accent-green-600 w-5 h-5"
                        />
                        <span className="text-green-700">Active</span>
                    </label>
                    <button
                        type="submit"
                        className={`px-6 py-2 rounded-lg font-bold text-white transition-all ${editId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'} shadow`}
                        disabled={loading}
                    >
                        {editId ? 'Update' : 'Add'}
                    </button>
                    {editId && (
                        <button
                            type="button"
                            className="ml-2 px-6 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 font-bold text-gray-700 shadow"
                            onClick={() => { setEditId(null); setForm({ pincode: '', isActive: true }); }}
                        >
                            Cancel
                        </button>
                    )}
                </form>
                {error && <div className="text-red-600 mb-4 font-semibold">{error}</div>}
                <div className="overflow-x-auto">
                    <table className="w-full border rounded-xl shadow bg-white">
                        <thead>
                            <tr className="bg-green-100 text-green-800">
                                <th className="py-3 px-4 text-left text-lg font-bold">Pincode</th>
                                <th className="py-3 px-4 text-left text-lg font-bold">Active</th>
                                <th className="py-3 px-4 text-left text-lg font-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pincodes.map((pin: any) => (
                                <tr key={pin._id} className="border-t hover:bg-green-50 transition">
                                    <td className="py-2 px-4 font-mono text-xl text-gray-800">{pin.pincode}</td>
                                    <td className="py-2 px-4">
                                        {pin.isActive ? (
                                            <span className="inline-block px-3 py-1 rounded-full bg-green-200 text-green-800 font-semibold">Yes</span>
                                        ) : (
                                            <span className="inline-block px-3 py-1 rounded-full bg-red-200 text-red-800 font-semibold">No</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-4 flex gap-2">
                                        <button
                                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-lg font-bold shadow"
                                            onClick={() => handleEdit(pin)}
                                            disabled={loading}
                                        >Edit</button>
                                        <button
                                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-lg font-bold shadow"
                                            onClick={() => handleDelete(pin._id)}
                                            disabled={loading}
                                        >Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {loading && <div className="mt-6 text-gray-500 text-lg font-semibold">Loading...</div>}
            </div>
        </div>
    );
}
