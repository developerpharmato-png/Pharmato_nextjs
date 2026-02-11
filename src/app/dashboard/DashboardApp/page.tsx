"use client";

import React, { useEffect, useState } from "react";
import { Pill, FileText, ShieldCheck, Plus, Eye, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type OrdersResp = {
  kpis: {
    totalOrders: number;
    completed: number;
    pending: number;
    cancelled: number;
  };
};

type InventoryResp = {
  kpis: {
    totalMedicines: number;
    lowStockMedicines: number;
    outOfStockMedicines: number;
    expiredMedicines: number;
    threshold: number;
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrdersResp | null>(null);
  const [inventory, setInventory] = useState<InventoryResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [oRes, iRes] = await Promise.all([
          fetch("/api/admin/dashboard/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ period: "month" }),
          }).then((r) => r.json()),
          fetch("/api/admin/dashboard/inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          }).then((r) => r.json()),
        ]);
        if (!mounted) return;
        if (oRes?.success) setOrders(oRes.data as OrdersResp);
        if (iRes?.success) setInventory(iRes.data as InventoryResp);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  function goToInventoryFilter(filter: Record<string, string | number>) {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => params.set(k, String(v)));
    router.push(`/dashboard/medicines?${params.toString()}`);
  }

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">
          Welcome back
        </h1>
        <p className="text-sm sm:text-base text-gray-500">
          Here's what's happening with your pharmacy today
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <button
          onClick={() => goToInventoryFilter({})}
          className="text-left bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-600 hover:shadow-md transition flex items-center justify-between gap-4"
        >
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Medicines</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-800">
              {loading ? "—" : (inventory?.kpis.totalMedicines ?? "—")}
            </p>
            <p className="text-xs text-green-600 mt-2">
              {loading ? "" : "Updated"}
            </p>
          </div>
          <div className="w-14 h-14 bg-green-50 rounded-lg flex items-center justify-center">
            <Pill className="text-3xl text-green-600" />
          </div>
        </button>

        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-600 hover:shadow-md transition flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Orders This Month</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-800">
              {loading ? "—" : (orders?.kpis.totalOrders ?? "—")}
            </p>
            <p className="text-xs text-blue-600 mt-2">
              {loading ? "" : "Monthly"}
            </p>
          </div>
          <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center">
            <FileText className="text-3xl text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-600 hover:shadow-md transition flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Low Stock Medicines</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-800">
              {loading ? "—" : (inventory?.kpis.lowStockMedicines ?? "—")}
            </p>
            <p className="text-xs text-purple-600 mt-2">
              Threshold: {loading ? "—" : (inventory?.kpis.threshold ?? "—")}
            </p>
          </div>
          <div className="w-14 h-14 bg-purple-50 rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-3xl text-purple-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg sm:text-2xl font-semibold text-gray-800 mb-4">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/medicines/new"
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition group"
          >
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white text-xl group-hover:scale-110 transition">
              <Plus />
            </div>
            <div className="ml-4">
              <p className="font-semibold text-gray-800">Add Medicine</p>
              <p className="text-xs text-gray-600">
                Add new medicine to inventory
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/prescriptions"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition group"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl group-hover:scale-110 transition">
              <Eye />
            </div>
            <div className="ml-4">
              <p className="font-semibold text-gray-800">View Prescriptions</p>
              <p className="text-xs text-gray-600">Manage prescriptions</p>
            </div>
          </Link>

          <Link
            href="/dashboard/medicines?stock=0"
            className="flex items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition group"
          >
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-white text-xl group-hover:scale-110 transition">
              <MapPin />
            </div>
            <div className="ml-4">
              <p className="font-semibold text-gray-800">Out of Stock</p>
              <p className="text-xs text-gray-600">
                View out of stock medicines
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/pincode"
            className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition group"
          >
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center text-white text-xl group-hover:scale-110 transition">
              <MapPin />
            </div>
            <div className="ml-4">
              <p className="font-semibold text-gray-800">Manage Pincodes</p>
              <p className="text-xs text-gray-600">
                Add, update, or delete pincodes
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
