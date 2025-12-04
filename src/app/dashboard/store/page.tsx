"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";


import { CustomTable, Column } from "../components/CustomTable";
import { CustomTooltip } from "../components/miniComponents";
import HeaderWithAction from "../components/HeaderWithAction";

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
  const [stores, setStores] = useState<any[]>([]);
  const [pincodes, setPincodes] = useState<any[]>([]);
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

  useEffect(() => {
    fetchStores();
    fetchPincodes();
  }, []);

  async function fetchStores() {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/admin/store");
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
          <span className="font-semibold cursor-pointer hover:text-green-700 transition">{row.name}</span>
        </CustomTooltip>
      ),
    },
    {
      id: "servicePinCodes",
      label: "Service PinCodes",
      minWidth: 180,
      selector: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.servicePinCodes?.map((pin: string) => (
            <span
              key={pin}
              className="inline-flex items-center px-3 py-1 rounded-full bg-linear-to-r from-green-100 to-green-200 text-green-800 font-semibold shadow-sm border border-green-300 text-sm"
              style={{ fontSize: "0.95rem" }}
            >
              <svg className="w-4 h-4 mr-1 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
              {pin}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: "status",
      label: "Status",
      minWidth: 100,
      selector: (row) =>
        row.status === 1 ? (
          <span className="inline-block bg-green-100 text-green-700 font-bold px-4 py-1 rounded-full text-lg">
            Active
          </span>
        ) : (
          <span className="inline-block bg-gray-200 text-gray-600 font-bold px-4 py-1 rounded-full text-lg">
            Inactive
          </span>
        ),
    },
    {
      id: "actions",
      label: "Actions",
      minWidth: 60,
      selector: (row) => (
        <CustomTooltip title="Edit Store" placement="top">
          <Link
            href={`/dashboard/store/edit/${row._id}`}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-yellow-100 text-yellow-700"
          >
            <EditOutlinedIcon fontSize="small" />
          </Link>
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
        addHref="/dashboard/store/new"
        addShow={true}
        handleAdd={openAddStore}
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
