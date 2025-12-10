"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { showConfirmStatusAlert } from "../components/ConfirmStatusAlert";
import { CustomTable, Column } from "../components/CustomTable";
import HeaderWithAction from "../components/HeaderWithAction";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { CustomTooltip } from "../components/miniComponents";
import { EditIcon } from "lucide-react";
import Swal from "sweetalert2";
import { AddEditPincodeModal } from "./AddEditPincodeModal";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FilterSearch from "../components/FilterSearch";

interface Pincode {
  _id: string;
  pincode: string;
  isActive: boolean;
}

export default function PincodeDashboard() {
  const [pincodes, setPincodes] = useState<Pincode[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPincode, setCurrentPincode] = useState<Pincode | null>(null);

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

  const handleAddPincode = () => {
    setCurrentPincode(null);
    setIsModalOpen(true);
  };

  const handleEditPincode = (pin: Pincode) => {
    setCurrentPincode(pin); // Directly set the pincode value
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPincode(null);
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
                } catch {}
              },
            });
          }}
          className="relative cursor-pointer inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          style={{ backgroundColor: row.isActive ? "#10b981" : "#d1d5db" }}
          title={row.isActive ? "Click to deactivate" : "Click to activate"}
        >
          {" "}
          <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
              row.isActive ? "translate-x-6" : "translate-x-1"
            }`}
          />{" "}
        </button>
      ),
    },
    {
      id: "actions",
      label: "Actions",

      selector: (row) => (
        <div className="flex gap-2">
          {" "}
          <CustomTooltip title="Edit Pincode" placement="top">
            <span>
              <span
                onClick={() => handleEditPincode(row)}
                className="EditListStyle"
              >
                <EditIcon fontSize="small" />
              </span>
            </span>
          </CustomTooltip>
          {/* <CustomTooltip title="Delete Pincode" placement="top">
            <button
              style={{
                cursor: "pointer",
                color: "#ef4444",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
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
      {" "}
      <HeaderWithAction
        title="Pincode Management"
        subtitle="Add, edit, and manage serviceable pincodes"
        showBack={false}
        showSearch={false}
        addLabel="Add "
        addShow={true}
        handleAdd={handleAddPincode}
      />{" "}
      <FilterSearch
        onChange={(f) => setSearch(f.search || "")}
        placeholder="Search pincodes..."
        isSearchShow={true}
        isShowCategory={false}
        isShowSub={false}
        isShowOTC={false} // Disable OTC filter
      />{" "}
      <CustomTable
        columns={columns}
        data={pincodes}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        loading={loading}
      />{" "}
      {loading && (
        <div className="mt-8 text-green-600 text-xl font-bold text-center animate-pulse">
          Loading...{" "}
        </div>
      )}
      {isModalOpen && (
        <AddEditPincodeModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaveSuccess={fetchPincodes}
          id={currentPincode?._id}
          pincode={currentPincode?.pincode}
        />
      )}{" "}
    </div>
  );
}
