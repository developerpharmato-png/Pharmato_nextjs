"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
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

const fetchOrderAnalytics = async () => {
  const res = await fetch("/api/data-analytics/orders");
  return res.json();
};

export default function OrderAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetchOrderAnalytics().then(setData);
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <Typography variant="h4" gutterBottom>Sales / Orders-Wise Dashboard</Typography>
      <Grid container spacing={2}>
        {data.kpis.map((kpi: any) => (
          <Grid item key={kpi.label} xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">{kpi.label}</Typography>
                <Typography variant="h5">{kpi.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <div style={{ marginTop: 32 }}>
        <Typography variant="h6">Order Status Overview</Typography>
        <Pie data={data.statusGraph} />
      </div>
      <div style={{ marginTop: 32 }}>
        <Typography variant="h6">Prescription vs OTC Orders</Typography>
        <Bar data={data.prescriptionVsOtcGraph} />
      </div>
    </div>
  );
}
