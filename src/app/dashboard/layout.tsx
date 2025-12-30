"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import DashboardTopHeader from "./components/DashboardTopHeader";
import { useRouter, usePathname } from "next/navigation";
import { showConfirmStatusAlert } from "./components/ConfirmStatusAlert";
import { CustomTooltip } from "./components/miniComponents";
import logo from "./Images/Image 1.png";

import {
  LayoutDashboard, Pill, Tag, Folder, FileText, Users, User,
  MapPin, Store, Image, ChevronLeft, ChevronRight, LogOut, Hospital, ChevronDown,
} from "lucide-react";
import { requestPermissionAndGetToken } from "../firebase/firebaseConfig";

const iconMap = {
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
  local_pharmacy: Hospital,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  logout: LogOut,
  role: Users,
  permission: FileText,
  management: User,
  fileText: FileText // Added missing mapping for your settings icons
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [permissions, setPermissions] = useState<any>(null);
  
  // SIMPLE STATE: Store which menus are open by their Name
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    requestPermissionAndGetToken();
    const adminData = localStorage.getItem("admin");
    if (!adminData) router.push("/login");
    else setAdmin(JSON.parse(adminData));
  }, [router]);

  // Handle Menu Toggling
  const toggleMenu = (menuName: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  // Automatically open the parent menu if a child path is active
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.children?.some(child => pathname.startsWith(child.path))) {
        setOpenMenus(prev => ({ ...prev, [item.name]: true }));
      }
    });
  }, [pathname]);

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: "dashboard" },
    { name: "Medicines", path: "/dashboard/medicines", icon: "medication" },
    { name: "Categories", path: "/dashboard/categories", icon: "category" },
    { name: "Subcategories", path: "/dashboard/subcategories", icon: "folder" },
    { name: "Orders", path: "/dashboard/orders", icon: "receipt_long" },
    { name: "Customers", path: "/dashboard/admin/customers", icon: "person" },
    { name: "Stores", path: "/dashboard/store", icon: "store" },
    { name: "Banner Images", path: "/dashboard/banner-images", icon: "image" },
    {
      name: "Settings & Policies",
      icon: "folder",
      children: [
        { name: "Setting", path: "/dashboard/settings", icon: "admin_panel_settings" },
        { name: "Privacy Policy", path: "/dashboard/policies/policy", icon: "fileText" },
        { name: "Terms & Conditions", path: "/dashboard/policies/termcondition", icon: "fileText" },
      ],
    },
    {
      name: "Data Analytics",
      icon: "dashboard",
      children: [
        { name: "Product Analytics", path: "/dashboard/data-analytics/products", icon: "medication" },
        { name: "Order Analytics", path: "/dashboard/data-analytics/orders", icon: "receipt_long" },
      ],
    },
    {
      name: "Admin Permissions",
      icon: "admin_panel_settings",
      children: [
        { name: "Role", path: "/dashboard/role", icon: "role" },
        { name: "Permission", path: "/dashboard/permission", icon: "permission" },
        { name: "Management", path: "/dashboard/management", icon: "management" },
      ],
    },
  ];

  const handleLogout = () => {
    showConfirmStatusAlert({
      isActive: true,
      title: "Logout Confirmation",
      text: "Are you sure?",
      onConfirm: async () => {
        localStorage.removeItem("admin");
        router.push("/login");
      },
    });
  };

  const renderIcon = (name: string, size: number) => {
    const Icon = (iconMap as any)[name] || LayoutDashboard;
    return <Icon size={size} />;
  };

  return (
    <div className="flex h-screen w-full">
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white shadow-xl transition-all duration-300 z-20 overflow-hidden flex flex-col`}>
        <div className="p-4 border-b flex items-center justify-between">
          {sidebarOpen && <img src={logo.src} alt="Logo" className="h-8" />}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 p-1">
            {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = openMenus[item.name];
            const isActive = pathname === item.path || (hasChildren && isOpen);

            return (
              <div key={item.name}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${isActive ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-green-100"}`}
                  >
                    {renderIcon(item.icon, 20)}
                    {sidebarOpen && (
                      <>
                        <span className="ml-3 font-medium flex-1 text-left">{item.name}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </>
                    )}
                  </button>
                ) : (
                  <Link href={item.path || "#"} className={`flex items-center px-4 py-3 rounded-lg transition-all ${pathname === item.path ? "bg-green-600 text-white shadow-md" : "text-gray-700 hover:bg-green-100"}`}>
                    {renderIcon(item.icon, 20)}
                    {sidebarOpen && <span className="ml-3 font-medium">{item.name}</span>}
                  </Link>
                )}

                {sidebarOpen && hasChildren && isOpen && (
                  <div className="mt-1 ml-6 space-y-1 border-l-2 border-green-100">
                    {item.children.map((child) => (
                      <Link key={child.path} href={child.path} className={`flex items-center px-4 py-2 rounded-lg text-sm ${pathname === child.path ? "text-green-600 font-bold" : "text-gray-600 hover:text-green-600"}`}>
                        {renderIcon(child.icon, 16)}
                        <span className="ml-3">{child.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <button onClick={handleLogout} className="w-full px-4 py-2 bg-red-500 text-white rounded-lg flex items-center justify-center gap-2">
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-1 bg-gray-50 overflow-hidden">
        <DashboardTopHeader />
        <main className="p-6 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}