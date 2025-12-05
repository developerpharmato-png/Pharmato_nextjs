"use client";
import React, { useState, useEffect } from "react";
import HeaderWithAction from "../../../components/HeaderWithAction";
import Swal from "sweetalert2";

type Customer = {
  _id: string;
  uniqueCode?: string;
  name?: string;
  email?: string;
  mobile?: string;
  countryCode?: string;
  walletAmount?: number;
  isVerified?: boolean;
  isActive?: boolean;
};

const TABS = [
  { key: "details", label: "Details" },
  { key: "address", label: "Address" },
  { key: "orders", label: "Orders" },
];

export default function AdminCustomerDetailTabs({ id }: { id?: string }) {
  const [activeTab, setActiveTab] = useState("details");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      let mounted = true;
      fetch(`/api/admin/customers/detail/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (!mounted) return;
          if (data?.success) {
            setCustomer(data.data || null);
          } else {
            setCustomer(null);
            Swal.fire({
              icon: "error",
              title: "Load failed",
              text: data?.message || "Failed to fetch customer",
            });
          }
          setLoading(false);
        })
        .catch((err) => {
          if (!mounted) return;
          setLoading(false);
          setCustomer(null);
          Swal.fire({
            icon: "error",
            title: "Network error",
            text: "Unable to fetch customer details",
          });
        });
      return () => {
        mounted = false;
      };
    }
  }, [id]);

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Admin: Customer Detail"
        subtitle={"View and manage customer details"}
        showBack={true}
        showSearch={false}
      />

      <div
        className="mb-8 flex gap-6 border-b pb-2"
        role="tablist"
        aria-label="Customer detail tabs"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-semibold rounded-t-lg transition ${
              activeTab === tab.key
                ? "text-green-700 border-b-2 border-green-600"
                : "text-gray-600"
            }`}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {activeTab === "details" &&
          (loading ? (
            <div className="flex items-center justify-center py-6">
              <div
                className="rounded-full h-8 w-8 border-2 border-gray-300 border-t-green-600 animate-spin"
                aria-label="Loading"
              />
            </div>
          ) : customer ? (
            <div className="bg-white rounded-xl shadow-md p-8 w-full">
              <div className="flex items-center justify-between mb-6">
                <div className="text-2xl font-bold text-gray-800 truncate">
                  {customer.name || "Dear User"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-gray-700">
                <div>
                  <span className="font-semibold">Email:</span>{" "}
                  {customer.email || <span className="text-gray-400">-</span>}
                </div>
                <div>
                  <span className="font-semibold">Mobile:</span>{" "}
                  {customer.mobile || <span className="text-gray-400">-</span>}
                </div>
                <div>
                  <span className="font-semibold">Wallet:</span>{" "}
                  <span className="text-green-700 font-bold">
                    ₹{(customer.walletAmount ?? 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Country Code:</span>{" "}
                  {customer.countryCode || (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
                <div>
                  <span className="font-semibold">Verified:</span>{" "}
                  {customer.isVerified ? (
                    <span className="ml-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                      Yes
                    </span>
                  ) : (
                    <span className="ml-1 text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                      No
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-semibold">Active:</span>{" "}
                  {customer.isActive ? (
                    <span className="ml-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                      Active
                    </span>
                  ) : (
                    <span className="ml-1 text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-red-600 text-lg font-semibold mt-8">
              Customer not found.
            </div>
          ))}
        {activeTab === "address" && <div>{/* Address UI here */}</div>}
        {activeTab === "orders" && <div>{/* Orders UI here */}</div>}
      </div>
    </div>
  );
}
