"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import { CustomTable, Column } from "../components/CustomTable";
import { CustomTooltip } from "../components/miniComponents";
import { showConfirmStatusAlert } from "../components/ConfirmStatusAlert";
import HeaderWithAction from "../components/HeaderWithAction";
import { EditIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import FilterSearch from "../components/FilterSearch";

type StoreForm = {
  name: string;
  servicePinCodes: string[];
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    gps: string;
  };
  status: number;
};

export default function StoreDashboard() {
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [pincodes, setPincodes] = useState<any[]>([]);
  const [search, setSearch] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<StoreForm>({
    name: "",
    servicePinCodes: [],
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
      gps: "",
    },
    status: 1,
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  console.log(loading, "loadingloading");

  useEffect(() => {
    fetchStores();
    fetchPincodes();
  }, []);

  async function fetchStores(q?: string) {
    setLoading(true);
    setError("");
    try {
      const query = q ?? search;
      const url = query
        ? `/api/admin/store?search=${encodeURIComponent(query)}`
        : "/api/admin/store";
      const res = await axios.get(url);
      setStores(res.data.data || []);
    } catch {
      setError("Failed to fetch stores");
    }
    setLoading(false);
  }

  async function fetchPincodes() {
    try {
      const res = await axios.get("/api/admin/pincode");
      setPincodes(res.data.data || []);
    } catch {
      setError("Failed to fetch pincodes");
    }
  }

  async function handleStoreSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (editId) {
        await axios.put(`/api/admin/store?id=${editId}`, form);
      } else {
        await axios.post("/api/admin/store", form);
      }
      setShowModal(false);
      setForm({
        name: "",
        servicePinCodes: [],
        address: {
          street: "",
          city: "",
          state: "",
          country: "",
          pincode: "",
          gps: "",
        },
        status: 1,
      });
      setEditId(null);
      fetchStores();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        (editId ? "Error updating store" : "Error adding store")
      );
    }
    setLoading(false);
  }

  function openAddStore() {
    window.location.href = "/dashboard/store/new";
  }

  function openEditStore(store: any) {
    setEditId(store._id);
    setForm({
      name: store.name,
      servicePinCodes: store.servicePinCodes || [],
      address: store.address || {
        street: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
        gps: "",
      },
      status: store.status ?? 1,
    });
    setShowModal(true);
  }

  // CustomTable columns definition
  const columns: Column<any>[] = [
    {
      id: "name",
      label: "Name",
      minWidth: 120,
      selector: (row) => (
        <CustomTooltip title={row.name} placement="top">
          <span className="font-semibold cursor-pointer hover:text-green-700 transition">
            {row.name}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "servicePinCodes",
      label: "Service PinCodes",
      minWidth: 180,
      selector: (row) => {
        const pins: string[] = row.servicePinCodes || [];
        const visible = pins.slice(0, 3);
        const extraCount = pins.length - visible.length;
        return (
          <div className="flex flex-wrap gap-2 items-center">
            {visible.map((pin) => (
              <span
                key={pin}
                className="inline-flex items-center px-3 py-1 rounded-full bg-linear-to-r from-green-100 to-green-200 text-green-800 font-semibold shadow-sm border border-green-300 text-sm"
                style={{ fontSize: "0.95rem" }}
              >
                {pin}
              </span>
            ))}
            {extraCount > 0 && (
              <CustomTooltip
                title={
                  <div className="flex flex-col">
                    {pins.map((p) => (
                      <span key={p} className="text-sm py-0.5">
                        {p}
                      </span>
                    ))}
                  </div>
                }
                placement="top"
              >
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold shadow-sm border border-gray-200 text-sm cursor-pointer"
                  style={{ fontSize: "0.95rem" }}
                >
                  +{extraCount}
                </span>
              </CustomTooltip>
            )}
          </div>
        );
      },
    },
    {
      id: "status",
      label: "Status",
      minWidth: 100,
      selector: (row) => (
        <button
          onClick={() => {
            showConfirmStatusAlert({
              isActive: row.status === 1,
              title: row.status === 1 ? "Deactivate Store?" : "Activate Store?",
              text:
                row.status === 1
                  ? "Are you sure you want to deactivate this store?"
                  : "Are you sure you want to activate this store?",
              confirmText: row.status === 1 ? "Deactivate" : "Activate",
              cancelText: "Cancel",
              onConfirm: async () => {
                try {
                  await axios.put(`/api/admin/store?id=${row._id}`, {
                    ...row,
                    status: row.status === 1 ? 0 : 1,
                  });
                  fetchStores();
                } catch {
                  // Optionally show error toast
                }
              },
            });
          }}
          className="relative cursor-pointer inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          style={{
            backgroundColor: row.status === 1 ? "#10b981" : "#d1d5db",
          }}
          title={
            row.status === 1 ? "Click to deactivate" : "Click to activate"
          }
        >
          <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
              row.status === 1 ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      minWidth: 60,
      selector: (row) => (
        <CustomTooltip title="Edit Store" placement="top">
          <span
            style={{
              cursor: "pointer",
              color: "var(--primary)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            onClick={() => router.push(`/dashboard/store/edit/${row._id}`)}
          >
            <EditIcon fontSize="small" />
          </span>
        </CustomTooltip>
      ),
    },
  ];

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Stores"
        subtitle="Manage your store locations and service pincodes"
        showBack={false}
        showSearch={false}
        addLabel="Add "
        addShow={true}
        handleAdd={() => setShowModal(true)}
      />

      <FilterSearch
        onChange={(f) => setSearch(f.search || "")}
        placeholder="Search stores..."
        isSearchShow={true}
        isShowCategory={false}
        isShowSub={false}
        isShowOTC={false} // Disable OTC filter
      />

      <CustomTable
        columns={columns}
        data={stores}
        page={0}
        rowsPerPage={100}
        totalCount={stores.length}
        onPageChange={() => {}}
        loading={loading}
      />
      {error && (
        <div className="text-red-600 text-lg font-semibold mt-4">{error}</div>
      )}
    </div>
  );
}
