"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { CustomTable, Column } from "../components/CustomTable";
import { CustomTooltip } from "../components/miniComponents";
import FilterSearch from "../components/FilterSearch";
import { CustomerNotificationsListStore } from "@/app/dashboard/storeAPICall/useUserStore";
import { CustomerNotificationsListPath } from "@/app/dashboard/storeAPICall/API/BaseApi";

interface Notification {
  _id: string;
  title: string;
  message: string;
  recipients: string[];
  sentCount?: number;
  failedCount?: number;
  uniqueCode?: string;
  status?: string;
  createdAt: string;
}

interface NotificationListProps {
  refreshTrigger?: number;
}

export default function NotificationList({
  refreshTrigger,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const fetchNotifications = async (
    pageNum: number,
    rowsPerPage: number,
    search: string = "",
  ) => {
    setLoading(true);
    try {
      const result = await CustomerNotificationsListStore.getState().postData(
        CustomerNotificationsListPath,
        {
          limit: rowsPerPage,
          offset: pageNum + 1,
          search: search,
        },
      );

      if (result?.success || result?.status) {
        setNotifications(result?.data?.notifications || result?.data || []);
        setTotal(result?.data?.total || result?.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(page, limit, searchTerm);
  }, [page, limit, searchTerm, refreshTrigger]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns: Column<Notification>[] = [
    {
      id: "uniqueCode",
      label: "ID",
      minWidth: 100,
      selector: (row) => (
        <span
          className="ID-List"
          
          role="link"
          tabIndex={0}
          onClick={() => router.push(`/dashboard/notifications/${row._id}`)}
          onKeyDown={(e) => {
            if ((e as React.KeyboardEvent).key === "Enter") {
              router.push(`/dashboard/notifications/${row._id}`);
            }
          }}
        >
          {row.uniqueCode || "-"}
        </span>
      ),
    },
    {
      id: "title",
      label: "Title",
      minWidth: 100,
      selector: (row) => (
        <CustomTooltip title={row.title || "-"}>
          <Typography sx={{
            maxWidth: "200px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {row.title || "-"}
          </Typography>
        </CustomTooltip>
      ),
    },
    {
      id: "message",
      label: "Message",
      minWidth: 100,
      selector: (row) => (
        <CustomTooltip title={row.message || "-"}>
          <Typography
            variant="body2"
            sx={{
              maxWidth: "200px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.message || "-"}
          </Typography>
        </CustomTooltip>
      ),
    },
    {
      id: "sentCount",
      label: "Sent",
      minWidth: 80,
      selector: (row) => (
        <Box
          sx={{
            display: "inline-block",
            backgroundColor: "#dbeafe",
            color: "#1e40af",
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 600,
            border: "1px solid #3b82f6",
            cursor:"pointer "
          }}
          onClick={() => router.push(`/dashboard/notifications/${row._id}`)}

        >
          {`${row.sentCount} User` || 0}
        </Box>
      ),
    },

    {
      id: "createdAt",
      label: "Sent Date",
      minWidth: 180,
      selector: (row) => (
        <Typography variant="body2" color="text.secondary">
          {formatDate(row.createdAt)}
        </Typography>
      ),
    },
  ];

  if (loading && notifications.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <FilterSearch
        onChange={({ search }) => {
          setSearchTerm(search || "");
        }}
        placeholder="Search by notification title..."
        isSearchShow={true}
        showApply={false}
      />
      <CustomTable
        columns={columns}
        data={notifications}
        page={page}
        rowsPerPage={limit}
        totalCount={total}
        onPageChange={setPage}
        onRowsPerPageChange={setLimit}
        loading={loading}
      />
    </>
  );
}
