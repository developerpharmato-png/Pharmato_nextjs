"use client";
import React, { useState, useEffect } from "react";

import HeaderWithAction from "../../../components/HeaderWithAction";
import Swal from "sweetalert2";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import OrdersTable from "../../../orders/OrdersTable";
import WalletTable from "./WalletTable";
import { WalletListPath } from "../../../storeAPICall/API/BaseApi";
import WalletAddAmountDialog from "./WalletAddAmountDialog";
import CustomerDetailsSekelton from "@/app/dashboard/components/skeleton/CustomerDetailsSekelton";

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
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [adminPermissions, setAdminPermissions] = useState<any>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem("adminPermissions");
      if (p) setAdminPermissions(JSON.parse(p));
    } catch (e) {
      // ignore
    }
  }, []);

  const canEditCustomers = adminPermissions?.Customers?.edit ?? true;

  // Wallet state
  const [wallet, setWallet] = useState<any[]>([]);
  const [walletPage, setWalletPage] = useState(0);
  const [walletRowsPerPage, setWalletRowsPerPage] = useState(10);
  const [walletTotalCount, setWalletTotalCount] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);

  // Fetch Wallet for this customer
  useEffect(() => {
    if (id) {
      fetchWallet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, walletPage, walletRowsPerPage]);

  const fetchWallet = async () => {
    if (!id) return;
    setWalletLoading(true);
    try {
      const body = {
        userId: id,
        limit: walletRowsPerPage,
        offset: walletPage * walletRowsPerPage,
      };
      const res = await fetch(WalletListPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.status) {
        setWallet(data.data || []);
        setWalletTotalCount(data.total || (data.data ? data.data.length : 0));
      } else {
        setWallet([]);
        setWalletTotalCount(0);
      }
    } catch (error) {
      setWallet([]);
      setWalletTotalCount(0);
    } finally {
      setWalletLoading(false);
    }
  };
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  // Address state
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersRowsPerPage, setOrdersRowsPerPage] = useState(10);
  const [ordersTotalCount, setOrdersTotalCount] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // 1. Fetch Customer Details
  const fetchCustomerDetail = async () => {
    if (!id) return;
    setLoading(true);
    let mounted = true;
    try {
      const res = await fetch(`/api/admin/customers/detail/${id}`);
      const data = await res.json();
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
    } catch (err) {
      if (!mounted) return;
      setCustomer(null);
      Swal.fire({
        icon: "error",
        title: "Network error",
        text: "Unable to fetch customer details",
      });
    } finally {
      setLoading(false);
    }
    return () => {
      mounted = false;
    };
  };
  useEffect(() => {
    fetchCustomerDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 2. Fetch Addresses
  useEffect(() => {
    if (id) {
      setAddressLoading(true);
      fetch(`/api/admin/customers/address/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
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

  // 3. Fetch Orders for this customer
  useEffect(() => {
    if (id) {
      fetchOrders();
    }
  }, [id, ordersPage, ordersRowsPerPage]);

  const fetchOrders = async () => {
    if (!id) return;
    setOrdersLoading(true);
    try {
      const body = {
        limit: ordersRowsPerPage,
        offset: ordersPage * ordersRowsPerPage,
        page: ordersPage,
        customerId: id,
      };

      const res = await fetch(`/api/admin/order/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        setOrders(data.data || []);
        setOrdersTotalCount(data.total || 0);
      } else {
        setOrders([]);
        setOrdersTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
      setOrdersTotalCount(0);
    } finally {
      setOrdersLoading(false);
    }
  };

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
    if (!addressObj) return "";
    // Concatenate all defined address values
    const components = Object.values(addressObj).filter((v) => v);
    return encodeURIComponent(components.join(", "));
  };
  // Renders Customer Details
  const CustomerDetails = () => {
    if (loading) return <CustomerDetailsSekelton />;

    if (!customer) {
      return (
        <div className="text-red-600 text-lg font-semibold mt-8 p-4">
          Customer not found.
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 md:p-8 w-full mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 md:mb-6 border-b pb-2">
          Customer Details
        </h2>

        {/* Title area optimized for long names with truncate */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
            {/* {customer.name || "Dear User"} */}
          </div>
        </div>

        {/* Responsive Grid: 1 column on mobile, 2 columns on small screens and up */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 md:gap-x-8 gap-y-3 md:gap-y-4 text-gray-700 text-sm sm:text-base">
          {/* <div className="flex flex-wrap items-center gap-1">
            <span className="font-semibold">ID:</span>{" "}
            <span className="truncate max-w-full">
              {customer._id || <span className="text-gray-400">-</span>}
            </span>
          </div> */}

          <div className="flex items-center gap-1">
            <span className="font-semibold">Code:</span>{" "}
            {customer.uniqueCode || <span className="text-gray-400">-</span>}
          </div>

          <div className="flex items-center gap-1 overflow-hidden">
            <span className="font-semibold">Email:</span>{" "}
            <span className="truncate">
              {customer.email || <span className="text-gray-400">-</span>}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-semibold">Mobile:</span>{" "}
            <span>
              {customer.countryCode}{" "}
              {customer.mobile || <span className="text-gray-400">-</span>}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-semibold">Wallet:</span>{" "}
            <span className="text-green-700 font-bold">
              ₹{(customer.walletAmount ?? 0).toFixed(2)}
            </span>
          </div>

          {/* Hidden on mobile to maintain grid alignment on desktop, or simply omitted */}
          <div className="hidden sm:block"></div>
{/* 
          <div className="flex items-center gap-1">
            <span className="font-semibold">Verified:</span>{" "}
            {customer.isVerified ? (
              <span className="ml-1 text-[10px] sm:text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                Yes
              </span>
            ) : (
              <span className="ml-1 text-[10px] sm:text-xs px-2 py-1 bg-red-100 text-red-700 rounded font-medium">
                No
              </span>
            )}
          </div> */}

          <div className="flex items-center gap-1">
            <span className="font-semibold">Active:</span>{" "}
            {customer.isActive ? (
              <span className="ml-1 text-[10px] sm:text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                Active
              </span>
            ) : (
              <span className="ml-1 text-[10px] sm:text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded font-medium">
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
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 md:p-8 w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 md:mb-6 border-b pb-2">
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
              const addressDisplayText =
                addr.address && Object.keys(addr.address).length > 0 ? (
                  Object.entries(addr.address).map(([k, v]) =>
                    v ? <span key={k}>{v}, </span> : null,
                  )
                ) : (
                  <span className="text-gray-400">
                    No address details available
                  </span>
                );

              return (
                <div
                  key={addr._id}
                  className="bg-gray-50 rounded-lg shadow-sm p-3 sm:p-4 border border-gray-200"
                >
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 sm:items-center mb-3 sm:mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-green-700 text-[10px] uppercase tracking-wider px-2 py-0.5 bg-green-100 rounded">
                        {addr.addressType || "Other"}
                        {addr.is_primary ? " (Primary)" : ""}
                      </span>
                      <span className="font-bold text-gray-800 text-sm sm:text-base">
                        {addr.name}
                      </span>
                    </div>

                    <span className="text-gray-600 text-xs sm:text-sm bg-white sm:bg-transparent p-1 rounded sm:p-0 border sm:border-0 border-gray-100">
                      +91 {addr.phone}
                      {addr.email && (
                        <span className="hidden xs:inline">
                          {" "}
                          | {addr.email}
                        </span>
                      )}
                    </span>
                    {addr.email && (
                      <span className="text-gray-600 text-xs block xs:hidden">
                        {addr.email}
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-700">
                    {/* Make the address text a link to Google Maps */}
                    {formattedQuery ? (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors flex items-start"
                        title="Click to view on Google Maps"
                      >
                        <svg
                          className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                          ></path>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          ></path>
                        </svg>
                        <span className="leading-relaxed">
                          {addressDisplayText}
                        </span>
                      </a>
                    ) : (
                      <div className="flex items-start">
                        <span className="leading-relaxed">
                          {addressDisplayText}
                        </span>
                      </div>
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

  const [tabIndex, setTabIndex] = useState(0);
  return (
    <div className="containerStyle scrollbar-hide w-full p-4 md:p-6">
      <HeaderWithAction
        title=" Customer "
        subtitle={"View and manage all customer details and orders"}
        showBack={true}
        showSearch={false}
        isunsaved={false}
        addShow={tabIndex === 2 && canEditCustomers}
        handleAdd={
          tabIndex === 2 && canEditCustomers
            ? () => setShowWalletDialog(true)
            : undefined
        }
        rightNode={
          customer && (
            <div className="bg-[#e8f5e9] text-[#388e3c] font-bold text-sm md:text-[18px] rounded-lg px-3 py-2 md:px-5 md:py-2 min-w-[100px] md:min-w-[120px] text-center shadow-sm border border-[#a5d6a7] flex items-center gap-1.5 md:gap-[6px]">
              <span>Wallet:</span>
              <span className="font-black text-base md:text-[20px]">
                ₹{(customer.walletAmount ?? 0).toFixed(2)}
              </span>
            </div>
          )
        }
      />

      <Tabs selectedIndex={tabIndex} onSelect={setTabIndex} className="w-full">
        <div className="overflow-x-auto scrollbar-hide border-b border-gray-100">
          <TabList className="TabList flex whitespace-nowrap">
            <Tab className="Tab">Details</Tab>
            <Tab className="Tab">Orders</Tab>
            <Tab className="Tab">Wallet</Tab>
          </TabList>
        </div>

        <TabPanel className="TabPanel">
          <div className="mt-4 md:mt-8 flex flex-col md:flex-row gap-6 md:gap-8">
            <CustomerDetails />
            {!loading && customer && <CustomerAddresses />}
          </div>
        </TabPanel>

        <TabPanel className="TabPanel">
          <div className="w-full">
            {!loading && customer && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {/* Email */}
                  {customer.email && (
                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium truncate">
                        {customer.email}
                      </span>
                    </div>
                  )}

                  {/* Mobile */}
                  {customer.mobile && (
                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <span className="text-gray-600">Mobile:</span>
                      <span className="font-medium">
                        {customer.countryCode} {customer.mobile}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <OrdersTable
                data={orders}
                page={ordersPage}
                rowsPerPage={ordersRowsPerPage}
                totalCount={ordersTotalCount}
                onPageChange={setOrdersPage}
                onRowsPerPageChange={setOrdersRowsPerPage}
                loading={ordersLoading}
              />
            </div>
          </div>
        </TabPanel>

        <TabPanel className="TabPanel">
          <div className="w-full">
            <div className="overflow-x-auto">
              <WalletTable
                data={wallet}
                page={walletPage}
                rowsPerPage={walletRowsPerPage}
                totalCount={walletTotalCount}
                onPageChange={setWalletPage}
                onRowsPerPageChange={setWalletRowsPerPage}
                loading={walletLoading}
              />
            </div>
            {customer && (
              <WalletAddAmountDialog
                userId={customer._id}
                onSuccess={() => {
                  fetchWallet();
                  fetchCustomerDetail();
                }}
                open={showWalletDialog}
                setOpen={setShowWalletDialog}
              />
            )}
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
