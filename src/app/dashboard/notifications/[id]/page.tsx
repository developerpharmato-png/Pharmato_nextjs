"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, CircularProgress, Typography, Paper } from "@mui/material";
import HeaderWithAction from "../../components/HeaderWithAction";
import { CustomTable, Column } from "../../components/CustomTable";
import { CustomerNotificationsDetailStore } from "@/app/dashboard/storeAPICall/useUserStore";
import { CustomerNotificationsDetailPath } from "@/app/dashboard/storeAPICall/API/BaseApi";

export default function NotificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [recipientsPage, setRecipientsPage] = useState(0);
  const [recipientsPerPage, setRecipientsPerPage] = useState(10);

  const { postData: fetchDetailPost, loading, data: detailResp } = CustomerNotificationsDetailStore();

  useEffect(() => {
    if (!id) return;
    const payload = { id, limit: recipientsPerPage, offset: recipientsPage + 1 };
    fetchDetailPost(CustomerNotificationsDetailPath, payload);
  }, [id, recipientsPage, recipientsPerPage]);

  const detail = detailResp?.data;
  const recipients: any[] = detail?.recipients || [];
  const recipientsTotal = detail?.recipientsTotal || 0;

  const recipientColumns: Column<any>[] = [
    {
      id: "uniqueCode",
      label: "Code",
      minWidth: 120,
      selector: (r) => (
        <span
          style={{ color: "#1976d2", cursor: "pointer", textDecoration: "underline" }}
          onClick={(e) => {
            e.stopPropagation();
            if (r._id) {
              router.push(`/dashboard/admin/customers/${r._id}`);
            }
          }}
        >
          {r.uniqueCode || "-"}
        </span>
      ),
    },
    {
      id: "name",
      label: "Name",
      minWidth: 160,
      selector: (r) => r.name || "-",
    },
    {
      id: "email",
      label: "Email",
      minWidth: 220,
      selector: (r) => r.email || "-",
    },

  ];

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title={detail?.title || "Notification Detail"}
        subtitle={
          detail
            ? `Sent: ${new Date(detail.createdAt).toLocaleString()}`
            : undefined
        }
        showBack={true}
        showSearch={false}
        onBack={() => router.back()}
      />

      {loading && !detail ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : !detail ? (
        <Typography>No details found.</Typography>
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Message
            </Typography>
            <Typography sx={{ whiteSpace: "pre-wrap" }}>
              {detail.message}
            </Typography>
          </Paper>


          <CustomTable
            columns={recipientColumns}
            data={recipients}
            page={recipientsPage}
            rowsPerPage={recipientsPerPage}
            totalCount={recipientsTotal}
            onPageChange={setRecipientsPage}
            onRowsPerPageChange={setRecipientsPerPage}
            loading={loading}
            NoDataMessage={"No recipients listed."}
          />

        </>
      )}
    </div>
  );
}
