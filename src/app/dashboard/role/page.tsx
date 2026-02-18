"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { ToastMessages } from "@/utils/ToasterMessage";
import HeaderWithAction from "../components/HeaderWithAction";
import { CustomTable, Column } from "../components/CustomTable";
import { CustomTooltip, CustomButton } from "../components/miniComponents";
import RoleModal from './RoleModal';
import { EditIcon } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";

interface RoleItem {
  _id: string;
  name: string;
  permissions?: string[];
  isActive: boolean;
}

const RoleSchema = Yup.object().shape({
  name: Yup.string().required("Role name is required"),
  permissions: Yup.array().of(Yup.string()),
  isActive: Yup.boolean().required(),
});

export default function RolePage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminPermissions, setAdminPermissions] = useState<any>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem("adminPermissions");
      if (p) setAdminPermissions(JSON.parse(p));
    } catch (e) {
      // ignore
    }
  }, []);

  const canEditRoles = adminPermissions?.Role?.edit ?? true;

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("limit", rowsPerPage.toString());
      params.append("offset", (page * rowsPerPage).toString());
      if (search) params.append("name", search);
      const res = await axios.get(`/api/admin/role?${params.toString()}`);
      setRoles(res.data.data || []);
      setTotalCount(
        res.data.total || (res.data.data ? res.data.data.length : 0)
      );
    } catch (err) {
      setRoles([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoles();
  }, [page, rowsPerPage, search]);

  const formik = useFormik({
    initialValues: { name: "", permissions: [], isActive: true },
    validationSchema: RoleSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        if (editId) {
          await axios.put(`/api/admin/role?id=${editId}`, values);
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: ToastMessages.ROLE_UPDATED,
            showConfirmButton: false,
            timer: 2000,
          });
        } else {
          await axios.post("/api/admin/role", values);
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: ToastMessages.ROLE_CREATED,
            showConfirmButton: false,
            timer: 2000,
          });
        }
        resetForm();
        setShowModal(false);
        setEditId(null);
        fetchRoles();
      } catch (err: any) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: editId ? ToastMessages.ROLE_UPDATE_FAILED : ToastMessages.ROLE_CREATE_FAILED,
          text: err?.response?.data?.message || "An error occurred",
          showConfirmButton: false,
          timer: 2000,
        });
      }
    },
  });

  const handleEdit = async (role: RoleItem) => {
    if (role.name === "SuperAdmin") {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: ToastMessages.SUPERADMIN_ROLE_LOCKED,
        showConfirmButton: false,
        timer: 2000,
      });
      return;
    }
    setEditId(role._id);
    formik.setValues({
      name: role.name,
      permissions: role.permissions || [],
      isActive: role.isActive,
    } as any);
    setShowModal(true);
  };

  const handleToggle = (id: string, isActive: boolean) => {
    const role = roles.find((r) => r._id === id);
    if (role?.name === "SuperAdmin") {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: ToastMessages.SUPERADMIN_STATUS_LOCKED_ROLE,
        showConfirmButton: false,
        timer: 2000,
      });
      return;
    }

    Swal.fire({
      title: isActive ? "Inactivate Role?" : "Activate Role?",
      text: isActive
        ? "Are you sure you want to inactivate this role?"
        : "Are you sure you want to activate this role?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: isActive ? "Inactivate" : "Activate",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      if (!canEditRoles) return; // double check
      try {
        const res = await axios.patch(`/api/admin/role/${id}/toggle-status`);
        if (res.data.success) {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: res.data.data?.isActive
              ? ToastMessages.ROLE_ACTIVATED
              : ToastMessages.ROLE_DEACTIVATED,
            showConfirmButton: false,
            timer: 2000,
          });
          setRoles((prev) =>
            prev.map((r) =>
              r._id === id ? { ...r, isActive: !r.isActive } : r
            )
          );
        }
      } catch (err) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: ToastMessages.ROLE_STATUS_UPDATE_FAILED,
          showConfirmButton: false,
          timer: 2000,
        });
      }
    });
  };

  const columns: Column<RoleItem>[] = [
    {
      id: "name",
      label: "Role Name",
      selector: (row) => <span>{row.name}</span>,
    },

    {
      id: "isActive",
      label: "Status",
      selector: (row) => {
        const isSuper = row.name === "SuperAdmin";
        return (
          <CustomTooltip title={isSuper ? "Cannot change SuperAdmin status" : (!canEditRoles ? "Status Toggle Permission Denied" : (row.isActive ? "Click to deactivate" : "Click to activate"))}>
            <button
              onClick={() => !isSuper && canEditRoles && handleToggle(row._id, row.isActive)}
              disabled={!canEditRoles && !isSuper}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${isSuper || !canEditRoles ? "opacity-60 cursor-not-allowed" : ""
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
      selector: (row) => {
        const isSuper = row.name === "SuperAdmin";
        return (
          <div className="flex gap-2">
            <CustomTooltip title={isSuper ? "Edit disabled for SuperAdmin" : (!canEditRoles ? "Edit Permission Denied" : "Edit")}>
              <button
                onClick={() => !isSuper && canEditRoles && handleEdit(row)}
                disabled={isSuper || !canEditRoles}
                className={`flex items-center justify-center p-2 rounded ${isSuper || !canEditRoles ? 'opacity-60 cursor-not-allowed' : ''}`}
                aria-label="Edit"
              >
                <EditIcon fontSize="small" />
              </button>
            </CustomTooltip>
          </div>
        );
      },
    },
  ];

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Admin Roles"
        subtitle="Manage admin roles and permissions"
        showBack={false}
        showSearch={true}
        searchValue={search}
        onSearchChange={setSearch}
        addLabel="Add "
        addShow={canEditRoles}
        handleAdd={() => {
          setShowModal(true);
          setEditId(null);
          formik.resetForm();
        }}
      />

      <CustomTable
        columns={columns}
        data={roles}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        loading={loading}
      />
      <RoleModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditId(null); formik.resetForm(); }}
        formik={formik}
        roles={roles}
        editId={editId}
        setEditId={setEditId}
      />
    </div>
  );
}
