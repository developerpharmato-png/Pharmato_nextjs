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
    <div className="containerStyle scrollbar-hide py-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
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
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 px-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 pr-4 border-r border-slate-100">
            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
              <Calendar size={16} />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 leading-none mb-1">
                Analysis Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer hover:text-blue-600 transition-colors"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>

          {period === "custom" && (
            <div className="flex items-center gap-2 animate-in fade-in transition-all pr-4 border-r border-slate-100">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:ring-1 focus:ring-slate-300 outline-none transition-all"
              />
              <span className="text-slate-400 font-medium">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:ring-1 focus:ring-slate-300 outline-none transition-all"
              />
            </div>
          )}

          <div className="flex items-center pl-1">
            <button
              onClick={() => fetchAll()}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--secondary)] hover:bg-[var(--primary)] text-white text-xs font-semibold rounded-md transition-all shadow-sm active:scale-95 group"
            >
              <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              <span>Refresh Dashboard</span>
            </button>
          </div>
        </div>
      </div>



      {/* Analytics & Charts Section */}
      <section className="mb-3">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Chart Card */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4 border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Orders Volume Trend
                </h4>

              </div>

              <div className="flex items-center gap-6">
                {[
                  { label: "Today", value: ordersData?.summary?.daily || 0 },
                  { label: "This Week", value: ordersData?.summary?.weekly || 0 },
                  { label: "This Month", value: ordersData?.summary?.monthly || 0 },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="flex flex-col gap-0.5"
                  >
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{card.label}</span>
                    <span className={`text-[15px] font-bold text-slate-900`}>
                      {loading ? "—" : card.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-[200px] w-full">
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
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: "#2563eb" }}
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
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200/80 flex flex-col h-full">

            {/* Donut Chart Area */}
            <div className="h-[180px] w-full mb-3">
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
              <div className="mb-2">
                <h4 className="text-base font-bold text-blue-600">Order Status</h4>
                <p className="text-xs font-medium text-slate-500">
                  Total Orders: <span className="text-slate-900 font-bold">{loading ? "—" : (ordersData?.kpis?.totalOrders ?? 0)}</span>
                </p>
              </div>

              <div className="border-t border-slate-100 pt-2 space-y-1">
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
                        className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-1.5 rounded-md transition-colors border border-transparent hover:border-slate-100"
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
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: statusColor }}
                          />
                          <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 capitalize">
                            {s._id || "Unknown"}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-slate-800">
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








      {/* Revenue & Inventory Container */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-3">
      {/* Unified Revenue & Growth Card */}
      <section className="xl:col-span-2 min-w-0 flex flex-col">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200/80 transition-all hover:shadow-md">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Revenue & Growth
              </h3>

            </div>

            {/* Compact Revenue Summaries */}
            <div className="flex items-center gap-6">
              {[
                { label: "Today", value: revenueData?.summary?.daily || 0 },
                { label: "This Week", value: revenueData?.summary?.weekly || 0 },
                { label: "This Month", value: revenueData?.summary?.monthly || 0 },
                { label: "This Year", value: revenueData?.summary?.yearly || 0 },
              ].map((card) => (
                <div
                  key={card.label}
                  className="flex flex-col gap-0.5 cursor-pointer group"
                >
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">{card.label}</span>
                  <span className={`text-[15px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors`}>
                    {loading ? "—" : `₹${card.value.toLocaleString()}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Revenue KPIs Side-panel - Occupies top row */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Filtered Revenue - Dynamic Card */}
              <div className="p-4 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] transition-transform bg-white border border-slate-100 flex flex-col justify-center min-w-[250px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-[var(--secondary)] rounded-md">
                    <BarChart3 size={14} className="text-white" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    {period === 'all' ? 'All Time Revenue' : `Revenue (${period})`}
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-800">
                  {loading
                    ? "—"
                    : `₹${(revenueData?.kpis?.totalRevenue ?? 0).toLocaleString()}`}
                </p>
                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Growth</span>
                  <div className={`flex items-center text-xs font-medium ${(revenueData?.previousPeriod?.growth ?? 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {(revenueData?.previousPeriod?.growth ?? 0) >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                    {Math.abs(revenueData?.previousPeriod?.growth ?? 0)}%
                  </div>
                </div> 
              </div>
            </div>

            {/* Revenue Trend Chart - Occupies next row */}
            <div className="h-[220px] w-full">
              {loading ? (
                  <SkeletonLoader />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData?.trend || []}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
            </div>
          </div>
        </div>
      </section>






      {/* Since we merged Performance into the card above, we can remove the old KPI section or repurpose it */}

      {/* Unified Inventory Health & Control Card */}
      <section className="xl:col-span-1 min-w-0 mb-0 flex flex-col">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200/80 transition-all hover:shadow-md">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Inventory Health Status
              </h3>
              <p className="text-[12px] text-slate-400 mt-0.5">
                Real-time stock analytics & medicine control
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full">
            {/* Real-time stock analytics graph */}
            <div className="w-full">
              <div className="h-[220px] w-full">
                {loading ? (
                  <SkeletonLoader />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "In Stock", value: Math.max(0, (inventoryData?.kpis?.totalMedicines || 0) - (inventoryData?.kpis?.outOfStockMedicines || 0)), color: "#10b981" },
                          { name: "Low Stock", value: inventoryData?.kpis?.lowStockMedicines || 0, color: "#f59e0b" },
                          { name: "Out of Stock", value: inventoryData?.kpis?.outOfStockMedicines || 0, color: "#ef4444" },
                          { name: "Expired", value: inventoryData?.kpis?.expiredMedicines || 0, color: "#64748b" }
                        ].filter(d => d.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        stroke="none"
                        paddingAngle={2}
                      >
                        {[
                          { name: "In Stock", color: "#10b981" },
                          { name: "Low Stock", color: "#f59e0b" },
                          { name: "Out of Stock", color: "#ef4444" },
                          { name: "Expired", color: "#64748b" }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                          padding: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Inventory Control List Layout */}
            <div className="flex flex-col mt-2 flex-1">
              <div className="mb-3 pb-3 border-b border-slate-100">
                <h4 className="text-[15px] font-bold text-blue-600">Inventory Status</h4>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  Total Medicines: <span className="text-slate-900 font-bold">{loading ? "—" : (inventoryData?.kpis?.totalMedicines ?? 0)}</span>
                </p>
              </div>

              <div className="space-y-1">
              {[
                {
                  label: "In Stock",
                  value: Math.max(0, (inventoryData?.kpis?.totalMedicines || 0) - (inventoryData?.kpis?.outOfStockMedicines || 0)),
                  color: "#10b981",
                },
                {
                  label: "Low Stock",
                  value: inventoryData?.kpis?.lowStockMedicines,
                  color: "#f59e0b",
                },
                {
                  label: "Out of Stock",
                  value: inventoryData?.kpis?.outOfStockMedicines,
                  color: "#ef4444",
                },
                {
                  label: "Expired",
                  value: inventoryData?.kpis?.expiredMedicines,
                  color: "#64748b",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  onClick={() =>
                    (window.location.href = `/dashboard/medicines?filter=${encodeURIComponent(stat.label)}`)
                  }
                  className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full shadow-sm"
                      style={{ backgroundColor: stat.color }}
                    />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">
                      {stat.label}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">
                    {loading ? "—" : (stat.value ?? 0)}
                  </span>
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>

    </div>
  );
}





















