"use client";

import React, { useEffect, useState } from "react";

import Swal from "sweetalert2";
import HeaderWithAction from "../components/HeaderWithAction";
import TextareaSkeleton from "../components/skeleton/TextareaSkeleton";
import { CustomButton } from "../components/miniComponents";
import { customGet, customPost } from "../BaseURL/CustomNetwork";

type Role = { _id: string; name: string };

// Use the same menu items as the main layout (flattened to individual permission keys)
const menuItems = [
  "Dashboard",
  "Medicines",
  "Categories",
  "Subcategories",
  "Orders",
  "Customers",
  "Stores",
  "Banner Images",
  // Data Analytics children
  "Product Analytics",
  "Order Analytics",
  // Settings & Policies children
  "Setting",
  "Privacy Policies",
  "Term & Condition",
  // Admin Permissions children
  "Role",
  "Permission",
  "Management",
];

function prettyLabel(name: string) {
  // Enhanced prettyLabel for better display names if needed, but keeping it simple as per instructions.
  // Example: return name.replace(/([A-Z])/g, ' $1').trim();
  return name;
}

export default function PermissionPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  // values will be { [menuName]: { view: boolean; edit: boolean } }
  const [values, setValues] = useState<
    Record<string, { view: boolean; edit: boolean }>
  >({});
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
      // auto-select the first role by default and load its permissions
      if (fetched.length) {
        const firstId = fetched[0]._id;
        setSelectedRole(firstId);
        // load permissions for the first role
        loadPermissions(firstId);
      }
    } catch (err) {
      setRoles([]);
    }
    setLoading(false);
  };

  const loadPermissions = async (roleId: string) => {
    setLoading(true);
    try {
      const res = await customGet(`/api/admin/role-permission/${roleId}`);
      const data = res.data.data;
      const obj: Record<string, { view: boolean; edit: boolean }> = {};
      menuItems.forEach((menu) => {
        if (!data || !data.permissions || !data.permissions[menu]) {
          obj[menu] = { view: true, edit: true }; // Default permissions
        } else {
          obj[menu] = {
            view: Boolean(data.permissions[menu].view),
            edit: Boolean(data.permissions[menu].edit),
          };
        }
      });
      setValues(obj);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed to load permissions" });
      setValues({}); // Reset on failure
    }
    setLoading(false);
  };

  const onRoleChange = (id: string) => {
    setSelectedRole(id);
    if (id) {
      loadPermissions(id);
    } else {
      setValues({}); // Clear values if no role is selected
    }
  };

  // determine selected role name and whether it's SuperAdmin
  const selectedRoleName =
    roles.find((r) => r._id === selectedRole)?.name || "";
  const isSuperAdmin = selectedRoleName === "SuperAdmin";

  const toggle = (menu: string, field: "view" | "edit") => {
    if (isSuperAdmin) return; // Prevent changes for SuperAdmin
    setValues((prev) => ({
      ...prev,
      [menu]: {
        // Ensure we have a base object if it doesn't exist (though loadPermissions should handle this)
        ...(prev[menu] || { view: false, edit: false }),
        [field]: !((prev[menu] && prev[menu][field]) || false),
      },
    }));
  };

  const save = async () => {
    if (!selectedRole) {
      Swal.fire({ icon: "warning", title: "Select a role" });
      return;
    }
    if (isSuperAdmin) {
      Swal.fire({
        icon: "info",
        title: "SuperAdmin permissions cannot be modified",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = { roleId: selectedRole, permissions: values };
      await customPost("/api/admin/role-permission", payload);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: "An error occurred during save.",
      });
    }
    setLoading(false);
  };
  
  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Admin Permissions"
        subtitle="Assign specific view and edit rights to admin roles"
        showBack={false}
        showSearch={false}
      />

      <div className="bg-white p-6 rounded-xl shadow-lg mt-6">
        {/* Role Selection & Info */}
        <div className="mb-6 border-b pb-4">
          {loading ? (
            <TextareaSkeleton rows={2} />
          ) : (
            <>
              <label
                htmlFor="role-select"
                className="block mb-2 text-sm font-semibold text-gray-700"
              >
                Select Role
              </label>
              <select
                id="role-select"
                className=" border border-gray-300 p-3 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 transition duration-150 ease-in-out"
                value={selectedRole || ""}
                onChange={(e) => onRoleChange(e.target.value)}
              >
                <option value="" disabled>
                  -- Select an admin role --
                </option>
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            
            </>
          )}
        </div> 
        {/* --- */}

        {/* Permissions Table Skeleton or Table */}
        {selectedRole && loading && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 animate-pulse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider bg-gray-100">
                    &nbsp;
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider bg-gray-100">
                    &nbsp;
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider bg-gray-100">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(8)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="h-5 w-5 bg-gray-200 rounded mx-auto" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="h-5 w-5 bg-gray-200 rounded mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {selectedRole && !loading && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Menu Item
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    View Access
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Edit/Modify Access
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {menuItems.map((menu) => (
                  <tr
                    key={menu}
                    className="hover:bg-green-50 transition duration-100 ease-in-out"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {prettyLabel(menu)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        checked={!!values[menu]?.view}
                        onChange={() => toggle(menu, "view")}
                        // Tailwind utility for custom checkbox styling
                        className={`form-checkbox h-5 w-5 rounded transition duration-150 ease-in-out ${
                          isSuperAdmin
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-green-600 border-green-300 focus:ring-green-500"
                        }`}
                        disabled={isSuperAdmin}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        checked={!!values[menu]?.edit}
                        onChange={() => toggle(menu, "edit")}
                        className={`form-checkbox h-5 w-5 rounded transition duration-150 ease-in-out ${
                          isSuperAdmin
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-green-600 border-green-300 focus:ring-green-500"
                        }`}
                        disabled={isSuperAdmin}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* --- */}

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t flex justify-end gap-3">
          <CustomButton
            type="button"
            className={`font-semibold py-2 px-6 rounded-lg transition duration-150 ${
              loading || isSuperAdmin
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
            onClick={save}
            disabled={loading || isSuperAdmin}
          >
            {loading ? "Saving..." : "Update "}
          </CustomButton>
        </div>
      </div>
    </div>
  );
}
