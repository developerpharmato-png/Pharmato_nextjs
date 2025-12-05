import React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

const MedicineDetailSkeleton = () => {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header skeleton */}
      <Skeleton variant="rectangular" width={320} height={40} sx={{ mb: 3 }} />
      {/* Tabs skeleton */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Skeleton variant="rounded" width={100} height={32} />
        <Skeleton variant="rounded" width={100} height={32} />
        <Skeleton variant="rounded" width={100} height={32} />
        <Skeleton variant="rounded" width={100} height={32} />
        <Skeleton variant="rounded" width={100} height={32} />
      </Box>
      {/* Main content skeleton */}
      <Box sx={{ display: 'flex', gap: 4 }}>
        {/* Image skeleton */}
        <Skeleton variant="rectangular" width={180} height={180} />
        {/* Details skeleton */}
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="80%" height={24} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="90%" height={24} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="50%" height={24} sx={{ mb: 2 }} />
        </Box>
      </Box>
      {/* Action buttons skeleton */}
      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        <Skeleton variant="rounded" width={120} height={40} />
        <Skeleton variant="rounded" width={120} height={40} />
      </Box>
    </Box>
  );
};

export default MedicineDetailSkeleton;
