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
import { StoreListStore, StoreUpdateStore } from "../storeAPICall/useUserStore";
import { StorePath } from "../storeAPICall/API/BaseApi";

interface StoreForm {
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
}

export default function StoreDashboard() {
  const router = useRouter();
  const [search, setSearch] = useState<string>("");
  
  const {
    fetchData: GetStores,
    loading: storesLoading,
    data: storesData,
  } = StoreListStore();
  
  const {
    putData: UpdateStoreStatus,
    loading: updateStatusLoading,
  } = StoreUpdateStore();
  
  const [stores, setStores] = useState<any[]>([]);
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
    GetStores({ url: StorePath, data: { isListRequest: true } });
  }, []);

  useEffect(() => {
    const query = search.trim();
    GetStores({ url: StorePath, data: { isListRequest: true, search: query } });
  }, [search]);

  useEffect(() => {
    if (storesData?.data && Array.isArray(storesData.data)) {
      setStores(storesData.data);
    } else {
      setStores([]);
    }
  }, [storesData]);

  const [adminPermissions, setAdminPermissions] = useState<any>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem("adminPermissions");
      if (p) setAdminPermissions(JSON.parse(p));
    } catch (e) {
      // ignore
    }
  }, []);

  const canEditStores = adminPermissions?.Stores?.edit ?? true;

  // CustomTable columns definition
  const baseColumns: Column<any>[] = [
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
      id: "adminManagerId",
      label: "Store Manager",
      minWidth: 150,
      selector: (row) => {
        const manager = row.adminManagerId;
        if (!manager) return <span className="text-gray-400">Not Assigned</span>;
        const displayName = manager.email || `${manager.firstName || ''} ${manager.lastName || ''}`.trim() || 'N/A';
        return (
          <CustomTooltip title={displayName} placement="top">
            <span className="text-sm text-gray-700">{displayName}</span>
          </CustomTooltip>
        );
      },
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
  ];

  const columns: Column<any>[] = [...baseColumns];

  if (canEditStores) {
    columns.push({
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
                  const updatedStore = {
                    ...row,
                    status: row.status === 1 ? 0 : 1,
                  };
                  await UpdateStoreStatus(`${StorePath}?id=${row._id}`, updatedStore);
                  GetStores({ url: StorePath, data: { isListRequest: true, search: search } });
                } catch (err) {
                  console.error('Error updating store status:', err);
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
    });

    columns.push({
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
            onClick={() => router.push(`/dashboard/store/new/${row._id}`)}
          >
            <EditIcon fontSize="small" />
          </span>
        </CustomTooltip>
      ),
    });
  }

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Stores"
        subtitle="Manage stores, managers, and serviceable areas"
        showBack={false}
        showSearch={false}
        addShow={false}
        addLabel="Add "
        // addShow={canEditStores}
        handleAdd={() => router.push(`/dashboard/store/new/`)}
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
        loading={storesLoading}
      />
      {error && (
        <div className="text-red-600 text-lg font-semibold mt-4">{error}</div>
      )}
    </div>
  );
}
