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
  ArrowUpRight,
  BarChart3,
  History as HistoryIcon,
  RotateCcw,
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
  AreaChart,
  Area,
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
          subtitle="Real-time overview of your pharmacy's performance."
          backLabel="Back"
          addLabel="Add "
          showBack={false}
          showSearch={false}
        />
        {/* <div className="flex -wrap items-center gap-2">
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
        </div> */}

        {/* Header Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 px-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-100">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {period === "custom" && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 pr-3 border-r border-slate-100">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="text-slate-400">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          <div className="flex items-center gap-2 pr-2 border-r border-slate-100">
            {/* <button
              onClick={() => exportOrders()}
              disabled={exportOrdersLoading}
              className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 disabled:opacity-50 shadow-sm transition-colors flex items-center gap-2"
              title="Export Orders"
            >
              <ShoppingCart size={14} />
              <span className="text-[10px] font-bold uppercase tracking-tight">Orders</span>
            </button>
            <button
              onClick={() => exportInventory()}
              disabled={exportInventoryLoading}
              className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 disabled:opacity-50 shadow-sm transition-colors flex items-center gap-2"
              title="Export Inventory"
            >
              <Package size={14} />
              <span className="text-[10px] font-bold uppercase tracking-tight">Stock</span>
            </button> */}
          </div>

          <button
            onClick={() => fetchAll()}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 group"
          >
            <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
            Refresh Data
          </button>
        </div>
      </div>



      {/* Analytics & Charts Section */}
      <section className="mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Orders Volume Trend
                </h4>

              </div>

              {/* Compact Summaries */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: "Today", value: ordersData?.summary?.daily || 0, color: "blue" },
                  { label: "Week", value: ordersData?.summary?.weekly || 0, color: "indigo" },
                  { label: "Month", value: ordersData?.summary?.monthly || 0, color: "purple" },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-2 shrink-0"
                  >
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{card.label}:</span>
                    <span className={`text-sm font-black text-${card.color}-600`}>
                      {loading ? "—" : card.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-[280px] w-full">
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

          {/* Unified Order Status & Performance Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 flex flex-col h-full">

            {/* Donut Chart Area */}
            <div className="h-[240px] w-full mb-6">
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
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {ordersData.statusCounts.map((s: any, idx: number) => {
                        const getStatusColor = (status: string) => {
                          const lowerStatus = status?.toLowerCase() || "";
                          if (lowerStatus.includes("delivered") || lowerStatus.includes("success") || lowerStatus.includes("completed")) return "#10b981"; // Green
                          if (lowerStatus.includes("pending")) return "#f59e0b"; // Orange
                          if (lowerStatus.includes("cancelled") || lowerStatus.includes("fail") || lowerStatus.includes("rejected")) return "#ef4444"; // Red
                          if (lowerStatus.includes("confirm")) return "#6366f1"; // Indigo
                          if (lowerStatus.includes("placed")) return "#3b82f6"; // Blue
                          if (lowerStatus.includes("shipped") || lowerStatus.includes("dispatch")) return "#8b5cf6"; // Purple
                          return "#64748b"; // Gray
                        };
                        return (
                          <Cell key={`cell-${idx}`} fill={getStatusColor(s._id)} />
                        );
                      })}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No Orders" message="Stats will appear here" />
              )}
            </div>

            {/* Total and List Section */}
            <div className="flex-1">
              <div className="mb-4">
                <h4 className="text-lg font-bold text-blue-600">Order Status</h4>
                <p className="text-sm font-medium text-slate-500">
                  Total Orders: <span className="text-slate-900 font-bold">{loading ? "—" : (ordersData?.kpis?.totalOrders ?? 0)}</span>
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                {loading ? (
                  [1, 2, 3].map((i) => <div key={i} className="h-6 bg-slate-100 animate-pulse rounded" />)
                ) : ordersData?.statusCounts?.length ? (
                  ordersData.statusCounts.map((s: any, idx: number) => {
                    const getStatusColor = (status: string) => {
                      const lowerStatus = status?.toLowerCase() || "";
                      if (lowerStatus.includes("delivered") || lowerStatus.includes("success") || lowerStatus.includes("completed")) return "#10b981"; // Green
                      if (lowerStatus.includes("pending")) return "#f59e0b"; // Orange
                      if (lowerStatus.includes("cancelled") || lowerStatus.includes("fail") || lowerStatus.includes("rejected")) return "#ef4444"; // Red
                      if (lowerStatus.includes("confirm")) return "#6366f1"; // Indigo
                      if (lowerStatus.includes("placed")) return "#3b82f6"; // Blue
                      if (lowerStatus.includes("shipped") || lowerStatus.includes("dispatch")) return "#8b5cf6"; // Purple
                      return "#64748b"; // Gray
                    };
                    const statusColor = getStatusColor(s._id);
                    return (
                      <div
                        key={s._id}
                        className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition-colors"
                        onClick={() => {
                          const params = new URLSearchParams();
                          params.set("filter", s._id);
                          params.set("period", period);
                          if (period === "custom" && startDate && endDate) {
                            params.set("startDate", startDate);
                            params.set("endDate", endDate);
                          }
                          window.location.href = `/dashboard/orders?${params.toString()}`;
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-sm shadow-sm"
                            style={{ backgroundColor: statusColor }}
                          />
                          <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 capitalize">
                            {s._id || "Unknown"}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">
                          {s.count}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No status data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>








      {/* Unified Revenue & Growth Card */}
      <section className="mb-6">
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-sm p-5 border border-slate-200/60 transition-all hover:shadow-md">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
                Revenue & Growth
              </h3>

            </div>

            {/* Compact Revenue Summaries */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: "Today", value: revenueData?.summary?.daily || 0, color: "emerald", periodVal: 'today' },
                { label: "Week", value: revenueData?.summary?.weekly || 0, color: "indigo", periodVal: 'week' },
                { label: "Month", value: revenueData?.summary?.monthly || 0, color: "blue", periodVal: 'month' },
                { label: "Year", value: revenueData?.summary?.yearly || 0, color: "purple", periodVal: 'all' },
              ].map((card) => (
                <div
                  key={card.label}
                  // onClick={() => setPeriod(card.periodVal as any)}
                  className="bg-white/50 border border-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-2 shrink-0 cursor-pointer hover:bg-white hover:border-blue-200 transition-all group"
                >
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{card.label}:</span>
                  <span className={`text-sm font-black text-${card.color}-600 group-hover:scale-105 transition-transform`}>
                    {loading ? "—" : `₹${card.value.toLocaleString()}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Revenue Trend Chart - Occupies 3 columns */}
            <div className="lg:col-span-3">
              <div className="h-[350px] w-full">
                {loading ? (
                  <SkeletonLoader />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData?.trend || []}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 10 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 10 }}
                        tickFormatter={(val) => `₹${val}`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "16px",
                          border: "none",
                          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Revenue KPIs Side-panel - Occupies 1 column */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1.5">Comparative Analysis</h4>

              {/* Filtered Revenue - Dynamic Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-xl shadow-lg text-white group hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 bg-white/20 rounded-lg text-white">
                    <BarChart3 size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">
                    {period === 'all' ? 'All Time Revenue' : `Revenue (${period})`}
                  </span>
                </div>
                <p className="text-xl font-black">
                  {loading
                    ? "—"
                    : `₹${(revenueData?.kpis?.totalRevenue ?? 0).toLocaleString()}`}
                </p>
                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[9px] text-blue-100 uppercase font-bold">Growth</span>
                  <div className={`flex items-center text-xs font-bold ${(revenueData?.previousPeriod?.growth ?? 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {(revenueData?.previousPeriod?.growth ?? 0) >= 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                    {Math.abs(revenueData?.previousPeriod?.growth ?? 0)}%
                  </div>
                </div>
              </div>

              {/* Analysis Period */}
              <div className="bg-white/50 p-3 rounded-xl border border-slate-100 shadow-sm transition-all hover:bg-white group">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="p-1 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                    <Calendar size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Period Details
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 capitalize">
                  {period === "custom" ? `${startDate} to ${endDate}` : period}
                </p>
              </div>


            </div>
          </div>
        </div>
      </section>






      {/* Since we merged Performance into the card above, we can remove the old KPI section or repurpose it */}

      {/* Unified Inventory Health & Control Card */}
      <section className="mb-6">
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-sm p-5 border border-slate-200/60 transition-all hover:shadow-md">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
                Inventory Health Status
              </h3>
              <p className="text-[12px] text-slate-400 mt-0.5">
                Real-time stock analytics & medicine control
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Real-time stock analytics graph */}
            <div className="lg:col-span-3">
              <div className="h-[350px] w-full">
                {loading ? (
                  <SkeletonLoader />
                ) : (
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
                        fill="#64748b"
                        radius={[6, 6, 0, 0]}
                        barSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Inventory Control Side-panel */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1.5">Inventory Control</h4>
              {[
                {
                  label: "Total Medicines",
                  value: inventoryData?.kpis?.totalMedicines,
                  icon: <Package size={18} />,
                  color: "purple",
                },
                {
                  label: "Low Stock",
                  value: inventoryData?.kpis?.lowStockMedicines,
                  icon: <TrendingDown size={18} />,
                  color: "amber",
                },
                {
                  label: "Out of Stock",
                  value: inventoryData?.kpis?.outOfStockMedicines,
                  icon: <Box size={18} />,
                  color: "rose",
                },
                {
                  label: "Expired",
                  value: inventoryData?.kpis?.expiredMedicines,
                  icon: <AlertCircle size={18} />,
                  color: "pink",
                },
              ].map((stat) => (
                <button
                  key={stat.label}
                  onClick={() =>
                    (window.location.href = `/dashboard/medicines?filter=${encodeURIComponent(stat.label)}`)
                  }
                  className="w-full bg-white/50 p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 hover:bg-white hover:border-blue-200 transition-all text-left group"
                >
                  <div
                    className={`w-9 h-9 flex items-center justify-center rounded-lg bg-${stat.color}-50 text-${stat.color}-600 shadow-sm group-hover:scale-105 transition-transform`}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="text-lg font-black text-slate-800">
                      {loading ? "—" : (stat.value ?? 0)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}





















