"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminData = localStorage.getItem("admin");
    if (!adminData) {
      router.push("/login");
    } else {
      setAdmin(JSON.parse(adminData));
      setLoading(false);
    }
  }, [router]);

  // Load Material Icons for improved UI
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!document.getElementById("material-icons-stylesheet")) {
      const link = document.createElement("link");
      link.id = "material-icons-stylesheet";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
      document.head.appendChild(link);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("admin");
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: "dashboard" },
    { name: "Medicines", path: "/dashboard/medicines", icon: "medication" },
    { name: "Categories", path: "/dashboard/categories", icon: "category" },
    { name: "Subcategories", path: "/dashboard/subcategories", icon: "folder" },
    {
      name: "Prescriptions",
      path: "/dashboard/prescriptions",
      icon: "receipt_long",
    },
    { name: "Admins", path: "/dashboard/admins", icon: "admin_panel_settings" },
    {
      name: "Admin Customers",
      path: "/dashboard/admin/customers",
      icon: "person",
    },
    { name: "Pincodes", path: "/dashboard/pincode", icon: "place" },
    { name: "Stores", path: "/dashboard/store", icon: "store" },
    { name: "Banner Images", path: "/dashboard/banner-images", icon: "image" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 to-teal-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white shadow-lg transition-all duration-300 ease-in-out flex-shrink-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-icons text-green-600 text-2xl">
                  local_pharmacy
                </span>
                {sidebarOpen && (
                  <div>
                    <h1 className="text-2xl font-bold text-green-600">
                      Pharmato
                    </h1>
                    <p className="text-xs text-gray-500">Medicine Management</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-green-600 transition"
                aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                <span className="material-icons">
                  {sidebarOpen ? "chevron_left" : "chevron_right"}
                </span>
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive =
                pathname === item.path ||
                (item.path !== "/dashboard" && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-green-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-green-50 hover:text-green-600"
                  }`}
                >
                  <span className="material-icons text-xl">{item.icon}</span>
                  {sidebarOpen && (
                    <span className="ml-3 font-medium">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-gray-200">
            <div
              className={`flex items-center ${
                sidebarOpen ? "space-x-3" : "justify-center"
              } mb-3`}
            >
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                {admin?.name?.charAt(0).toUpperCase()}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {admin?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {admin?.email}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={`w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition ${
                !sidebarOpen ? "text-xs" : ""
              }`}
              aria-label="Logout"
            >
              <span className="inline-flex items-center gap-2 justify-center">
                <span className="material-icons">logout</span>
                {sidebarOpen && <span>Logout</span>}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={` admin-module p-10 h-[92vh] transition-all duration-300 ${
          sidebarOpen ? "w-[calc(100vw-16rem)]" : "w-full"
        } flex-1 overflow-hidden`}
      >
        {children}
      </main>
    </div>
  );
}
