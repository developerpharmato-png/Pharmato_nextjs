"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, Skeleton, Typography } from "@mui/material";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

import { ProductAnalyticsPath } from "../../storeAPICall/API/BaseApi";
import { ProductDAshboardStore } from "../../storeAPICall/useUserStore";

export default function ProductAnalyticsPage() {
  const {
    fetchData: fetchDetails,
    data: detailsData,
    loading: detailsLoading,
  } = ProductDAshboardStore();

  useEffect(() => {
    fetchDetails({ url: `${ProductAnalyticsPath}` });
  }, []);
  
  if (detailsLoading || !detailsData) {
    return (
      <div className="containerStyle scrollbar-hide">
        <Typography variant="h4" gutterBottom>
          Product-Wise Dashboard
        </Typography>
        <Grid container spacing={2}>
          {[1,2,3,4].map((i) => (
            <Grid item key={i} xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width={80} height={32} />
                  <Skeleton variant="text" width={60} height={28} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
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
       <Typography variant="h4" gutterBottom>
         Product-Wise Dashboard
       </Typography>
       <Grid container spacing={2}>
         {detailsData.kpis.map((kpi: any) => (
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
         <Bar data={detailsData.topSellingGraph} />
       </div>
       <div style={{ marginTop: 32 }}>
         <Typography variant="h6">Least Selling Products</Typography>
         <Bar data={detailsData.leastSellingGraph} />
       </div>
     </div>
   );
}
