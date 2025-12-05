"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { showConfirmStatusAlert } from "../components/ConfirmStatusAlert";
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
          // Optionally show a toast/notification here
          fetchPincodes();
        } catch (err: any) {
          setError(err?.response?.data?.message || "Error deleting pincode");
        }
        setLoading(false);
      },
    });
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
      label: "Delete",
      minWidth: 60,
      selector: (row) => (
        <CustomTooltip title="Delete Pincode" placement="top">
          <button
            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-100 text-red-700"
            onClick={() => handleDelete(row._id)}
            disabled={loading}
          >
            <DeleteOutlineIcon fontSize="small" />
          </button>
        </CustomTooltip>
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
