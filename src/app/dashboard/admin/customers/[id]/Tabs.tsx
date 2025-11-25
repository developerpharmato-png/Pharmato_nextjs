"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

const TABS = [
    { key: "details", label: "Details" },
    { key: "address", label: "Address" },
    { key: "orders", label: "Orders" },
];

export default function AdminCustomerDetailTabs({ id }: { id?: string }) {
    const [activeTab, setActiveTab] = useState("details");

    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetch(`/api/admin/customers/detail/${id}`)
                .then(res => res.json())
                .then(data => {
                    setCustomer(data.data || null);
                    setLoading(false);
                });
        }
    }, [id]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-8">
            <button
                onClick={() => window.history.back()}
                className="mb-6 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg shadow inline-flex items-center gap-2 transition-all duration-150"
            >
                <span className="text-lg">←</span> Back
            </button>
            <h1 className="text-3xl font-extrabold text-green-700 mb-6 flex items-center gap-2">
                Admin: Customer Detail <span>🧑‍💼</span>
            </h1>
            <div className="mb-8 flex gap-6 border-b pb-2">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        className={`px-4 py-2 font-semibold rounded-t-lg transition-all duration-150 ${activeTab === tab.key ? "bg-green-100 text-green-700 border-b-2 border-green-600" : "bg-white text-gray-600"}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="mt-4">
                {activeTab === "details" && (
                    loading ? (
                        <div className="flex items-center gap-2 text-lg text-gray-600 animate-pulse">
                            <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></span>
                            Loading customer details...
                        </div>
                    ) : customer ? (
                        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-3xl mx-auto animate-fade-in flex flex-col items-center justify-center">
                            <div className="flex items-center gap-4 mb-8">
                                <span className="text-4xl">🧑‍💼</span>
                                <span className="text-2xl font-bold text-green-700">{customer.name || '-'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-gray-700 w-full">
                                <div><span className="font-semibold">Email:</span> {customer.email || <span className="text-gray-400">-</span>}</div>
                                <div><span className="font-semibold">Mobile:</span> {customer.mobile || <span className="text-gray-400">-</span>}</div>
                                <div><span className="font-semibold">Wallet:</span> <span className="text-green-700 font-bold">₹{customer.walletAmount ?? 0}</span></div>
                                <div><span className="font-semibold">Country Code:</span> {customer.countryCode || <span className="text-gray-400">-</span>}</div>
                                <div><span className="font-semibold">Verified:</span> {customer.isVerified ? <span className="text-green-600 font-semibold">Yes</span> : <span className="text-red-600 font-semibold">No</span>}</div>
                                <div><span className="font-semibold">User ID:</span> <span className="font-mono text-xs">{customer._id}</span></div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-red-600 text-lg font-semibold mt-8">Customer not found.</div>
                    )
                )}
                {activeTab === "address" && (
                    <div>{/* Address UI here */}</div>
                )}
                {activeTab === "orders" && (
                    <div>{/* Orders UI here */}</div>
                )}
            </div>
        </div>
    );
}
