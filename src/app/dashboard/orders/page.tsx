"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import HeaderWithAction from "../components/HeaderWithAction";
import OrdersTable from "./OrdersTable";
import { useRouter } from "next/navigation";
import FilterSearch from "../components/FilterSearch";

export default function OrdersPage() {
  const router = useRouter();

  // Pagination and data state for CustomTable
  const [orders, setOrders] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerId, setCustomerId] = useState("");

  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage, searchTerm, customerId]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const body: any = {
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        page: page,
      };
      
      if (searchTerm) body.search = searchTerm;
      if (customerId) body.customerId = customerId;

      const res = await fetch(`/api/admin/order/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      if (data.success) {
        setOrders(data.data || []);
        setTotalCount(data.total || 0);
      } else {
        setOrders([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Orders"
        subtitle="Manage customer orders and track status"
        showBack={false}
        showSearch={false}
        onSearchChange={setSearchTerm}
        addShow={false}
      />

      <FilterSearch
        onChange={(f) => {
          setSearchTerm(f.search || "");
        }}
        placeholder="Search by order ID or payment ID..."
        isSearchShow={true}
        isShowCategory={false}
        isShowSub={false}
        isShowOTC={false}
      />

      <OrdersTable
        data={orders}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        loading={loading}
      />
    </div>
  );
}
