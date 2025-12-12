"use client";
import React, { useState, useEffect } from "react";
import HeaderWithAction from "../../../components/HeaderWithAction";
import Swal from "sweetalert2";

// --- Type Definitions ---

type UserAddress = {
  _id: string;
  addressType?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: Record<string, any>;
  billing?: Record<string, any>;
  is_primary?: number;
  createdAt?: string;
  updatedAt?: string;
};

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

// --- Refactored Component ---

export default function AdminCustomerDetail({ id }: { id?: string }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  // Address state
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);

  // 1. Fetch Customer Details
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
    } else {
      setLoading(false);
    }
  }, [id]);

  // 2. Fetch Addresses
  useEffect(() => {
    if (id) {
      setAddressLoading(true);
      fetch(`/api/admin/customers/address/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id })
      })
        .then((res) => res.json())
        .then((data) => {
          setAddresses(data.success ? data.data : []);
          setAddressLoading(false);
        })
        .catch(() => {
          setAddresses([]);
          setAddressLoading(false);
        });
    } else {
      setAddressLoading(false);
    }
  }, [id]);


  // --- Helper Components and Functions ---

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-6">
      <div
        className="rounded-full h-8 w-8 border-2 border-gray-300 border-t-green-600 animate-spin"
        aria-label="Loading"
      />
    </div>
  );

  /**
   * Converts address object to a single, URL-safe string for Google Maps search.
   */
  const formatAddressForMap = (addressObj: Record<string, any>) => {
    if (!addressObj) return '';
    // Concatenate all defined address values
    const components = Object.values(addressObj).filter(v => v);
    return encodeURIComponent(components.join(', '));
  };
  
  // Renders Customer Details
  const CustomerDetails = () => {
    if (loading) return <LoadingSpinner />;

    if (!customer) {
      return (
        <div className="text-red-600 text-lg font-semibold mt-8">
          Customer not found.
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-md p-8 w-full mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
          Customer Details
        </h2>
        <div className="flex items-center justify-between mb-6">
          <div className="text-2xl font-bold text-gray-800 truncate">
            {/* {customer.name || "Dear User"} */}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-gray-700">
          <div>
            <span className="font-semibold">ID:</span>{" "}
            {customer._id || <span className="text-gray-400">-</span>}
          </div>
          <div>
            <span className="font-semibold">Code:</span>{" "}
            {customer.uniqueCode || <span className="text-gray-400">-</span>}
          </div>
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
    );
  };

  // Renders Customer Addresses
  const CustomerAddresses = () => {
    if (addressLoading) return <LoadingSpinner />;

    return (
      <div className="bg-white rounded-xl shadow-md p-8 w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
          Customer Addresses
        </h2>
        {addresses.length === 0 ? (
          <div className="text-gray-500 italic">
            No addresses found for this customer.
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr) => {
              const formattedQuery = formatAddressForMap(addr.address || {});
              const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${formattedQuery}`;

              // Text representation of the address for display
              const addressDisplayText = addr.address && Object.keys(addr.address).length > 0 ? (
                Object.entries(addr.address).map(([k, v]) =>
                  v ? <span key={k}>{v}, </span> : null
                )
              ) : (
                <span className="text-gray-400">No address details available</span>
              );

              return (
                <div
                  key={addr._id}
                  className="bg-gray-50 rounded-lg shadow-sm p-4 border border-gray-200"
                >
                  <div className="flex flex-wrap gap-4 items-center mb-2">
                    <span className="font-semibold text-green-700 text-xs px-2 py-1 bg-green-100 rounded">
                      {addr.addressType || "Other"}
                      {addr.is_primary ? " (Primary)" : ""}
                    </span>
                    <span className="font-semibold text-gray-800">{addr.name}</span>
                    <span className="text-gray-600 text-sm">
                      {addr.phone}
                      {addr.email && ` | ${addr.email}`}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    {/* Make the address text a link to Google Maps */}
                    {formattedQuery ? (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors flex items-center"
                        title="Click to view on Google Maps"
                      >
                        {addressDisplayText}
                        <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                      </a>
                    ) : (
                      addressDisplayText
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // --- Main Render ---

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title=" Customer "
        subtitle={"View and manage all customer details and addresses"}
        showBack={true}
        showSearch={false}
        isunsaved={false}
      />

      <div className="mt-8 space-y-8">
        <CustomerDetails />
        
        {/* Render addresses only if customer details loaded successfully */}
        {!loading && customer && <CustomerAddresses />}
      </div>
    </div>
  );
}