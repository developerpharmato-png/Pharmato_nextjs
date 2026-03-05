"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, CircularProgress, Typography, Paper, Button } from "@mui/material";
import { CustomerNotificationsDetailStore } from "@/app/dashboard/storeAPICall/useUserStore";
import { CustomerNotificationsDetailPath } from "@/app/dashboard/storeAPICall/API/BaseApi";

export default function NotificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const payload = { id, limit: 10, offset: 1 };
        const result = await CustomerNotificationsDetailStore.getState().postData(
          CustomerNotificationsDetailPath,
          payload
        );
        if (result?.success || result?.status) {
          setDetail(result.data);
        } else {
          console.error("Failed to fetch notification detail", result);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  return (
    <Box sx={{ p: 2 }}>
      <Button size="small" onClick={() => router.back()} sx={{ mb: 1 }}>
        Back
      </Button>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box> 
      ) : !detail ? (
        <Typography>No details found.</Typography>
      ) : (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {detail.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sent: {new Date(detail.createdAt).toLocaleString()}
          </Typography>
          <Typography sx={{ whiteSpace: "pre-wrap", mb: 2 }}>{detail.message}</Typography>

          <Box>
            <Typography variant="subtitle2">Recipients</Typography>
            {Array.isArray(detail.recipients) && detail.recipients.length > 0 ? (
              detail.recipients.map((r: any) => (
                <Box key={r._id} sx={{ py: 0.5 }}>
                  <Typography>{r.name || r.email || r._id}</Typography>
                  {r.uniqueCode && (
                    <Typography variant="caption" color="text.secondary">
                      {r.uniqueCode}
                    </Typography>
                  )}
                </Box>
              ))
            ) : (
              <Typography variant="body2">No recipients listed.</Typography>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
