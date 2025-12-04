"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import HeaderWithAction from "../../components/HeaderWithAction";
import Swal from "sweetalert2";

type Customer = {
  _id: string;
  uniqueCode?: string;
  name?: string;
  email?: string;
  mobile?: string;
  countryCode?: string;
  walletAmount?: number;
  isActive: boolean;
};
import { CustomTable, Column } from "../../components/CustomTable";

export default function AdminCustomerListPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(
      `/api/admin/customers/list?limit=${rowsPerPage}&offset=${
        page * rowsPerPage
      }&search=${searchTerm}`
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
  }, [page, rowsPerPage, searchTerm]);

  const columns: Column<Customer>[] = [
    {
      id: "uniqueCode",
      label: "ID",
      minWidth: 120,
      selector: (row) => (
        <Link
          href={`/dashboard/admin/customers/${row._id}`}
          className="text-green-700 underline hover:text-green-900 font-semibold"
        >
          {row.uniqueCode || row._id}
        </Link>
      ),
    },
    {
      id: "name",
      label: "Name",
      minWidth: 120,
      selector: (row) => row.name || <span className="text-gray-400">-</span>,
    },
    {
      id: "email",
      label: "Email",
      minWidth: 180,
      selector: (row) => row.email || <span className="text-gray-400">-</span>,
    },
    {
      id: "mobile",
      label: "Mobile",
      minWidth: 140,
      selector: (row) =>
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
      selector: (row) => `₹${(row.walletAmount ?? 0).toFixed(2)}`,
    },
    {
      id: "isActive",
      label: "Status",
      minWidth: 80,
      selector: (row) => (
        <>
          <button
            onClick={async () => {
              const actionText = row.isActive ? "deactivate" : "activate";
              const confirm = await Swal.fire({
                icon: "question",
                title: `Confirm ${actionText}`,
                text: `Are you sure you want to ${actionText} this customer?`,
                showCancelButton: true,
                confirmButtonColor: "#16a34a",
                cancelButtonColor: "#6b7280",
                confirmButtonText: "Yes",
              });
              if (!confirm.isConfirmed) return;
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
                  title: `Customer ${
                    row.isActive ? "deactivated" : "activated"
                  }`,
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
            }}
            className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            style={{ backgroundColor: row.isActive ? "#10b981" : "#d1d5db" }}
            title={row.isActive ? "Click to deactivate" : "Click to activate"}
          >
            <span
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                row.isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span
            className={`ml-2 text-xs font-mono ${
              row.isActive ? "text-green-700" : "text-gray-500"
            }`}
          >
            {String(row.isActive)}
          </span>
        </>
      ),
    },
  ];

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Admin Customers"
        subtitle="Manage your customer records"
        showBack={false}
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
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
// ...existing code...
