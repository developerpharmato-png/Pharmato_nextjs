




"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { ToastMessages } from "@/utils/ToasterMessage";
import HeaderWithAction from "../components/HeaderWithAction";
import { CustomButton } from "../components/miniComponents";
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

  useEffect(() => {
    fetchRoles();
  }, []);

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
    if (isSuperAdmin) return;
    setValues((prev) => ({
      ...prev,
      [menu]: {
        ...(prev[menu] || { view: false, edit: false }),
        [field]: !((prev[menu] && prev[menu][field]) || false),
      },
    }));
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
    <div className="animate-pulse space-y-6">
      <div className="bg-gray-200 h-12 w-1/4 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="bg-gray-100 h-32 rounded-xl border border-gray-200" />
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
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-5 rounded-2xl shadow-sm border border-gray-100 gap-4">
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

              <CustomButton 
                onClick={save}
                disabled={loading || isSuperAdmin}
                className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${
                  isSuperAdmin ? "bg-gray-200 text-gray-400" : "bg-green-600 text-white hover:bg-green-700 active:scale-95"
                }`}
              >
                {loading ? "Processing..." : "Save Changes"}
              </CustomButton>
            </div>

            {loading ? (
              <PageSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {menuItems.map((menu) => (
                  <div 
                    key={menu} 
                    className={`p-5 rounded-2xl border transition-all duration-200 ${
                      values[menu]?.view || values[menu]?.edit 
                        ? "bg-white border-green-100 shadow-sm" 
                        : "bg-gray-50 border-transparent opacity-70"
                    }`}
                  >
                    <h3 className="font-bold text-gray-800 mb-4 truncate">
                      {prettyLabel(menu)}
                    </h3>
                    
                    <div className="space-y-3">
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700">View Access</span>
                        <input
                          type="checkbox"
                          checked={!!values[menu]?.view}
                          onChange={() => toggle(menu, "view")}
                          disabled={isSuperAdmin}
                          className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700">Edit Access</span>
                        <input
                          type="checkbox"
                          checked={!!values[menu]?.edit}
                          onChange={() => toggle(menu, "edit")}
                          disabled={isSuperAdmin}
                          className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50"
                        />
                      </label>
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