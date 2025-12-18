"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const fetchProductAnalytics = async () => {
  const res = await fetch("/api/admin/data-analytics/products");
  return res.json();
};

export default function ProductAnalyticsPage() {
  const [data, setData] = useState<any | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchProductAnalytics().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return null;
  if (!data) return <div>No data found.</div>;

  return (
    <div>
      <Typography variant="h4" gutterBottom>Product-Wise Dashboard</Typography>
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
        <Typography variant="h6">Top Selling Products</Typography>
        <Bar data={data.topSellingGraph} />
      </div>
      <div style={{ marginTop: 32 }}>
        <Typography variant="h6">Least Selling Products</Typography>
        <Bar data={data.leastSellingGraph} />
      </div>
    </div>
  );
}
