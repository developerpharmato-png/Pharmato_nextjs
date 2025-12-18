"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography } from "@mui/material";
import GridLegacy from "@mui/material/GridLegacy";
import { Bar, Pie } from "react-chartjs-2";

const fetchOrderAnalytics = async () => {
  const res = await fetch("/api/analysis/orders");
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
      <GridLegacy container spacing={2}>
        {data.kpis.map((kpi: any) => (
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
        <Pie data={data.statusGraph} />
      </div>
      <div style={{ marginTop: 32 }}>
        <Typography variant="h6">Prescription vs OTC Orders</Typography>
        <Bar data={data.prescriptionVsOtcGraph} />
      </div>
    </div>
  );
}
