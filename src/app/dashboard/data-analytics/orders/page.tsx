"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography } from "@mui/material";
import GridLegacy from "@mui/material/GridLegacy";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);


import { OrderAnalyticsPath } from "../../storeAPICall/API/BaseApi";
import { OrderDAshboardStore } from "../../storeAPICall/useUserStore";
import Skeleton from "@mui/material/Skeleton";

export default function OrderAnalyticsPage() {
  const {
    fetchData: fetchDetails,
    data: detailsData,
    loading: detailsLoading,
  } = OrderDAshboardStore();

  useEffect(() => {
    fetchDetails({ url: `${OrderAnalyticsPath}` });
  }, []);

  if (detailsLoading || !detailsData) {
    return (
      <div className="containerStyle scrollbar-hide">
        <Typography variant="h4" gutterBottom>
          Sales / Orders-Wise Dashboard
        </Typography>
        <GridLegacy container spacing={2}>
          {[1,2,3,4].map((i) => (
            <GridLegacy item key={i} xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width={80} height={32} />
                  <Skeleton variant="text" width={60} height={28} />
                </CardContent>
              </Card>
            </GridLegacy>
          ))}
        </GridLegacy>
        <div style={{ marginTop: 32 }}>
          <Skeleton variant="rectangular" width="100%" height={220} />
        </div>
        <div style={{ marginTop: 32 }}>
          <Skeleton variant="rectangular" width="100%" height={220} />
        </div>
      </div>
    );
  }

  return (
    <div className="containerStyle scrollbar-hide"> 
      <Typography variant="h4" gutterBottom>Sales / Orders-Wise Dashboard</Typography>
      <GridLegacy container spacing={2}>
        {detailsData.kpis.map((kpi: any) => (
          <GridLegacy item key={kpi.label} xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">{kpi.label}</Typography>
                <Typography variant="h5">{kpi.value}</Typography>
              </CardContent>
            </Card>
          </GridLegacy>
        ))}
      </GridLegacy>
      <div style={{ marginTop: 32 }}>
        <Typography variant="h6">Order Status Overview</Typography>
        <Pie data={detailsData.statusGraph} />
      </div>
      <div style={{ marginTop: 32 }}>
        <Typography variant="h6">Prescription vs OTC Orders</Typography>
        <Bar data={detailsData.prescriptionVsOtcGraph} />
      </div>
    </div>
  );
}

