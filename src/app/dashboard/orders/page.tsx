"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import HeaderWithAction from "../components/HeaderWithAction";
import OrdersTable from "./OrdersTable";
import { useRouter } from "next/navigation";
import FilterSearch from "../components/FilterSearch";
import { OrderListStore } from "../storeAPICall/useUserStore";
import { OrderLIstPath } from "../storeAPICall/API/BaseApi";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { Box } from "@mui/system";

export default function OrdersPage() {
  const router = useRouter();

  // Pagination and data state for CustomTable
  const [orders, setOrders] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [prescriptionStatus, setPrescriptionStatus] = useState<string>("all");
  const [orderStatus, setOrderStatus] = useState<string>("all");
  const [dayFilter, setDayFilter] = useState<string>("all");
console.log(dayFilter,"dayFilter");

  const {
    postData: ListPost,
    loading: ListLoading,
    data: OrderListData,
    clearData,
  } = OrderListStore();

  useEffect(() => {
    fetchOrders();
  }, [
    page,
    rowsPerPage,
    searchTerm,
    customerId,
    prescriptionStatus,
    orderStatus,
    dayFilter
  ]);

  const fetchOrders = async () => {
    const body: any = {
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      page,
      day:dayFilter
      
    };

    if (searchTerm) body.search = searchTerm;
    if (customerId) body.customerId = customerId;
    if (prescriptionStatus && prescriptionStatus !== "all")
      body.prescription_status = prescriptionStatus;
    if (orderStatus && orderStatus !== "all") body.order_status = orderStatus;
    

    // Add storeId and roleName from localStorage
    const roleName = localStorage.getItem("roleName");
    const managedStoresStr = localStorage.getItem("managedStores");

    if (roleName) body.roleName = roleName;

    // Get storeId from managedStores array
    if (managedStoresStr) {
      try {
        const managedStores = JSON.parse(managedStoresStr);
        if (Array.isArray(managedStores) && managedStores.length > 0) {
          // Use the first store's ID if multiple stores
          body.storeId = managedStores[0].storeId;
        }
      } catch (e) {
        console.error("Failed to parse managedStores", e);
      }
    }

    try {
      await ListPost(OrderLIstPath, body);
    } catch (err) {
      console.error("Order list fetch failed", err);
    }
  };

  // Map store response to local table state
  useEffect(() => {
    if (!OrderListData) return;
    try {
      const success = (OrderListData as any).success;
      if (success) {
        setOrders((OrderListData as any).data || []);
        setTotalCount((OrderListData as any).total || 0);
      } else {
        setOrders([]);
        setTotalCount(0);
      }
    } catch (e) {
      setOrders([]);
      setTotalCount(0);
    }
    // optional: clear store data after mapping to avoid stale reads
    // clearData();
  }, [OrderListData]);

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Orders"
        subtitle="Manage customer orders and track status"
        showBack={false}
        showSearch={false}
        onSearchChange={setSearchTerm}
        addShow={false}
        // New props to enable the MUI dropdowns inside
        showOrderFilters={true}
        showclearAll={true}
        prescriptionStatus={prescriptionStatus}
        setPrescriptionStatus={setPrescriptionStatus}
        orderStatus={orderStatus}
        setOrderStatus={setOrderStatus}
        setPage={setPage}
      /> 

      <Box mb={2}>
        <FilterSearch
            onChange={(f) => setSearchTerm(f.search || "")}
          placeholder="Search by order ID or payment ID..."
          isSearchShow={true}
          isShowCategory={false}
          isShowSub={false}
          isShowOTC={false}
            showclearAll={true}
            showOrderFilters={true}
            dayFilter={true}
            setDayFilter={setDayFilter}
          prescriptionStatus={prescriptionStatus}
          setPrescriptionStatus={setPrescriptionStatus}
          orderStatus={orderStatus}
          setOrderStatus={setOrderStatus}
          setPage={setPage}
        />
      </Box>

      <OrdersTable
        data={orders}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        loading={ListLoading}
      />
    </div>
  );
}
