"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

import { CustomTable, Column } from "../components/CustomTable";
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
      selector: (row) => <span className="font-semibold">{row.name}</span>,
    },
    {
      id: "servicePinCodes",
      label: "Service PinCodes",
      minWidth: 180,
      selector: (row) => (
        <div>
          {row.servicePinCodes?.map((pin: string) => (
            <span
              key={pin}
              className="inline-block bg-blue-100 text-blue-700 font-bold px-4 py-1 rounded-full mr-2 text-lg"
            >
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
      minWidth: 120,
      selector: (row) => (
        <Link
          href={`/dashboard/store/edit/${row._id}`}
          className="px-5 py-2 rounded-lg font-bold text-white bg-yellow-400 hover:bg-yellow-500 shadow"
        >
          Edit
        </Link>
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
      <div className="w-full bg-white rounded-lg shadow-md p-4">
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
    </div>
  );
}
