"use client";
import React from "react";
import {
    ShoppingCart,
    CheckCircle,
    Clock,
    XCircle,
    AlertTriangle,
    Package,
    Box,
    TrendingUp,
    TrendingDown,
    Calendar,
    DollarSign,
    AlertCircle,
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
// Dummy chart data
const dailyRevenue = [
    { day: "Mon", revenue: 1200 },
    { day: "Tue", revenue: 1500 },
    { day: "Wed", revenue: 1100 },
    { day: "Thu", revenue: 1800 },
    { day: "Fri", revenue: 2100 },
    { day: "Sat", revenue: 1700 },
    { day: "Sun", revenue: 900 },
];

const monthlyRevenue = [
    { month: "Jan", revenue: 42000 },
    { month: "Feb", revenue: 38000 },
    { month: "Mar", revenue: 47000 },
    { month: "Apr", revenue: 52000 },
    { month: "May", revenue: 58000 },
    { month: "Jun", revenue: 61000 },
    { month: "Jul", revenue: 57000 },
    { month: "Aug", revenue: 63000 },
    { month: "Sep", revenue: 59000 },
    { month: "Oct", revenue: 65000 },
    { month: "Nov", revenue: 62000 },
    { month: "Dec", revenue: 70000 },
];

const orderStatus = [
    { name: "Completed", value: 28 },
    { name: "Pending", value: 3 },
    { name: "Cancelled", value: 1 },
    { name: "Failed", value: 0 },
];

const pieColors = ["#22c55e", "#facc15", "#ef4444", "#fb923c"];
{/* Charts Section */ }
<section className="mb-8">
    <h2 className="text-xl font-semibold text-gray-700 mb-4">Analytics & Charts</h2>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart: Daily Revenue */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <h3 className="text-lg font-semibold mb-2 text-blue-700">Daily Revenue</h3>
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyRevenue} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>

        {/* Bar Chart: Monthly Revenue */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <h3 className="text-lg font-semibold mb-2 text-green-700">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyRevenue} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#22c55e" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>

        {/* Pie Chart: Order Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <h3 className="text-lg font-semibold mb-2 text-purple-700">Order Status Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={orderStatus}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} (${percent !== undefined ? (percent * 100).toFixed(0) : '0'}%)`}
                    >
                        {orderStatus.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                        ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    </div>
</section>

export default function NewDashboardPage() {
    // Dummy data
    const orderStats = [
        {
            label: "Total Orders (Today)",
            value: 32,
            icon: <ShoppingCart className="text-blue-600" size={28} />,
            bg: "bg-blue-50",
        },
        {
            label: "Orders Completed",
            value: 28,
            icon: <CheckCircle className="text-green-600" size={28} />,
            bg: "bg-green-50",
        },
        {
            label: "Orders Pending",
            value: 3,
            icon: <Clock className="text-yellow-600" size={28} />,
            bg: "bg-yellow-50",
        },
        {
            label: "Orders Cancelled",
            value: 1,
            icon: <XCircle className="text-red-600" size={28} />,
            bg: "bg-red-50",
        },
        {
            label: "Orders Failed",
            value: 0,
            icon: <AlertTriangle className="text-orange-600" size={28} />,
            bg: "bg-orange-50",
        },
    ];

    const inventoryStats = [
        {
            label: "Total Medicines Listed",
            value: 248,
            icon: <Package className="text-purple-600" size={28} />,
            bg: "bg-purple-50",
            highlight: false,
        },
        {
            label: "Out of Stock",
            value: 5,
            icon: <Box className="text-red-600" size={28} />,
            bg: "bg-red-50",
            highlight: true,
            highlightColor: "border-red-600 text-red-700",
        },
        {
            label: "Low Stock (< 10)",
            value: 12,
            icon: <TrendingDown className="text-yellow-600" size={28} />,
            bg: "bg-yellow-50",
            highlight: true,
            highlightColor: "border-orange-500 text-orange-700",
        },
        {
            label: "Expired Medicines",
            value: 2,
            icon: <AlertCircle className="text-pink-600" size={28} />,
            bg: "bg-pink-50",
            highlight: true,
            highlightColor: "border-pink-600 text-pink-700",
            alertIcon: true,
        },
    ];

    const revenueStats = [
        {
            label: "Today Revenue",
            value: "₹2,150",
            icon: <DollarSign className="text-green-600" size={28} />,
            bg: "bg-green-50",
        },
        {
            label: "Monthly Revenue",
            value: "₹58,400",
            icon: <Calendar className="text-blue-600" size={28} />,
            bg: "bg-blue-50",
        },
        {
            label: "Yearly Revenue",
            value: "₹6,92,000",
            icon: <TrendingUp className="text-purple-600" size={28} />,
            bg: "bg-purple-50",
        },
    ];

    return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
                Pharmacy Admin Dashboard
            </h1>
            <p className="text-gray-500 mb-8">
                Get a quick overview of your pharmacy's performance and inventory.
            </p>

            {/* Orders KPI Cards */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Orders Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {orderStats.map((stat) => (
                        <div
                            key={stat.label}
                            className={`rounded-xl shadow-sm p-5 flex items-center gap-4 ${stat.bg} border-l-4`}
                        >
                            <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-white shadow">
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Inventory Section */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Inventory</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {inventoryStats.map((stat) => (
                        <div
                            key={stat.label}
                            className={`rounded-xl shadow-sm p-5 flex items-center gap-4 ${stat.bg} border-l-4 ${stat.highlight ? stat.highlightColor : "border-purple-600"}`}
                        >
                            <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-white shadow relative">
                                {stat.icon}
                                {stat.alertIcon && (
                                    <span className="absolute top-0 right-0 text-pink-600">
                                        <AlertCircle size={20} />
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className={`text-sm mb-1 ${stat.highlight ? stat.highlightColor : "text-gray-600"}`}>{stat.label}</p>
                                <p className={`text-2xl font-bold ${stat.highlight ? stat.highlightColor : "text-gray-800"}`}>{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Revenue Section */}
            <section>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Revenue</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {revenueStats.map((stat) => (
                        <div
                            key={stat.label}
                            className={`rounded-xl shadow-sm p-5 flex items-center gap-4 ${stat.bg} border-l-4`}
                        >
                            <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-white shadow">
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
