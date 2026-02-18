"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import HeaderWithAction from "../../components/HeaderWithAction";
import Swal from "sweetalert2";
import { showConfirmStatusAlert } from "../../components/ConfirmStatusAlert";
import FilterSearch from "../../components/FilterSearch";
import { CustomTable, Column } from "../../components/CustomTable";

type Customer = {
  _id: string;
  uniqueCode?: string;
  name?: string;
  email?: string;
  mobile?: string;
  countryCode?: string;
  walletAmount?: number;
  isActive: boolean;
  isDelete?: boolean;
};
// Helper to show delete status
function getDeleteStatus(isDelete?: boolean) {
  return isDelete ? (
    <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
      Deleted
    </span>
  ) : (
    <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
      Active
    </span>
  );
}

export default function AdminCustomerListPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [adminPermissions, setAdminPermissions] = useState<any>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem("adminPermissions");
      if (p) setAdminPermissions(JSON.parse(p));
    } catch (e) {
      // ignore
    }
  }, []);

  const canEditCustomers = adminPermissions?.Customers?.edit ?? true;

  // Ensure the status filter is passed correctly to the API
  useEffect(() => {
    setLoading(true);
    fetch(
      `/api/admin/customers/list?limit=${rowsPerPage}&offset=${
        page * rowsPerPage
      }&search=${searchTerm}&status=${statusFilter}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCustomers(data.data || []);
          setTotalCount(data.total || (data.data ? data.data.length : 0));
          setError(null);
        } else {
          setError(data.message || "Failed to fetch customers");
          Swal.fire({
            icon: "error",
            title: "Load failed",
            text: data.message || "Failed to fetch customers",
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Network error");
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Network error",
          text: "Unable to fetch customers",
        });
      });
  }, [page, rowsPerPage, searchTerm, statusFilter]);

  const columns: Column<Customer>[] = [
    {
      id: "uniqueCode",
      label: "ID",
      minWidth: 120,
      selector: (row: Customer) => (
        <Link
          href={`/dashboard/admin/customers/${row._id}`}
          className="text-green-700 underline hover:text-green-900 font-semibold"
        >
          {row.uniqueCode || row._id}
        </Link>
      ),
    },
    // {
    //   id: "name",
    //   label: "Name",
    //   minWidth: 120,
    //   selector: (row: Customer) => row.name || <span className="text-gray-400">-</span>,
    // },
    {
      id: "email",
      label: "Email",
      minWidth: 180,
      selector: (row: Customer) => row.email || <span className="text-gray-400">-</span>,
    },
    {
      id: "mobile",
      label: "Mobile",
      minWidth: 140,
      selector: (row: Customer) =>
        row.mobile ? (
          `${row.countryCode ? row.countryCode : ""} ${row.mobile}`.trim()
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      id: "walletAmount",
      label: "Wallet",
      minWidth: 100,
      selector: (row: Customer) => `₹${(row.walletAmount ?? 0).toFixed(2)}`,
    },
    {
      id: "isActive",
      label: "User Status",
      minWidth: 80,
      selector: (row: Customer) => (
        <button
          onClick={async () => {
            if (row.isDelete || !canEditCustomers) return;
            showConfirmStatusAlert({
              isActive: row.isActive,
              title: row.isActive ? "Deactivate Customer?" : "Activate Customer?",
              text: row.isActive
                ? "Are you sure you want to deactivate this customer?"
                : "Are you sure you want to activate this customer?",
              confirmText: row.isActive ? "Deactivate" : "Activate",
              cancelText: "Cancel",
              onConfirm: async () => {
                const res = await fetch(
                  `/api/admin/customers/active/${row._id}`,
                  {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isActive: !row.isActive }),
                  }
                );
                if (res.ok) {
                  setCustomers((prev) =>
                    prev.map((u) =>
                      u._id === row._id ? { ...u, isActive: !row.isActive } : u
                    )
                  );
                  Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: `Customer ${row.isActive ? "deactivated" : "activated"}`,
                    showConfirmButton: false,
                    timer: 2000,
                  });
                } else {
                  Swal.fire({
                    icon: "error",
                    title: "Update failed",
                    text: "Unable to change status",
                  });
                }
              },
            });
          }}
          className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          style={{
            backgroundColor: row.isActive ? "#10b981" : "#d1d5db",
            opacity: (row.isDelete || !canEditCustomers) ? 0.5 : 1,
            cursor: (row.isDelete || !canEditCustomers) ? 'not-allowed' : 'pointer'
          }}
          title={
            row.isDelete
              ? "Account deleted"
              : !canEditCustomers
                ? "Status Toggle Permission Denied"
                : row.isActive
                  ? "Click to deactivate"
                  : "Click to activate"
          }
          disabled={row.isDelete || !canEditCustomers}
        >
          <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${row.isActive ? "translate-x-6" : "translate-x-1"
              }`}
          />
        </button>
      ),
    },
    {
      id: "isDelete",
      label: "Account Status",
      minWidth: 100,
      selector: (row: Customer) => getDeleteStatus(row.isDelete),
    },
  ];

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title=" Customers"
        subtitle="Manage your customer records"
        showBack={false}
        showSearch={false}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        isunsaved={false}
      />
      <FilterSearch
        onChange={({ search, status }) => {
          setSearchTerm(search || "");
          setStatusFilter(status || "all");
        }}
        placeholder="Search customers..."
        isSearchShow={true}
        showApply={false}
      />
      <CustomTable
        columns={columns}
        data={customers}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        loading={loading}
      />
      {error && (
        <div className="text-red-600 text-lg font-semibold mt-4">{error}</div>
      )}
    </div>
  );
}
