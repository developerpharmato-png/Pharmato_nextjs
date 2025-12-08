"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { showConfirmStatusAlert } from "../components/ConfirmStatusAlert";
import { CustomTable, Column } from "../components/CustomTable";
import HeaderWithAction from "../components/HeaderWithAction";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  CustomButton,
  CustomTooltip,
  ErrorMessageCom,
} from "../components/miniComponents";
import { EditIcon } from "lucide-react";
import Swal from "sweetalert2";
import { useFormik } from "formik";
import * as Yup from "yup";

interface Pincode {
  _id: string;
  pincode: string;
  isActive: boolean;
}
const PincodeSchema = Yup.object().shape({
  pincode: Yup.string()
    .required("Pincode(s) required")
    .test(
      "bulk-pincode",
      "Each pincode must be 6 digits, not start with 0",
      (value) => {
        if (!value) return false;
        const pins = value.split(/[,\s]+/).filter(Boolean);
        return pins.every((pin) => /^([1-9][0-9]{5})$/.test(pin));
      }
    ),
  isActive: Yup.boolean().required(),
});

// --- MAIN COMPONENT ---

export default function PincodeDashboard() {
  const [pincodes, setPincodes] = useState<Pincode[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<"ASC" | "DESC">("ASC");

  const fetchPincodes = async () => {
    setLoading(true);
    try {
      const params = {
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        pincode: search,
        sortBy,
      };
      const res = await axios.get("/api/admin/pincode", { params });
      setPincodes(res.data.data || []);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      setError("Failed to fetch pincodes");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPincodes();
  }, [search, page, rowsPerPage, sortBy]);

  // --- FORMIK SETUP ---
  const formik = useFormik({
    initialValues: {
      pincode: "",
      isActive: true,
    },
    validationSchema: PincodeSchema,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      setError("");

      try {
        const successMessage = editId
          ? "Pincode updated successfully!"
          : "Pincode added successfully!";

        if (editId) {
          await axios.put("/api/admin/pincode", { id: editId, ...values });
        } else {
          await axios.post("/api/admin/pincode", values);
        }

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: successMessage,
          showConfirmButton: false,
          timer: 2000,
        });

        resetForm(); // Reset form fields to initial values
        setEditId(null);
        fetchPincodes();
      } catch (err: any) {
        setError(err?.response?.data?.message || "Error saving pincode");
      }
      setLoading(false);
    },
  });

  const handleEdit = (pin: Pincode) => {
    formik.setValues({ pincode: pin.pincode, isActive: pin.isActive });
    formik.setErrors({}); // Clear validation errors when starting edit
    formik.setTouched({});
    setEditId(pin._id);
  };

  const handleCancelEdit = () => {
    formik.resetForm();
    setEditId(null);
  };

  const handleDelete = async (id: string) => {
    showConfirmStatusAlert({
      isActive: false,
      title: "Delete Pincode?",
      text: "Are you sure you want to delete this pincode?",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        setLoading(true);
        setError("");
        try {
          await axios.delete("/api/admin/pincode", { data: { id } });

          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Pincode deleted successfully!",
            showConfirmButton: false,
            timer: 2000,
          });

          fetchPincodes();
        } catch (err: any) {
          setError(err?.response?.data?.message || "Error deleting pincode");
        }
        setLoading(false);
      },
    });
  };

  // CustomTable columns definition (Uses Formik to trigger edit)
  const columns: Column<Pincode>[] = [
    {
      id: "pincode",
      label: "Pincode",
      minWidth: 120,
      selector: (row) => (
        <span className="font-mono text-lg text-gray-800">{row.pincode}</span>
      ),
    },
    {
      id: "isActive",
      label: "Status",
      minWidth: 80,
      selector: (row) => (
        <button
          onClick={() => {
            showConfirmStatusAlert({
              isActive: !!row.isActive,
              title: row.isActive ? "Deactivate Pincode?" : "Activate Pincode?",
              text: row.isActive
                ? "Are you sure you want to deactivate this pincode?"
                : "Are you sure you want to activate this pincode?",
              confirmText: row.isActive ? "Deactivate" : "Activate",
              cancelText: "Cancel",
              onConfirm: async () => {
                try {
                  await axios.put("/api/admin/pincode", {
                    id: row._id,
                    pincode: row.pincode,
                    isActive: !row.isActive,
                  });
                  Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: `Pincode ${
                      !row.isActive ? "activated" : "deactivated"
                    } successfully!`,
                    showConfirmButton: false,
                    timer: 2000,
                  });
                  fetchPincodes();
                } catch {
                  // Optionally show error toast
                }
              },
            });
          }}
          className="relative cursor-pointer inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          style={{ backgroundColor: row.isActive ? "#10b981" : "#d1d5db" }}
          title={row.isActive ? "Click to deactivate" : "Click to activate"}
        >
          <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
              row.isActive ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      minWidth: 100,
      selector: (row) => (
        <div className="flex gap-2">
          <CustomTooltip title="Edit Pincode" placement="top">
            <button
              style={{
                cursor: "pointer",
                color: "var(--primary)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              onClick={() => handleEdit(row)}
              disabled={loading}
            >
              <EditIcon fontSize="small" />
            </button>
          </CustomTooltip>

          {/* <CustomTooltip title="Delete Pincode" placement="top">
            <button
              className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-100 text-red-700"
              onClick={() => handleDelete(row._id)}
              disabled={loading}
            >
              <DeleteOutlineIcon fontSize="small" />
            </button>
          </CustomTooltip> */}
        </div>
      ),
    },
  ];

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Pincode Management"
        subtitle="Add, edit, and manage serviceable pincodes"
        showBack={false}
        showSearch={true}
        searchValue={search}
        onSearchChange={setSearch}
      />

      {/* --- FORMIK FORM --- */}
      <form
        onSubmit={formik.handleSubmit}
        className="mb-8 flex flex-wrap gap-4 items-end bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm"
      >
        <div>
          <input
            type="text"
            placeholder="Enter pincode"
            className="border border-gray-300 px-4 py-3 rounded-lg w-64 focus:outline-none focus:border-green-500 text-base shadow-sm"
            id="pincode"
            name="pincode"
            value={formik.values.pincode}
            onChange={(e) => {
              // Only allow numbers, spaces, and commas
              const filtered = e.target.value.replace(/[^0-9,\s]/g, "");
              formik.setFieldValue("pincode", filtered);
            }}
            onBlur={formik.handleBlur}
          />
          {/* Formik Error Display */}
          {formik.touched.pincode && formik.errors.pincode && (
            <ErrorMessageCom error={formik.errors.pincode} />
          )}
        </div>

        <label className="flex items-center gap-2 text-lg">
          <input
            type="checkbox"
            // Formik Bindings
            id="isActive"
            name="isActive"
            checked={formik.values.isActive}
            onChange={formik.handleChange}
            className="accent-green-600 w-5 h-5"
          />
          <span className="text-green-700 font-bold">Active</span>
        </label>

        <CustomButton
          type="submit"
          className={`px-8 py-3 rounded-lg font-semibold text-white transition shadow-md ${
            editId
              ? "bg-yellow-500 hover:bg-yellow-600"
              : "bg-green-600 hover:bg-green-700"
          }`}
          disabled={loading || !formik.isValid}
        >
          {editId ? "Update" : "Add"}
        </CustomButton>
        {editId && (
          <CustomButton
            type="button"
            className="px-8 py-3 rounded-lg bg-gray-300 hover:bg-gray-400 font-semibold text-gray-700 shadow-md"
            onClick={handleCancelEdit}
          >
            Cancel
          </CustomButton>
        )}
      </form>
      {/* --- END FORMIK FORM --- */}

      {error && (
        <div className="text-red-600 mb-4 font-semibold text-center text-lg">
          {error}
        </div>
      )}
      <CustomTable
        columns={columns}
        data={pincodes}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        loading={loading}
      />

      {loading && (
        <div className="mt-8 text-green-600 text-xl font-bold text-center animate-pulse">
          Loading...
        </div>
      )}
    </div>
  );
}
