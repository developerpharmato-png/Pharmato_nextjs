"use client";
import { customPost, customGet } from "../BaseURL/CustomNetwork";
import React, { useEffect, useState } from "react";
import HeaderWithAction from "../components/HeaderWithAction";
import { CustomTable, Column } from "../components/CustomTable";
import { showConfirmStatusAlert } from "../components/ConfirmStatusAlert";
import AdminForm from "./AdminForm";
import { Edit2Icon, EditIcon, Trash2 } from "lucide-react";
import { CustomButton } from "../components/miniComponents";
import Swal from "sweetalert2";

type Admin = {
  _id: string;
  name?: string;
  email: string;
  roleId?: string;
  isActive?: boolean;
};

type Role = { _id: string; name: string };

export default function ManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Admin | null>(null);
  const [search, setSearch] = useState<string>("");

  const roleMap = Object.fromEntries(roles.map((r) => [r._id, r.name]));

  async function fetchRoles() {
    try {
      const res = await fetch("/api/admin/role/active");
      if (!res.ok) return;
      const json = await res.json();
      setRoles(json.data || []);
    } catch (err) {
      // ignore
    }
  }

  async function fetchAdmins() {
    setLoading(true);
    try {
      const res = await customGet(
        `/api/admins?page=${page + 1}&limit=${rowsPerPage}`
      );
      const json = res.data;
      setAdmins(json.data || []);
      setTotalCount(json.totalCount ?? (json.data || []).length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  // reset to first page when search changes
  useEffect(() => {
    setPage(0);
  }, [search]);

  async function resendInvite(id: string) {
    const admin = admins.find((a) => a._id === id);
    await customPost(`/api/admins/${id}/resend-invite`, {
      email: admin?.email,
    });
  }

  async function toggleActive(id: string, isActive?: boolean) {
    // Prevent toggling SuperAdmin accounts
    const row = admins.find((a) => a._id === id);
    const rowRole = row ? roleMap[row.roleId || ""] || "" : "";
    if (rowRole === "SuperAdmin") {
      alert("Cannot change active status of SuperAdmin");
      return;
    }

    showConfirmStatusAlert({
      isActive: !!isActive,
      title: isActive ? "Deactivate admin?" : "Activate admin?",
      text: isActive ? "Deactivate this admin?" : "Activate this admin?",
      confirmText: isActive ? "Deactivate" : "Activate",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admins/${id}/toggle-status`, {
            method: "PATCH",
          });
          if (!res.ok) throw new Error("Toggle failed");
          const json = await res.json();
          const updated: Admin = json.data;
          setAdmins((prev) =>
            prev.map((a) => (a._id === updated._id ? updated : a))
          );
        } catch (err) {
          alert("Failed to toggle active status");
        }
      },
    });
  }

  async function deleteAdmin(id: string) {
    // who is performing the delete
    const adminRaw = localStorage.getItem("admin");
    const currentAdmin = adminRaw ? JSON.parse(adminRaw) : null;

    // Prevent deleting SuperAdmin accounts
    const row = admins.find((a) => a._id === id);
    const rowRole = row ? roleMap[row.roleId || ""] || "" : "";
    if (rowRole === "SuperAdmin") {
      alert("Cannot delete SuperAdmin");
      return;
    }

    showConfirmStatusAlert({
      isActive: true,
      title: "Delete admin?",
      text: "This will permanently remove the admin account. Continue?",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admins/${id}/delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deletedById: currentAdmin?._id || null }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json?.message || "Delete failed");
          // remove from UI
          setAdmins((prev) => prev.filter((a) => a._id !== id));
          const who = json.data?.deletedBy;
          if (who) alert(`Admin deleted by ${who.name} (${who.email})`);
          else alert("Admin deleted");
        } catch (err: any) {
          alert(err?.message || "Failed to delete admin");
        }
      },
    });
  }

  function openAdd() {
    setEditing(null);
    setShowAdd(true);
  }

  function openEdit(a: Admin) {
    setEditing(a);
    setShowAdd(true);
  }

  async function handleFormSubmit(values: {
    name: string;
    email?: string;
    roleId: string;
  }) {
    try {
      if (editing && editing._id) {
        // Use POST to /api/admins/invite for editing as well, including email
        const res = await fetch("/api/admins/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            email: values.email, // always include email
            roleId: values.roleId,
            _id: editing._id, // pass _id to indicate update
          }),
        });
        if (!res.ok) throw new Error("Update failed");
        const json = await res.json();
        setAdmins((prev) =>
          prev.map((a) => (a._id === json.data._id ? json.data : a))
        );
      } else {
        const res = await fetch("/api/admins/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            email: values.email,
            roleId: values.roleId,  
          }),
        });
        if (!res.ok) throw new Error("Invite failed");
      }
      setShowAdd(false);
      setEditing(null);
      fetchAdmins();
    } catch (err: any) {
      alert(err?.message || "Failed to save admin");
    }
  }

  const columns: Column<Admin>[] = [
    {
      id: "name",
      label: "Name",
      minWidth: 140,
      selector: (r) => r.name || "-",
    },
    { id: "email", label: "Email", minWidth: 180, selector: (r) => r.email },
    {
      id: "role",
      label: "Role",
      minWidth: 140,
      selector: (r) => roleMap[r.roleId || ""] || "-",
    },
    {
      id: "isActive",
      label: "Status",
      minWidth: 100,
      selector: (row) => {
        const roleName = roleMap[row.roleId || ""] || "";
        const disabled = roleName === "SuperAdmin";
        return (
          <button
            onClick={() => !disabled && toggleActive(row._id, row.isActive)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
              disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            }`}
            style={{ backgroundColor: row.isActive ? "#10b981" : "#d1d5db" }}
            title={
              disabled
                ? "Cannot change SuperAdmin status"
                : row.isActive
                ? "Click to deactivate"
                : "Click to activate"
            }
          >
            <span
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                row.isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        );
      },
    },
    {
      id: "actions",
      label: "Actions",
      selector: (r) => {
        const roleName = roleMap[r.roleId || ""] || "";
        const isSuper = roleName === "SuperAdmin";
        return (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => !isSuper && openEdit(r)}
              title={isSuper ? "Edit disabled for SuperAdmin" : "Edit"}
              className={`EditListStyle  ${
                isSuper ? "opacity-60 cursor-not-allowed" : ""
              }`}
              aria-label="Edit"
              disabled={isSuper}
            >
              <EditIcon />
            </button>
          </div>
        );
      },
    },
    {
      id: "resendInvite",
      label: "Resend ",
      minWidth: 140,
      selector: (r) => (
        <CustomButton onClick={() => resendInvite(r._id)} width="200px">
          Reset Password
        </CustomButton>
      ),
    },
  ];

  // client-side filter of admins based on search term (name, email, role)
  const filteredAdmins = admins.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const roleName = roleMap[a.roleId || ""] || "";
    return (
      (a.name || "").toLowerCase().includes(q) ||
      (a.email || "").toLowerCase().includes(q) ||
      roleName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Admin Management"
        subtitle="Manage admin accounts"
        addLabel="Add"
        addShow={true}
        handleAdd={openAdd}
        showBack={false}
      />

      <CustomTable
        columns={columns}
        data={filteredAdmins}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        loading={loading}
      />

      <AdminForm
        open={showAdd}
        onClose={() => {
          setShowAdd(false);
          setEditing(null);
        }}
        onSubmit={handleFormSubmit}
        initialValues={
          editing
            ? {
                name: editing.name,
                email: editing.email,
                roleId: editing.roleId,
              }
            : undefined
        }
        roles={roles}
        editing={!!editing}
      />
    </div>
  );
}
