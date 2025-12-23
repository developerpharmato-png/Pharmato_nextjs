"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import DashboardTopHeader from "./components/DashboardTopHeader";
import { useRouter, usePathname } from "next/navigation";
import { showConfirmStatusAlert } from "./components/ConfirmStatusAlert";
import { CustomTooltip } from "./components/miniComponents";
import logo from "./Images/Image 1.png";

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
  ChevronLeft,
  ChevronRight,
  LogOut,
  Hospital,
  ChevronDown,
} from "lucide-react";
import { requestPermissionAndGetToken } from "../firebase/firebaseConfig";

// 2. CREATE A MAPPING FOR ICONS
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
};

const renderIcon = (
  iconName: keyof typeof iconMap,
  size: number | string,
  className?: string
) => {
  const IconComponent = iconMap[iconName];
  if (IconComponent) {
    return <IconComponent size={size} className={className} />;
  }
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
  const [adminPermOpen, setAdminPermOpen] = useState(false);
  const [dataAnalyticsOpen, setDataAnalyticsOpen] = useState(false);
  const [permissions, setPermissions] = useState<Record<
    string,
    { view: boolean; edit: boolean }
  > | null>(null);


useEffect(() => {
    
    requestPermissionAndGetToken();
  }, []);


  useEffect(() => {
    const adminData = localStorage.getItem("admin");
    if (!adminData) {
      router.push("/login");
    } else {
      setAdmin(JSON.parse(adminData));
    }
  }, [router]);

  useEffect(() => {
    if (!admin) return;
    const p = localStorage.getItem("adminPermissions");
    if (p) {
      try {
        setPermissions(JSON.parse(p));
        return;
      } catch (e) {}
    }

    if (admin?.roleId) {
      (async () => {
        try {
          const res = await fetch(`/api/admin/role-permission/${admin.roleId}`);
          const json = await res.json();
          const perms = json?.data?.permissions ?? json?.data ?? {};
          setPermissions(perms);
          localStorage.setItem("adminPermissions", JSON.stringify(perms));
        } catch (err) {
          console.error("Failed to fetch role permissions", err);
        }
      })();
    }
  }, [admin]);

  useEffect(() => {
    // Only open Admin Permissions menu for its own children
    const adminPermPaths = [
      "/dashboard/role",
      "/dashboard/permission",
      "/dashboard/management",
    ];
    setAdminPermOpen(
      adminPermPaths.some((p) => pathname === p || pathname.startsWith(p))
    );

    // Only open Data Analytics menu for its own children
    const dataAnalyticsPaths = [
      "/dashboard/data-analytics/products",
      "/dashboard/data-analytics/orders",
    ];
    setDataAnalyticsOpen(
      dataAnalyticsPaths.some((p) => pathname === p || pathname.startsWith(p))
    );
  }, [pathname]);

  const isCurrentSuperAdmin =
    admin?.roleName === "SuperAdmin" ||
    (admin?.roleId &&
      permissions &&
      permissions["Admins"]?.view === true &&
      permissions["Admin Permissions"]?.view === true);

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
    { name: "Orders", path: "/dashboard/orders", icon: "receipt_long" },
    { name: " Customers", path: "/dashboard/admin/customers", icon: "person" },
    { name: "Pincodes", path: "/dashboard/pincode", icon: "place" },
    { name: "Stores", path: "/dashboard/store", icon: "store" },
    { name: "Banner Images", path: "/dashboard/banner-images", icon: "image" },
    {
      name: "Data Analytics",
      icon: "dashboard",
      children: [
        {
          name: "Product Analytics",
          path: "/dashboard/data-analytics/products",
          icon: "medication",
        },
        {
          name: "Order Analytics",
          path: "/dashboard/data-analytics/orders",
          icon: "receipt_long",
        },
      ],
    },
    {
      name: "Admin Permissions",
      icon: "admin_panel_settings",
      children: [
        { name: "Role", path: "/dashboard/role", icon: "role" },
        {
          name: "Permission",
          path: "/dashboard/permission",
          icon: "permission",
        },
        {
          name: "Management",
          path: "/dashboard/management",
          icon: "management",
        },
      ],
    },
  ];

  const menuItemsWithPermission = menuItems.map((item: any) => {
    const key = item.name.trim();
    let ispermission = true;
    if (permissions) {
      const perm = (permissions as any)[key];
      ispermission = perm ? Boolean(perm.view) : true;
    }
    if (item.name === "Admin Permissions") {
      ispermission = isCurrentSuperAdmin;
    }
    const children = (item.children || []).filter((child: any) => {
      if (!permissions) return true;
      const perm = (permissions as any)[child.name];
      return perm ? Boolean(perm.view) : true;
    });
    return { ...item, ispermission, children };
  });

  const visibleMenuItems = menuItemsWithPermission.filter(
    (item: any) => item.ispermission
  );

  return (
    <div className="flex h-screen w-full">
      {/* 1. Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white shadow-xl transition-all duration-300 ease-in-out shrink-0 z-20 overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-4 border-b border-gray-200">
            <div
              className={`flex items-center ${
                sidebarOpen ? "justify-between" : "justify-center"
              }`}
            >
              <div className="flex items-center">
                {sidebarOpen && (
                  <>
                    <img
                      src={logo.src}
                      alt="Pharmato Logo"
                      className="w-full"
                    />
                  </>
                )}
              </div>
              {sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-500 hover:text-green-600 transition p-1 rounded-full"
                >
                  {renderIcon("chevron_left", 24)}
                </button>
              )}
            </div>
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-500 hover:text-green-600 transition p-1 rounded-full w-full mt-2"
              >
                {renderIcon("chevron_right", 24)}
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {visibleMenuItems.map((item: any) => {
              const hasChildren = item.children && item.children.length > 0;
              let isActive = pathname === item.path;
              let isOpen = false;
              let setOpen: (open: boolean) => void = () => {};
              if (item.name === "Admin Permissions") {
                isOpen = adminPermOpen;
                setOpen = setAdminPermOpen;
                isActive = isActive || adminPermOpen;
              } else if (item.name === "Data Analytics") {
                isOpen = dataAnalyticsOpen;
                setOpen = setDataAnalyticsOpen;
                isActive = isActive || dataAnalyticsOpen;
              }

              const MenuLink = (
                <div key={item.name}>
                  {hasChildren ? (
                    <button
                      onClick={() => sidebarOpen && setOpen(!isOpen)}
                      className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-green-50 text-green-700"
                          : "text-gray-700 hover:bg-green-100"
                      } ${!sidebarOpen ? "justify-center" : ""}`}
                    >
                      {renderIcon(item.icon, sidebarOpen ? 20 : 24)}
                      {sidebarOpen && (
                        <>
                          <span className="ml-3 font-medium flex-1 text-left">
                            {item.name}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      href={item.path}
                      className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                        pathname === item.path
                          ? "bg-green-600 text-white shadow-md"
                          : "text-gray-700 hover:bg-green-100"
                      } ${!sidebarOpen ? "justify-center" : ""}`}
                    >
                      {renderIcon(item.icon, sidebarOpen ? 20 : 24)}
                      {sidebarOpen && (
                        <span className="ml-3 font-medium">{item.name}</span>
                      )}
                    </Link>
                  )}

                  {/* Render Children */}
                  {sidebarOpen && hasChildren && isOpen && (
                    <div className="mt-1 ml-6 space-y-1">
                      {item.children.map((child: any) => (
                        <Link
                          key={child.path}
                          href={child.path}
                          className={`flex items-center px-4 py-2 rounded-lg text-sm transition-all ${
                            pathname === child.path
                              ? "text-green-600 font-bold"
                              : "text-gray-600 hover:text-green-600"
                          }`}
                        >
                          {renderIcon(child.icon, 16)}
                          <span className="ml-3">{child.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );

              return sidebarOpen ? (
                MenuLink
              ) : (
                <CustomTooltip key={item.name} title={item.name}>
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
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
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
            >
              {renderIcon("logout", 20)}
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex flex-col flex-1 bg-gradient-to-br from-green-50 to-teal-50 overflow-hidden">
        <DashboardTopHeader />
        <main className="p-6 flex-1 overflow-y-auto w-full">{children}</main>
      </div>
    </div>
  );
}
