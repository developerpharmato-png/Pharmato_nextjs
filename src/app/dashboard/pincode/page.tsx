"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

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
        const result = await Swal.fire({
            title: 'Delete Pincode?',
            text: 'Are you sure you want to delete this pincode?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
        });
        if (!result.isConfirmed) return;
        setLoading(true);
        setError('');
        try {
            await axios.delete('/api/admin/pincode', { data: { id } });
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Pincode deleted',
                showConfirmButton: false,
                timer: 2000
            });
            fetchPincodes();
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Delete failed',
                text: err?.response?.data?.message || 'Error deleting pincode',
            });
        }
        setLoading(false);
    };

    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-10 px-2 sm:px-6">
            <div className="w-full bg-white rounded-2xl shadow-xl p-8 sm:p-12 max-w-5xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4">
                    <div>
                        <h2 className="text-4xl font-extrabold text-gray-900 mb-1">Pincode Management</h2>
                        <p className="text-gray-500 text-base">Add, edit, and manage serviceable pincodes</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="mb-10 flex flex-wrap gap-4 items-end bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm">
                    <input
                        type="text"
                        placeholder="Enter pincode"
                        value={form.pincode}
                        required
                        className="border border-gray-300 px-4 py-3 rounded-lg w-48 focus:outline-none focus:border-green-500 text-base shadow-sm"
                        onChange={e => setForm({ ...form, pincode: e.target.value })}
                    />
                    <label className="flex items-center gap-2 text-lg">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={e => setForm({ ...form, isActive: e.target.checked })}
                            className="accent-green-600 w-5 h-5"
                        />
                        <span className="text-green-700 font-bold">Active</span>
                    </label>
                    <button
                        type="submit"
                        className={`px-8 py-3 rounded-lg font-semibold text-white transition shadow-md ${editId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-600 hover:bg-green-700'}`}
                        disabled={loading}
                    >
                        {editId ? 'Update' : 'Add'}
                    </button>
                    {editId && (
                        <button
                            type="button"
                            className="px-8 py-3 rounded-lg bg-gray-300 hover:bg-gray-400 font-semibold text-gray-700 shadow-md"
                            onClick={() => { setEditId(null); setForm({ pincode: '', isActive: true }); }}
                        >
                            Cancel
                        </button>
                    )}
                </form>
                {error && <div className="text-red-600 mb-4 font-semibold text-center text-lg">{error}</div>}
                <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
                    <table className="w-full min-w-[400px] text-base">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th className="py-4 px-6 text-left text-base font-bold">Pincode</th>
                                <th className="py-4 px-6 text-left text-base font-bold">Active</th>
                                <th className="py-4 px-6 text-left text-base font-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pincodes.map((pin: any) => (
                                <tr key={pin._id} className="border-t hover:bg-green-50 transition">
                                    <td className="py-3 px-6 font-mono text-lg text-gray-800">{pin.pincode}</td>
                                    <td className="py-3 px-6">
                                        {pin.isActive ? (
                                            <span className="inline-block px-4 py-1 rounded-full bg-green-100 text-green-800 font-semibold text-sm shadow">Yes</span>
                                        ) : (
                                            <span className="inline-block px-4 py-1 rounded-full bg-red-100 text-red-800 font-semibold text-sm shadow">No</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-6 flex gap-2">
                                        <button
                                            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold text-base shadow"
                                            onClick={() => handleEdit(pin)}
                                            disabled={loading}
                                        >Edit</button>
                                        <button
                                            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold text-base shadow"
                                            onClick={() => handleDelete(pin._id)}
                                            disabled={loading}
                                        >Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {loading && <div className="mt-8 text-green-600 text-xl font-bold text-center animate-pulse">Loading...</div>}
            </div>
        </div>
    );
}
