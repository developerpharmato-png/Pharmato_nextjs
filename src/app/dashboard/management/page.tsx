"use client";
import { customPost, customGet } from "../BaseURL/CustomNetwork";
import React, { useEffect, useState } from "react";
import HeaderWithAction from "../components/HeaderWithAction";
import { CustomTable, Column } from "../components/CustomTable";
import { showConfirmStatusAlert } from "../components/ConfirmStatusAlert";
import AdminForm from "./AdminForm";
import { Edit2Icon, EditIcon, Trash2 } from "lucide-react";
import { CustomButton, CustomTooltip } from "../components/miniComponents";
import Swal from "sweetalert2";
import { ToastMessages } from "@/utils/ToasterMessage";

type Admin = {
  _id: string;
  name?: string;
  email: string;
  roleId?: string;
  roleName?: string;
  isActive?: boolean;
  mobile?: string;
};

type Role = { _id: string; name: string };

export default function ManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Admin | null>(null);
  const [search, setSearch] = useState<string>("");
  const [adminPermissions, setAdminPermissions] = useState<any>(null);

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
    try {
      const p = localStorage.getItem("adminPermissions");
      if (p) setAdminPermissions(JSON.parse(p));
    } catch (e) {
      // ignore
    }
  }, []);

  const canEditManagement = adminPermissions?.Management?.edit ?? true;

  useEffect(() => {
    fetchAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  // reset to first page when search changes
  useEffect(() => {
    setPage(0);
  }, [search]);

  async function resendInvite(id: string) {
    try {
      const admin = admins.find((a) => a._id === id);
      await customPost(`/api/admins/${id}/resend-invite`, {
        email: admin?.email,
      });
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: ToastMessages.ADMIN_INVITE_RESENT,
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err: any) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: ToastMessages.ADMIN_INVITE_RESEND_FAILED,
        text: err?.message,
        showConfirmButton: false,
        timer: 2000,
      });
    }
  }

  async function toggleActive(id: string, isActive?: boolean) {
    // Prevent toggling SuperAdmin accounts
    const row = admins.find((a) => a._id === id);
    const rowRole = row ? roleMap[row.roleId || ""] || "" : "";
    if (rowRole === "SuperAdmin") {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: ToastMessages.SUPERADMIN_STATUS_LOCKED,
        showConfirmButton: false,
        timer: 2000,
      });
      return;
    }

    showConfirmStatusAlert({
      isActive: !!isActive,
      title: isActive ? "Deactivate admin?" : "Activate admin?",
      text: isActive ? "Deactivate this admin?" : "Activate this admin?",
      confirmText: isActive ? "Deactivate" : "Activate",
      onConfirm: async () => {
        if (!canEditManagement) return; // double check
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
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: updated.isActive
              ? ToastMessages.ADMIN_ACTIVATED
              : ToastMessages.ADMIN_DEACTIVATED,
            showConfirmButton: false,
            timer: 2000,
          });
        } catch (err) {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
            title: ToastMessages.ADMIN_STATUS_UPDATE_FAILED,
            showConfirmButton: false,
            timer: 2000,
          });
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
    mobile: string;
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
            mobile: values.mobile,
            _id: editing._id, // pass _id to indicate update
          }),
        });
        if (!res.ok) throw new Error("Update failed");
        const json = await res.json();
        setAdmins((prev) =>
          prev.map((a) => (a._id === json.data._id ? json.data : a))
        );
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: ToastMessages.ADMIN_UPDATED,
          showConfirmButton: false,
          timer: 2000,
        });
      } else {
        const res = await fetch("/api/admins/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            email: values.email,
            roleId: values.roleId,
            mobile: values.mobile,
          }),
        });
        if (!res.ok) throw new Error("Invite failed");
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: ToastMessages.ADMIN_CREATED,
          showConfirmButton: false,
          timer: 2000,
        });
      }
      setShowAdd(false);
      setEditing(null);
      fetchAdmins();
    } catch (err: any) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: ToastMessages.ADMIN_CREATE_FAILED,
        text: err?.message || "An error occurred",
        showConfirmButton: false,
        timer: 2000,
      });
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
      id: "mobile",
      label: "Mobile",
      minWidth: 140,
      selector: (r) => (
        <div className="">{r.mobile ? `+91 ${r.mobile}` : "-"}</div>
      ),
    },
    {
      id: "role",
      label: "Role",
      minWidth: 140,
      selector: (r) => (
        <div className="">{r.roleName || roleMap[r.roleId || ""] || "-"}</div>
      ),
    },
    {
      id: "isActive",
      label: "Status",
      minWidth: 100,
      selector: (row) => {
        const roleName = row.roleName || roleMap[row.roleId || ""] || "";
        const disabled = roleName === "SuperAdmin";
        return (
          <CustomTooltip title={disabled ? "Cannot change SuperAdmin status" : (!canEditManagement ? "Status Toggle Permission Denied" : (row.isActive ? "Click to deactivate" : "Click to activate"))}>
            <button
              onClick={() => !disabled && canEditManagement && toggleActive(row._id, row.isActive)}
              disabled={disabled || !canEditManagement}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${disabled || !canEditManagement ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                }`}
              style={{ backgroundColor: row.isActive ? "#10b981" : "#d1d5db" }}
            >
              <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${row.isActive ? "translate-x-6" : "translate-x-1"
                  }`}
              />
            </button>
          </CustomTooltip>
        );
      },
    },
    {
      id: "actions",
      label: "Actions",
      selector: (r) => {
        const roleName = r.roleName || roleMap[r.roleId || ""] || "";
        const isSuper = roleName === "SuperAdmin";
        return (
          <div className="flex items-center justify-center gap-3">
            <CustomTooltip title={isSuper ? "Edit disabled for SuperAdmin" : (!canEditManagement ? "Edit Permission Denied" : "Edit")}>
              <button
                onClick={() => !isSuper && canEditManagement && openEdit(r)}
                className={`EditListStyle  ${isSuper || !canEditManagement ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                aria-label="Edit"
                disabled={isSuper || !canEditManagement}
              >
                <EditIcon />
              </button>
            </CustomTooltip>
          </div>
        );
      },
    },
    {
      id: "resendInvite",
      label: "Reset Password",
      minWidth: 140,
      selector: (r) => (
        <CustomTooltip title={!canEditManagement ? "Reset Password Permission Denied" : ""}>
          <div className="w-full h-full flex items-center justify-center">
            <CustomButton
              onClick={() => canEditManagement && resendInvite(r._id)}
              width="160px"
              disabled={!canEditManagement}
              className={!canEditManagement ? "opacity-60 cursor-not-allowed" : ""}
            >
              Reset Password
            </CustomButton>
          </div>
        </CustomTooltip>
      ),
    },
  ];

  // client-side filter of admins based on search term (name, email, role)
  const filteredAdmins = admins.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const roleName = a.roleName || roleMap[a.roleId || ""] || "";
    return (
      (a.name || "").toLowerCase().includes(q) ||
      (a.email || "").toLowerCase().includes(q) ||
      (a.mobile || "").toLowerCase().includes(q) ||
      roleName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Admin Management"
        subtitle="Manage admin accounts"
        addLabel="Add"
        addShow={canEditManagement}
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
              mobile: editing.mobile,
            }
            : undefined
        }
        roles={roles}
        editing={!!editing}
      />
    </div>
  );
}
