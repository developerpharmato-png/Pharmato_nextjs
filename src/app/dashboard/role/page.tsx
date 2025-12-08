"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import HeaderWithAction from "../components/HeaderWithAction";
import { CustomTable, Column } from "../components/CustomTable";
import { CustomTooltip, CustomButton, CustomCloseButton } from "../components/miniComponents";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControlLabel, Box } from '@mui/material';
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
            title: "Role updated",
            showConfirmButton: false,
            timer: 2000,
          });
        } else {
          await axios.post("/api/admin/role", values);
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Role added",
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
          icon: "error",
          title: "Error",
          text: err?.response?.data?.message || "Failed",
        });
      }
    },
  });

  const handleEdit = async (role: RoleItem) => {
    if (role.name === "SuperAdmin") {
      alert("Cannot edit SuperAdmin role");
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
      alert("Cannot change status of SuperAdmin");
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
      try {
        const res = await axios.patch(`/api/admin/role/${id}/toggle-status`);
        if (res.data.success) {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Status updated",
            showConfirmButton: false,
            timer: 1500,
          });
          setRoles((prev) =>
            prev.map((r) =>
              r._id === id ? { ...r, isActive: !r.isActive } : r
            )
          );
        }
      } catch (err) {
        Swal.fire({ icon: "error", title: "Failed to update status" });
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
          <button
            onClick={() => !isSuper && handleToggle(row._id, row.isActive)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
              isSuper ? "opacity-60 cursor-not-allowed" : ""
            }`}
            style={{ backgroundColor: row.isActive ? "#10b981" : "#d1d5db" }}
            title={
              isSuper
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
      selector: (row) => {
        const isSuper = row.name === "SuperAdmin";
        return (
          <div className="flex gap-2">
            <CustomTooltip title={isSuper ? "Edit disabled for SuperAdmin" : "Edit"}>
              <button
                onClick={() => !isSuper && handleEdit(row)}
                disabled={isSuper}
                className={`flex items-center justify-center p-2 rounded ${isSuper ? 'opacity-60 cursor-not-allowed' : ''}`}
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
        addShow={true}
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
      <Dialog
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditId(null);
          formik.resetForm();
        }}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            // Set dialog width to ~30vw but keep a sensible min width for small screens
            width: '30vw',
            maxWidth: '30vw',
            minWidth: 320,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pr: 1,
            fontWeight: 600,
            fontSize: '1.25rem',
            color: 'var(--primary)',
            borderBottom: '1px solid #e0e0e0',
            mb: 0,
            pb: 1,
          }}
        >
          {editId ? 'Edit Role' : 'Add New Role'}
          <CustomCloseButton
            onClick={() => {
              setShowModal(false);
              setEditId(null);
              formik.resetForm();
            }}
            size="medium"
            ariaLabel="Close modal"
          />
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 3, pb: 2, borderBottom: 'none' }}>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Role Name"
              fullWidth
              size="medium"
              variant="outlined"
              {...formik.getFieldProps('name')}
              error={formik.touched.name && Boolean(formik.errors.name)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 }, bgcolor: (!!editId && roles.find((r) => r._id === editId)?.name === 'SuperAdmin') ? '#f5f5f5' : 'inherit' }}
              disabled={!!editId && roles.find((r) => r._id === editId)?.name === 'SuperAdmin'}
            />
            {formik.touched.name && formik.errors.name && (
              <div className="text-sm text-red-600 mt-1">{formik.errors.name}</div>
            )}

            {!!editId && roles.find((r) => r._id === editId)?.name === 'SuperAdmin' && (
              <p className="mt-1 text-xs text-red-500 font-medium">Role name is locked for SuperAdmin.</p>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={formik.values.isActive}
                  onChange={(e) => formik.setFieldValue('isActive', e.target.checked)}
                  disabled={!!editId && roles.find((r) => r._id === editId)?.name === 'SuperAdmin'}
                />
              }
              label="Role is Active"
            />

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <CustomButton type="submit" disabled={formik.isSubmitting}>{formik.isSubmitting ? 'Saving...' : editId ? 'Update ' : 'Add '}</CustomButton>
            </div>
          </Box>
        </DialogContent>

        <DialogActions sx={{ pr: 3, pb: 2, pt: 2, borderTop: '1px solid #e0e0e0' }} />
      </Dialog>
    </div>
  );
}
