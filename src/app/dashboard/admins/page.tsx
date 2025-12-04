"use client";
import React, { useEffect, useState } from "react";
import { CustomTable, Column } from "../components/CustomTable";
import HeaderWithAction from "../components/HeaderWithAction";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admins?limit=${rowsPerPage}&offset=${page * rowsPerPage}`)
      .then((res) => res.json())
      .then((res) => {
        setAdmins(res.data || []);
        setTotalCount(res.total || (res.data ? res.data.length : 0));
      })
      .finally(() => setLoading(false));
  }, [page, rowsPerPage]);

  const columns: Column<any>[] = [
    { id: "name", label: "Name", minWidth: 120, selector: (row) => row.name },
    {
      id: "email",
      label: "Email",
      minWidth: 180,
      selector: (row) => row.email,
    },
    { id: "role", label: "Role", minWidth: 100, selector: (row) => row.role },
    {
      id: "createdAt",
      label: "Created",
      minWidth: 120,
      selector: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Admins"
        subtitle="Manage admin accounts and permissions"
        showBack={false}
        showSearch={false}
      />
      <div className="w-full bg-white rounded-lg shadow-md p-4">
        <CustomTable
          columns={columns}
          data={admins}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          loading={loading}
        />
      </div>
    </div>
  );
}
