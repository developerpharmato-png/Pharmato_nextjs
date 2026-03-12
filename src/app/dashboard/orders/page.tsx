"use client";
import React, { Suspense, useState, useEffect } from "react";
import HeaderWithAction from "../components/HeaderWithAction";
import OrdersTable from "./OrdersTable";
import { useRouter, useSearchParams } from "next/navigation";
import FilterSearch from "../components/FilterSearch";
import { OrderListStore, OrderExportStore } from "../storeAPICall/useUserStore";
import { OrderLIstPath, OrderExportPath } from "../storeAPICall/API/BaseApi";
import { Box } from "@mui/system";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { enGB } from "date-fns/locale";
import { format, addDays, parse, startOfMonth } from "date-fns";
import { CustomButton } from "../components/miniComponents";

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // Set initial dates on client only to avoid hydration mismatch
  useEffect(() => {
    if (exportStartDate === null) {
      setExportStartDate(startOfMonth(new Date()));
    }
    if (exportEndDate === null) {
      setExportEndDate(new Date());
    }
  }, []);

  const {
    postData: ListPost,
    loading: ListLoading,
    data: OrderListData,
  } = OrderListStore();
  const { postBlob: ExportPost } = OrderExportStore();

  // Apply filter from URL query params on component load
  useEffect(() => {
    const filter = searchParams.get("filter");
    const period = searchParams.get("period");
    const startStr = searchParams.get("startDate");
    const endStr = searchParams.get("endDate");

    if (filter) {
      // Map dashboard filter labels to order status values
      const filterMap: { [key: string]: string } = {
        "Total Orders": "all",
        Confirmed: "Confirmed",
        Pending: "Pending",
        Cancelled: "Cancelled",
      };
      const mappedFilter = filterMap[filter] || filter;
      setOrderStatus(mappedFilter);
    }

    if (period) {
      const periodMap: { [key: string]: string } = {
        today: "today",
        week: "last7",
        month: "last30",
        year: "all",
        all: "all",
        custom: "all",
      };
      setDayFilter(periodMap[period] || "all");
    }

    if (startStr) {
      try {
        const d = parse(startStr, "yyyy-MM-dd", new Date());
        setExportStartDate(d);
      } catch (e) {
        console.error("Failed to parse startDate", e);
      }
    }

    if (endStr) {
      try {
        const d = parse(endStr, "yyyy-MM-dd", new Date());
        setExportEndDate(d);
      } catch (e) {
        console.error("Failed to parse endDate", e);
      }
    }
  }, [searchParams]);

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
    exportEndDate,
  ]);

  const fetchOrders = async () => {
    const body: any = {
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      page,
      day: dayFilter,
    };
    if (searchTerm) body.search = searchTerm;
    if (customerId) body.customerId = customerId;
    if (prescriptionStatus && prescriptionStatus !== "all")
      body.prescription_status = prescriptionStatus;
    if (orderStatus && orderStatus !== "all") body.order_status = orderStatus;
    if (exportStartDate) body.startDate = format(exportStartDate, "dd-MM-yyyy");
    if (exportEndDate) body.endDate = format(exportEndDate, "dd-MM-yyyy");

    const roleName = localStorage.getItem("roleName");
    const managedStoresStr = localStorage.getItem("managedStores");
    if (roleName) body.roleName = roleName;

    if (managedStoresStr) {
      try {
        const managedStores = JSON.parse(managedStoresStr);
        if (Array.isArray(managedStores) && managedStores.length > 0) {
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
  }, [OrderListData]);

  return (
    <div className="containerStyleTable scrollbar-hide">
      {/* ...existing code... */}
      <HeaderWithAction
        title="Orders"
        subtitle="Track, process, and manage all orders"
        showBack={false}
        ExportButton={
          <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-lg border border-gray-200">
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={enGB}
            > 
              <DatePicker
                label="Start date"
                format="dd/MM/yyyy"
                value={exportStartDate}
                maxDate={new Date()}
                onChange={(d) => {
                  setExportStartDate(d);
                  if (d && exportEndDate && !(exportEndDate > d))
                    setExportEndDate(null);
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: {
                      width: 160,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "6px",
                        backgroundColor: "white",
                      },
                    },
                  },
                }}
              />
              <DatePicker
                label="End date"
                format="dd/MM/yyyy"
                value={exportEndDate}
                minDate={
                  exportStartDate ? addDays(exportStartDate, 1) : undefined
                }
                maxDate={new Date()}
                onChange={(d) => setExportEndDate(d)}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: {
                      width: 160,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "6px",
                        backgroundColor: "white",
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>
            <CustomButton
              width="140px"
              onClick={async () => {
                setExportLoading(true);
                try {
                  const body: any = {
                    startDate: exportStartDate
                      ? format(exportStartDate, "dd-MM-yyyy")
                      : undefined,
                    endDate: exportEndDate
                      ? format(exportEndDate, "dd-MM-yyyy")
                      : undefined,
                  };
                  if (searchTerm) body.search = searchTerm;
                  const blob = await ExportPost?.(OrderExportPath, body);
                  if (!blob) throw new Error("Export failed");
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `orders_${Date.now()}.xlsx`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                } catch (e) {
                  // alert("Export failed");
                } finally {
                  setExportLoading(false);
                }
              }}
              disabled={exportLoading}
            >
              {exportLoading ? "Wait..." : "Export"}
            </CustomButton>

          </div>
        }
      />
      <Box mt={4}>
        <FilterSearch
          onChange={(f) => setSearchTerm(f.search || "")}
          placeholder="Search Order ID or Payment ID..."
          showclearAll={true}
          showOrderFilters={true}
          dayFilter={true}
          setDayFilter={setDayFilter}
          prescriptionStatus={prescriptionStatus}
          setPrescriptionStatus={setPrescriptionStatus}
          orderStatus={orderStatus}
          setOrderStatus={setOrderStatus}
          initialOrderStatus={orderStatus}
          setPage={setPage}
          setExportStartDate={setExportStartDate}
          setExportEndDate={setExportEndDate}
          initialDayFilter={dayFilter}
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

export default function OrdersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrdersPageContent />
    </Suspense>
  );
}
