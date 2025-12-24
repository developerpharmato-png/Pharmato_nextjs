"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import HeaderWithAction from "../components/HeaderWithAction";
import OrdersTable from "./OrdersTable";
import { useRouter } from "next/navigation";
import FilterSearch from "../components/FilterSearch";
import { OrderListStore } from "../storeAPICall/useUserStore";
import { OrderLIstPath, OrderExportPath } from "../storeAPICall/API/BaseApi";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { Box } from "@mui/system";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { enGB } from 'date-fns/locale';
import { format } from 'date-fns';
import { CustomButton } from "../components/miniComponents";

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
  const [exportLoading, setExportLoading] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<Date | null>(null);
  const [exportEndDate, setExportEndDate] = useState<Date | null>(null);
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
    dayFilter,
    exportStartDate,
    exportEndDate
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
    // include explicit date range if selected
    if (exportStartDate) body.startDate = exportStartDate.toISOString().slice(0,10);
    if (exportEndDate) body.endDate = exportEndDate.toISOString().slice(0,10);
    

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
        ExportButton={
          <>
              <div className="mb-2 flex items-center justify-end gap-2">
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
          <DatePicker
            label="Start date"
            inputFormat="dd:MM:yyyy"
            value={exportStartDate}
            onChange={(d) => setExportStartDate(d)}
            slotProps={{ textField: { size: 'small' } }}
          />
          <DatePicker
            label="End date"
            inputFormat="dd:MM:yyyy"
            value={exportEndDate}
            onChange={(d) => setExportEndDate(d)}
            slotProps={{ textField: { size: 'small' } }}
          />
        </LocalizationProvider>
        <CustomButton
          onClick={async () => {
            setExportLoading(true);
            try {
              const body: any = {
                startDate: exportStartDate ? format(exportStartDate, 'dd:MM:yyyy') : undefined,
                endDate: exportEndDate ? format(exportEndDate, 'dd:MM:yyyy') : undefined
              };
              // include current filters if desired
              if (searchTerm) body.search = searchTerm;
              if (customerId) body.customerId = customerId;
              const res = await fetch(OrderExportPath, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              });
              if (!res.ok) throw new Error('Export failed');
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `orders_export_${Date.now()}.xlsx`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            } catch (e) {
              console.error(e);
              alert('Export failed');
            } finally {
              setExportLoading(false);
            }
          }}
          disabled={exportLoading}
        >
          {exportLoading ? 'Exporting...' : 'Export Orders'}
        </CustomButton>
      </div>
          </>
        }
      /> 

      <Box mb={2}>
        <FilterSearch
            onChange={(f) => setSearchTerm(f.search || "")}
          placeholder="Search by order ID or payment ID..."
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
