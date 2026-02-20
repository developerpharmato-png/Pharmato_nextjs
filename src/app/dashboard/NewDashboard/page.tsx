"use client";
import React from "react";
// Update your existing import to include ArrowUpRight
import {
  ShoppingCart,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  TrendingDown,
  Box,
  AlertCircle,
  DollarSign,
  Calendar,
  TrendingUp,
  ArrowUpRight, // <--- Add this
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import HeaderWithAction from "../components/HeaderWithAction";
import {
  OrderExportStore,
  MedicinesExportStore,
  DashboardOrdersStore,
  DashboardInventoryStore,
  DashboardRevenueStore,
} from "../storeAPICall/useUserStore";
import {
  OrderExportPath,
  MedicinesExportPath,
  DashboardOrdersPath,
  DashboardInventoryPath,
  DashboardRevenuePath,
} from "../storeAPICall/API/BaseApi";

export default function NewDashboardPage() {
  // state + controls
  const [period, setPeriod] = React.useState<
    "today" | "week" | "month" | "year" | "all" | "custom"
  >("all");
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [ordersData, setOrdersData] = React.useState<any>(null);
  const [inventoryData, setInventoryData] = React.useState<any>(null);
  const [revenueData, setRevenueData] = React.useState<any>(null);

  const [exportOrdersLoading, setExportOrdersLoading] = React.useState(false);
  const [exportInventoryLoading, setExportInventoryLoading] =
    React.useState(false);

  // Store hooks for exports
  const { postData: orderExport } = OrderExportStore();
  const { postData: inventoryExport } = MedicinesExportStore();

  // Store hooks for dashboard APIs
  const {
    postData: fetchDashboardOrders,
    data: ordersStoreData,
    loading: ordersLoading,
  } = DashboardOrdersStore();
  const {
    postData: fetchDashboardInventory,
    data: inventoryStoreData,
    loading: inventoryLoading,
  } = DashboardInventoryStore();
  const {
    postData: fetchDashboardRevenue,
    data: revenueStoreData,
    loading: revenueLoading,
  } = DashboardRevenueStore();

  async function fetchAll() {
    const body: any =
      period === "custom" && startDate && endDate
        ? { startDate, endDate }
        : { period };

    fetchDashboardOrders(DashboardOrdersPath, body);
    fetchDashboardInventory(DashboardInventoryPath, {});
    fetchDashboardRevenue(DashboardRevenuePath, body);
  }

  React.useEffect(() => {
    if (ordersStoreData?.success) setOrdersData(ordersStoreData.data);
    if (inventoryStoreData?.success) setInventoryData(inventoryStoreData.data);
    if (revenueStoreData?.success) setRevenueData(revenueStoreData.data);
  }, [ordersStoreData, inventoryStoreData, revenueStoreData]);

  React.useEffect(() => {
    setLoading(ordersLoading || inventoryLoading || revenueLoading);
  }, [ordersLoading, inventoryLoading, revenueLoading]);

  React.useEffect(() => {
    fetchAll();
  }, [period, startDate, endDate]);

  async function exportOrders() {
    setExportOrdersLoading(true);
    try {
      const body: any =
        period === "custom" && startDate && endDate
          ? { startDate, endDate }
          : { period };
      const response = await orderExport(OrderExportPath, body);
      if (response instanceof Blob) {
        const url = URL.createObjectURL(response);
        const a = document.createElement("a");
        a.href = url;
        a.download = `orders_export_${Date.now()}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Export orders error", e);
      alert("Failed to export orders");
    } finally {
      setExportOrdersLoading(false);
    }
  }

  async function exportInventory() {
    setExportInventoryLoading(true);
    try {
      const response = await inventoryExport(MedicinesExportPath, {});
      if (response instanceof Blob) {
        const url = URL.createObjectURL(response);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inventory_export_${Date.now()}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Export inventory error", e);
      alert("Failed to export inventory");
    } finally {
      setExportInventoryLoading(false);
    }
  }

  // Skeleton loader component
  function SkeletonLoader() {
    return <div className="bg-gray-200 animate-pulse h-32 rounded" />;
  }

  // Empty state component
  function EmptyState(props: { title: string; message: string }) {
    return (
      <div className="bg-gray-50 p-8 rounded-lg text-center">
        <p className="text-gray-600 font-semibold">{props.title}</p>
        <p className="text-gray-500 text-sm">{props.message}</p>
      </div>
    );
  }

  return (
    <div className="containerStyle scrollbar-hide">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <HeaderWithAction
          title="Pharmacy  Dashboard
"
          subtitle="Monitor your pharmacy's vital signs: performance, inventory health, and revenue trends.


 "
          backLabel="Back"
          addLabel="Add "
          showBack={false}
          showSearch={false}
        />
        <div className="flex -wrap items-center gap-2">
          <button
            onClick={() => exportOrders()}
            disabled={exportOrdersLoading}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            {exportOrdersLoading && (
              <div className="w-4 h-4 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
            )}
            {exportOrdersLoading ? "Exporting..." : "Export Orders"}
          </button>
          <button
            onClick={() => exportInventory()}
            disabled={exportInventoryLoading}
            className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            {exportInventoryLoading && (
              <div className="w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
            )}
            {exportInventoryLoading ? "Exporting..." : "Export Inventory"}
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="today">Today</option>
             
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
              {/* <option value="custom">Custom Range</option> */}
            </select>
          </div>

          {period === "custom" && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="text-slate-400">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchAll()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all shadow-md active:scale-95"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Analytics & Charts Section */}
      <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
              Orders Volume Trend
            </h2>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
              Orders Volume Trend
            </h3>
            <div className="h-[300px] w-full">
              {loading ? (
                <SkeletonLoader />
              ) : ordersData?.trend?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={ordersData.trend}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={4}
                      dot={{
                        r: 4,
                        fill: "#3b82f6",
                        strokeWidth: 2,
                        stroke: "#fff",
                      }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="No Data Found"
                  message="Try adjusting your filters"
                />
              )}
            </div>
          </div>

          {/* Pie Chart Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
              Order Status
            </h3>
            <div className="h-[300px] w-full">
              {loading ? (
                <SkeletonLoader />
              ) : ordersData?.statusCounts?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ordersData.statusCounts.map((s: any) => ({
                        name: s._id || "Unknown",
                        value: s.count,
                      }))}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        "#10b981",
                        "#f59e0b",
                        "#ef4444",
                        "#f97316",
                        "#3b82f6",
                      ].map((color, idx) => (
                        <Cell key={`cell-${idx}`} fill={color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      iconType="circle"
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="No Orders"
                  message="Stats will appear here"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Orders KPI Cards */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
          Order Performance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: "Total Orders",
              value: ordersData?.kpis?.totalOrders,
              icon: <ShoppingCart size={24} />,
              color: "blue",
            },
            {
              label: "Confirmed",
              value:
                ordersData?.kpis?.ordersConfirmed ||
                ordersData?.kpis?.confirmed,
              icon: <CheckCircle size={24} />,
              color: "emerald",
            },
            {
              label: "Pending",
              value:
                ordersData?.kpis?.ordersPending || ordersData?.kpis?.pending,
              icon: <Clock size={24} />,
              color: "amber",
            },
            {
              label: "Cancelled",
              value:
                ordersData?.kpis?.ordersCancelled ||
                ordersData?.kpis?.cancelled,
              icon: <XCircle size={24} />,
              color: "rose",
            },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={() =>
                (window.location.href = `/dashboard/orders?filter=${encodeURIComponent(stat.label)}`)
              }
              className="group relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left"
            >
              <div
                className={`mb-4 w-12 h-12 flex items-center justify-center rounded-xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`}
              >
                {stat.icon}
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">
                {stat.label}
              </p>
              <p className="text-3xl font-extrabold text-slate-900">
                {loading ? "—" : (stat.value ?? 0)}
              </p>
              <div className="absolute top-4 right-4 text-slate-300 group-hover:text-blue-500 transition-colors">
                <ArrowUpRight size={20} />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Inventory Health Full Width Chart */}

      <section className="mb-10">
        <div className="mt-6 bg-white/70 backdrop-blur-md rounded-3xl shadow-sm p-8 border border-slate-200/60 transition-all hover:shadow-md">
          {/* Header Section with better typography */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
                Inventory Health Status
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Real-time stock analytics
              </p>
            </div>
          </div>

          {loading ? (
            <SkeletonLoader />
          ) : (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      name: "Inventory",
                      "In Stock": Math.max(
                        0,
                        (inventoryData?.kpis?.totalMedicines || 0) -
                          (inventoryData?.kpis?.outOfStockMedicines || 0),
                      ),
                      "Low Stock": inventoryData?.kpis?.lowStockMedicines || 0,
                      "Out of Stock":
                        inventoryData?.kpis?.outOfStockMedicines || 0,
                      Expired: inventoryData?.kpis?.expiredMedicines || 0,
                    },
                  ]}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  barGap={12}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis dataKey="name" hide />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f1f5f9", opacity: 0.4 }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      padding: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{
                      paddingBottom: "20px",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  />

                  {/* Smoother Bar styling using softer colors and higher radius */}
                  <Bar
                    dataKey="In Stock"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    barSize={50}
                  />
                  <Bar
                    dataKey="Low Stock"
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                    barSize={50}
                  />
                  <Bar
                    dataKey="Out of Stock"
                    fill="#ef4444"
                    radius={[6, 6, 0, 0]}
                    barSize={50}
                  />
                  <Bar
                    dataKey="Expired"
                    fill="#64748b" // Switched to a sophisticated slate for Expired
                    radius={[6, 6, 0, 0]}
                    barSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* Inventory Section */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
          Inventory Control
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[
            {
              label: "Total Medicines",
              value: inventoryData?.kpis?.totalMedicines,
              icon: <Package size={24} />,
              color: "purple",
            },
            {
              label: "Low Stock",
              value: inventoryData?.kpis?.lowStockMedicines,
              icon: <TrendingDown size={24} />,
              color: "amber",
            },
            {
              label: "Out of Stock",
              value: inventoryData?.kpis?.outOfStockMedicines,
              icon: <Box size={24} />,
              color: "rose",
            },
            {
              label: "Expired",
              value: inventoryData?.kpis?.expiredMedicines,
              icon: <AlertCircle size={24} />,
              color: "pink",
            },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={() =>
                (window.location.href = `/dashboard/medicines?filter=${encodeURIComponent(stat.label)}`)
              }
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
            >
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-xl bg-${stat.color}-50 text-${stat.color}-600 shadow-sm`}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-2xl font-black text-slate-800">
                  {loading ? "—" : (stat.value ?? 0)}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Sample Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Low Stock Alert</h3>
              <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded">
                Action Required
              </span>
            </div>
            <div className="p-4">
              {loading ? (
                <p className="p-4 text-slate-400 text-center animate-pulse">
                  Loading items...
                </p>
              ) : inventoryData?.lowStockList?.length ? (
                <div className="space-y-1">
                  {inventoryData.lowStockList.slice(0, 6).map((m: any) => (
                    <div
                      key={m._id}
                      onClick={() =>
                        (window.location.href = `/dashboard/medicines?filter=${encodeURIComponent(
                          "Low Stock",
                        )}&search=${encodeURIComponent(m.name)}`)
                      }
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-medium text-slate-700">
                        {m.name}
                      </span>
                      <span className="text-sm font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                        {m.stock} left
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-slate-400">
                  Inventory is healthy
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Expiring Soon</h3>
              <span className="text-xs font-bold bg-rose-50 text-rose-700 px-2 py-1 rounded">
                Near Expiry
              </span>
            </div>
            <div className="p-4">
              {loading ? (
                <p className="p-4 text-slate-400 text-center animate-pulse">
                  Checking dates...
                </p>
              ) : inventoryData?.expiringSoonList?.length ? (
                <div className="space-y-1">
                  {inventoryData.expiringSoonList.slice(0, 6).map((m: any) => (
                    <div
                      key={m._id}
                      onClick={() =>
                        (window.location.href = `/dashboard/medicines?search=${encodeURIComponent(
                          m.name,
                        )}`)
                      }
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-medium text-slate-700">
                        {m.name}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {m.expiryDate
                          ? new Date(m.expiryDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                            })
                          : "-"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-slate-400">
                  No expiring items found
                </div>
              )}
            </div>
          </div>
          {/* Expired Items - added below Expiring Soon */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Expired Items</h3>
              <span className="text-xs font-bold bg-rose-50 text-rose-700 px-2 py-1 rounded">
                Already Expired
              </span>
            </div>
            <div className="p-4">
              {loading ? (
                <p className="p-4 text-slate-400 text-center animate-pulse">
                  Loading items...
                </p>
              ) : inventoryData?.expiredList?.length ? (
                <div className="space-y-1">
                  {inventoryData.expiredList.slice(0, 6).map((m: any) => (
                    <div
                      key={m._id}
                      onClick={() =>
                        (window.location.href = `/dashboard/medicines?search=${encodeURIComponent(
                          m.name,
                        )}`)
                      }
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-medium text-slate-700">
                        {m.name}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {m.expiryDate
                          ? new Date(m.expiryDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                            })
                          : "-"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-slate-400">
                  No expired items found
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Section */}
      <section className="pb-10">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
          Revenue & Growth
        </h2>

        {/* Revenue Chart */}
        <div className="mb-6 bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
            Revenue Growth Trend
          </h3>
          <div className="h-[300px] w-full">
            {loading ? (
              <SkeletonLoader />
            ) : revenueData?.trend?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData.trend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={4}
                    dot={{
                      r: 4,
                      fill: "#10b981",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="No Revenue Data"
                message="Try adjusting your filters"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-2xl shadow-lg text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign size={24} />
              </div>
              <span className="text-sm font-medium text-emerald-100">
                Total Revenue
              </span>
            </div>
            <p className="text-4xl font-black">
              {loading
                ? "—"
                : revenueData?.kpis?.totalRevenue
                  ? `₹${revenueData.kpis.totalRevenue.toLocaleString()}`
                  : "₹0"}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Calendar size={24} />
              </div>
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Analysis Period
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-800 capitalize">
              {period === "custom" ? `${startDate} to ${endDate}` : period}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <TrendingUp size={24} />
              </div>
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Growth Rate
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-slate-800">
                {loading ? "—" : (revenueData?.previousPeriod?.growth ?? 0)}%
              </p>
              <span className="text-xs font-bold text-slate-400">
                vs. last period
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
