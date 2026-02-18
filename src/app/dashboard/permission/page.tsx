




"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { ToastMessages } from "@/utils/ToasterMessage";
import HeaderWithAction from "../components/HeaderWithAction";
import { CustomButton, CustomTooltip } from "../components/miniComponents";
import { customGet, customPost } from "../BaseURL/CustomNetwork";

type Role = { _id: string; name: string };

const menuItems = [
  "Dashboard", "Medicines", "Categories", "Subcategories", "Orders",
  "Customers", "Stores", "Banner Images", "Product Analytics",
  "Order Analytics", "Setting", "Privacy Policies", "Term & Condition",
  "Role", "Permission", "Management",
];

function prettyLabel(name: string) {
  return name;
}

export default function PermissionPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, { view: boolean; edit: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [adminPermissions, setAdminPermissions] = useState<any>(null); // New state

  useEffect(() => {
    fetchRoles();
    try {
      const p = localStorage.getItem("adminPermissions");
      if (p) setAdminPermissions(JSON.parse(p));
    } catch (e) {
      // ignore
    }
  }, []);

  const canEditPermissions = adminPermissions?.Permission?.edit ?? true;

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await customGet("/api/admin/role/active");
      const fetched: Role[] = res.data.data || [];
      setRoles(fetched);
      if (fetched.length) {
        const firstId = fetched[0]._id;
        setSelectedRole(firstId);
        loadPermissions(firstId);
      }
    } catch (err) {
      setRoles([]);
    }

  };

  const loadPermissions = async (roleId: string) => {
    setLoading(true);
    try {
      const res = await customGet(`/api/admin/role-permission/${roleId}`);
      const data = res.data.data;
      const obj: Record<string, { view: boolean; edit: boolean }> = {};
      menuItems.forEach((menu) => {
        if (!data || !data.permissions || !data.permissions[menu]) {
          obj[menu] = { view: true, edit: true };
        } else {
          obj[menu] = {
            view: Boolean(data.permissions[menu].view),
            edit: Boolean(data.permissions[menu].edit),
          };
        }
        // Ensure view is true when edit is true (edit implies view)
        if (obj[menu].edit) obj[menu].view = true;
      });
      setValues(obj);
    } catch (err) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: ToastMessages.PERMISSIONS_LOAD_FAILED,
        showConfirmButton: false,
        timer: 2000,
      });
      setValues({});
    }
    setLoading(false);
  };

  const onRoleChange = (id: string) => {
    setSelectedRole(id);
    if (id) loadPermissions(id);
    else setValues({});
  };

  const selectedRoleName = roles.find((r) => r._id === selectedRole)?.name || "";
  const isSuperAdmin = selectedRoleName === "SuperAdmin";

  const toggle = (menu: string, field: "view" | "edit") => {
    if (isSuperAdmin || !canEditPermissions) return; // Prevent toggle if no permission
    setValues((prev) => {
      const current = prev[menu] || { view: false, edit: false };
      // Toggle target field
      const newValue = !current[field];

      // If trying to toggle view while edit is enabled, prevent unchecking view
      if (field === "view" && current.edit && !newValue) {
        return prev; // ignore - edit implies view
      }

      const updated = { ...prev };
      updated[menu] = { ...current, [field]: newValue };

      // If edit is being enabled, ensure view is also enabled
      if (field === "edit" && newValue) {
        updated[menu].view = true;
      }

      return updated;
    });
  };

  const save = async () => {
    if (!selectedRole) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: ToastMessages.ROLE_REQUIRED,
        showConfirmButton: false,
        timer: 2000,
      });
      return;
    }
    if (isSuperAdmin) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "info",
        title: ToastMessages.SUPERADMIN_PERMISSIONS_LOCKED,
        showConfirmButton: false,
        timer: 2000,
      });
      return;
    }
    setLoading(true);
    try {
      const payload = { roleId: selectedRole, permissions: values };
      await customPost("/api/admin/role-permission", payload);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: ToastMessages.PERMISSIONS_UPDATED,
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: ToastMessages.PERMISSIONS_UPDATE_FAILED,
        showConfirmButton: false,
        timer: 2000,
      });
    }
    setLoading(false);
  };

  // Full Page Skeleton
  const PageSkeleton = () => (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-64 rounded skeleton-loading" />
        <div className="h-10 w-40 rounded-xl skeleton-loading" />
      </div>
      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="bg-white h-32 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center p-4">
            <div className="h-6 w-2/3 rounded skeleton-loading mb-4" />
            <div className="h-4 w-1/2 rounded skeleton-loading mb-2" />
            <div className="h-4 w-1/3 rounded skeleton-loading" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Admin Permissions"
        subtitle="Configure module-level access for administrative roles"
        showBack={false}
        showSearch={false}
      />

      <div className="mt-6">
        {loading && roles.length === 0 ? (
          <PageSkeleton />

        ) : (
          <div className="space-y-6">
            {/* Role Switcher */}
            <div className="sticky top-0 z-10 flex flex-col md:flex-row md:items-center justify-between bg-white p-5 rounded-2xl shadow-sm border border-gray-100 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Active Role
                </label>
                <select
                  className="text-lg font-bold text-gray-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                  value={selectedRole || ""}
                  onChange={(e) => onRoleChange(e.target.value)}
                >
                  {roles.map((r) => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {canEditPermissions && (
                  <CustomButton
                    onClick={save}
                  disabled={loading || isSuperAdmin}
                  className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg w-full md:w-auto mt-4 md:mt-0 ${isSuperAdmin ? "bg-gray-200 text-gray-400" : "bg-green-600 text-white hover:bg-green-700 active:scale-95"
                      }`}
                  >
                    {loading ? "Processing..." : "Save Changes"}
                  </CustomButton>
              )}
            </div>

            {loading ? (
              <PageSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {menuItems.map((menu) => (
                  <div
                    key={menu}
                    className={`p-5 rounded-2xl border transition-all duration-200 ${values[menu]?.view || values[menu]?.edit
                      ? "bg-white border-green-100 shadow-sm"
                      : "bg-gray-50 border-transparent opacity-70"
                      }`}
                  >
                    <h3 className="font-bold text-gray-800 mb-4 truncate">
                      {prettyLabel(menu)}
                    </h3>

                    <div className="space-y-3">
                      <CustomTooltip title={!canEditPermissions ? "Toggle Permission Denied" : ""}>
                        <label className="flex items-center justify-between cursor-pointer group">
                          <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700">View Access</span>
                          <input
                            type="checkbox"
                            checked={!!values[menu]?.view}
                            onChange={() => toggle(menu, "view")}
                            disabled={isSuperAdmin || !!values[menu]?.edit || !canEditPermissions}
                            className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50"
                          />
                        </label>
                      </CustomTooltip>

                      <CustomTooltip title={!canEditPermissions ? "Toggle Permission Denied" : ""}>
                        <label className="flex items-center justify-between cursor-pointer group">
                          <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700">Edit Access</span>
                          <input
                            type="checkbox"
                            checked={!!values[menu]?.edit}
                            onChange={() => toggle(menu, "edit")}
                            disabled={isSuperAdmin || !canEditPermissions}
                            className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50"
                          />
                        </label>
                      </CustomTooltip>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}