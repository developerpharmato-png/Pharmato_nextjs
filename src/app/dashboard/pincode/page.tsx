"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { CustomTable, Column } from "../components/CustomTable";
import HeaderWithAction from "../components/HeaderWithAction";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { CustomButton, CustomTooltip } from "../components/miniComponents";
import { EditIcon } from "lucide-react";

export default function PincodeDashboard() {
  const [pincodes, setPincodes] = useState([]);
  const [form, setForm] = useState({ pincode: "", isActive: true });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPincodes = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/pincode");
      setPincodes(res.data.data || []);
    } catch (err) {
      setError("Failed to fetch pincodes");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPincodes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (editId) {
        await axios.put("/api/admin/pincode", { id: editId, ...form });
      } else {
        await axios.post("/api/admin/pincode", form);
      }
      setForm({ pincode: "", isActive: true });
      setEditId(null);
      fetchPincodes();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error saving pincode");
    }
    setLoading(false);
  };

  const handleEdit = (pin: any) => {
    setForm({ pincode: pin.pincode, isActive: pin.isActive });
    setEditId(pin._id);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Delete Pincode?",
      text: "Are you sure you want to delete this pincode?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    setLoading(true);
    setError("");
    try {
      await axios.delete("/api/admin/pincode", { data: { id } });
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Pincode deleted",
        showConfirmButton: false,
        timer: 2000,
      });
      fetchPincodes();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: err?.response?.data?.message || "Error deleting pincode",
      });
    }
    setLoading(false);
  };

  // CustomTable columns definition
  const columns: Column<any>[] = [
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
      label: "Active",
      minWidth: 80,
      selector: (row) =>
        row.isActive ? (
          <span className="inline-block px-4 py-1 rounded-full bg-green-100 text-green-800 font-semibold text-sm shadow">
            Yes
          </span>
        ) : (
          <span className="inline-block px-4 py-1 rounded-full bg-red-100 text-red-800 font-semibold text-sm shadow">
            No
          </span>
        ),
    },
    {
      id: "actions",
      label: "Actions",
      minWidth: 80,
      selector: (row) => (
        <div className="flex gap-2">
          <CustomTooltip title="Edit Pincode" placement="top">
            <span
              style={{
                cursor: "pointer",
                color: "var(--primary)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              onClick={() => handleEdit(row)}
            >
              <EditIcon fontSize="small" />
            </span>
          </CustomTooltip>
          <CustomTooltip title="Delete Pincode" placement="top">
            <button
              className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-100 text-red-700"
              onClick={() => handleDelete(row._id)}
              disabled={loading}
            >
              <DeleteOutlineIcon fontSize="small" />
            </button>
          </CustomTooltip>
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
        showSearch={false}
      />

      <form
        onSubmit={handleSubmit}
        className="mb-8 flex flex-wrap gap-4 items-end bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm"
      >
        <input
          type="text"
          placeholder="Enter pincode"
          value={form.pincode}
          required
          className="border border-gray-300 px-4 py-3 rounded-lg w-48 focus:outline-none focus:border-green-500 text-base shadow-sm"
          onChange={(e) => setForm({ ...form, pincode: e.target.value })}
        />
        <label className="flex items-center gap-2 text-lg">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
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
          disabled={loading}
        >
          {editId ? "Update" : "Add"}
        </CustomButton>
        {editId && (
          <CustomButton
            type="button"
            className="px-8 py-3 rounded-lg bg-gray-300 hover:bg-gray-400 font-semibold text-gray-700 shadow-md"
            onClick={() => {
              setEditId(null);
              setForm({ pincode: "", isActive: true });
            }}
          >
            Cancel
          </CustomButton>
        )}
      </form>
      {error && (
        <div className="text-red-600 mb-4 font-semibold text-center text-lg">
          {error}
        </div>
      )}
      <CustomTable
        columns={columns}
        data={pincodes}
        page={0}
        rowsPerPage={100}
        totalCount={pincodes.length}
        onPageChange={() => {}}
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
