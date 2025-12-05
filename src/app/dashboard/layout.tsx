"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import DashboardTopHeader from "./components/DashboardTopHeader";
import { useRouter, usePathname } from "next/navigation";
import Swal from "sweetalert2";
import { showConfirmStatusAlert } from "./components/ConfirmStatusAlert";
import { CustomTooltip } from "./components/miniComponents";

// 1. IMPORT NECESSARY LUCIDE ICONS
import { 
  LayoutDashboard, 
  Pill, 
  Tag, 
  Folder, 
  FileText, 
  Users, 
  User, 
  MapPin, 
  Store, 
  Image, 
  X, 
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Hospital
} from 'lucide-react';

// 2. CREATE A MAPPING FOR ICONS
const iconMap = {
  // Material Name: Lucide Component
  dashboard: LayoutDashboard,
  medication: Pill,
  category: Tag,
  folder: Folder,
  receipt_long: FileText,
  admin_panel_settings: Users,
  person: User,
  place: MapPin,
  store: Store,
  image: Image,
  local_pharmacy: Hospital, // Used for the brand logo
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  logout: LogOut,
};

// Function to render the correct Lucide icon component
const renderIcon = (iconName: keyof typeof iconMap, size: number | string, className?: string) => {
  const IconComponent = iconMap[iconName];
  if (IconComponent) {
    // Render the Lucide React component
    return <IconComponent size={size} className={className} />;
  }
  // Fallback for missing icon or if the name doesn't match
  return <span>{iconName}</span>; 
};


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const adminData = localStorage.getItem("admin");
    if (!adminData) {
      router.push("/login");
    } else {
      setAdmin(JSON.parse(adminData));
    }
  }, [router]);

  // NOTE: Material Icons Loader useEffect has been removed as per the previous interaction,
  // and is no longer needed with Lucide Icons.

  const handleLogout = async () => {
    showConfirmStatusAlert({
      isActive: true,
      title: "Logout Confirmation",
      text: "Are you sure you want to logout?",
      confirmText: "Logout",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
          localStorage.removeItem("admin");
          router.push("/login");
        } catch (error) {
          console.error("Logout failed:", error);
        }
      },
    });
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
      name: " Customers",
      path: "/dashboard/admin/customers",
      icon: "person",
    },
    { name: "Pincodes", path: "/dashboard/pincode", icon: "place" },
    { name: "Stores", path: "/dashboard/store", icon: "store" },
    { name: "Banner Images", path: "/dashboard/banner-images", icon: "image" },
  ];

  return (
    <div className="flex h-screen w-full">
      {/* 1. Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white shadow-xl transition-all duration-300 ease-in-out flex-shrink-0 z-20 overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-gray-200">
            <div
              className={`flex items-center ${
                sidebarOpen ? "justify-between" : "justify-center"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* LOGO ICON (local_pharmacy -> Hospital) */}
                {renderIcon("local_pharmacy", sidebarOpen ? 28 : 24, "text-green-600")}
                
                {sidebarOpen && (
                  <div>
                    <h1 className="text-2xl font-bold text-green-600 whitespace-nowrap">
                      Pharmato
                    </h1>
                    <p className="text-xs text-gray-500 whitespace-nowrap">
                      Medicine Management
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`text-gray-500 hover:text-green-600 transition p-1 rounded-full ${
                  !sidebarOpen ? "hidden" : ""
                }`}
                aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {/* CHEVRON ICON (chevron_left) */}
                {renderIcon("chevron_left", 24)}
              </button>
            </div>
            {/* Collapse Button for closed state (centered icon) */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-green-600 transition p-1 rounded-full w-full mt-2"
                aria-label="Expand sidebar"
              >
                {/* CHEVRON ICON (chevron_right) */}
                {renderIcon("chevron_right", 24)}
              </button>
            )}
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive =
                pathname === item.path ||
                (item.path !== "/dashboard" && pathname.startsWith(item.path));

              const MenuLink = (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-green-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-green-100 hover:text-green-700"
                  } ${!sidebarOpen ? "justify-center" : ""}`}
                >
                  {/* DYNAMIC LUCIDE ICON RENDERING */}
                  {renderIcon(item.icon as keyof typeof iconMap, sidebarOpen ? 20 : 24, sidebarOpen ? "text-xl" : "text-2xl")}
                  
                  {sidebarOpen && (
                    <span className="ml-3 font-medium whitespace-nowrap">
                      {item.name}
                    </span>
                  )}
                </Link>
              );

              return sidebarOpen ? (
                MenuLink
              ) : (
                <CustomTooltip key={item.path} title={item.name}>
                  {MenuLink}
                </CustomTooltip>
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
              className={`w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center ${
                sidebarOpen ? "justify-center gap-2" : "justify-center"
              }`}
              aria-label="Logout"
            >
              {/* LOGOUT ICON */}
              {renderIcon("logout", 20)}
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area (Header + Children) */}
      <div className="flex flex-col flex-1 bg-gradient-to-br from-green-50 to-teal-50 overflow-hidden">
        <DashboardTopHeader />

        <main className={`p-6 flex-1 overflow-y-auto w-full`}>{children}</main>
      </div>
    </div>
  );
}