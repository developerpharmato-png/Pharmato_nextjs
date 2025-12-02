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
        <div className="w-full min-h-screen bg-gray-50 py-8 px-2 sm:px-6">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6 sm:p-8">
                <h2 className="text-3xl font-bold mb-8 text-gray-900">Pincode Management</h2>
                <form onSubmit={handleSubmit} className="mb-8 flex flex-wrap gap-4 items-end bg-gray-50 p-6 rounded-lg border border-gray-100">
                    <input
                        type="text"
                        placeholder="Enter pincode"
                        value={form.pincode}
                        required
                        className="border border-gray-300 px-4 py-2 rounded w-48 focus:outline-none focus:border-green-500 text-base"
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
                        className={`px-6 py-2 rounded font-semibold text-white transition ${editId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                        disabled={loading}
                    >
                        {editId ? 'Update' : 'Add'}
                    </button>
                    {editId && (
                        <button
                            type="button"
                            className="px-6 py-2 rounded bg-gray-300 hover:bg-gray-400 font-semibold text-gray-700"
                            onClick={() => { setEditId(null); setForm({ pincode: '', isActive: true }); }}
                        >
                            Cancel
                        </button>
                    )}
                </form>
                {error && <div className="text-red-600 mb-4 font-semibold">{error}</div>}
                <div className="overflow-x-auto">
                    <table className="w-full border rounded-lg bg-white">
                        <thead>
                            <tr className="bg-gray-50 text-gray-700">
                                <th className="py-3 px-4 text-left text-sm font-semibold">Pincode</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold">Active</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pincodes.map((pin: any) => (
                                <tr key={pin._id} className="border-t hover:bg-gray-50 transition">
                                    <td className="py-2 px-4 font-mono text-base text-gray-800">{pin.pincode}</td>
                                    <td className="py-2 px-4">
                                        {pin.isActive ? (
                                            <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium text-xs">Yes</span>
                                        ) : (
                                            <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-800 font-medium text-xs">No</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-4 flex gap-2">
                                        <button
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded font-medium text-sm"
                                            onClick={() => handleEdit(pin)}
                                            disabled={loading}
                                        >Edit</button>
                                        <button
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded font-medium text-sm"
                                            onClick={() => handleDelete(pin._id)}
                                            disabled={loading}
                                        >Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {loading && <div className="mt-6 text-blue-500 text-lg font-bold">Loading...</div>}
            </div>
        </div>
    );
}
