"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { Bar } from "react-chartjs-2";

const fetchProductAnalytics = async () => {
  const res = await fetch("/api/analysis/products");
  return res.json();
};

export default function ProductAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetchProductAnalytics().then(setData);
  }, []);

  if (!data) return <div>Loading...</div>;

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
