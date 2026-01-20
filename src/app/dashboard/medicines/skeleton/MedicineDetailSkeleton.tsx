import React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

const MedicineDetailSkeleton = () => {
  return (
    <>
      <style>{`
        @keyframes skeleton-loading {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, #f3f3f3 25%, #e0e0e0 50%, #f3f3f3 75%);
          background-size: 200% 100%;
          border-radius: 8px;
          animation: skeleton-loading 1.2s infinite linear;
        }
      `}</style>
      <Box sx={{ p: 3 }}>
        {/* Header skeleton */}
        <Skeleton className="skeleton" variant="rectangular" width={320} height={40} sx={{ mb: 3 }} />
        {/* Tabs skeleton */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Skeleton className="skeleton" variant="rounded" width={100} height={32} />
          <Skeleton className="skeleton" variant="rounded" width={100} height={32} />
          <Skeleton className="skeleton" variant="rounded" width={100} height={32} />
          <Skeleton className="skeleton" variant="rounded" width={100} height={32} />
          <Skeleton className="skeleton" variant="rounded" width={100} height={32} />
        </Box>
        {/* Main content skeleton */}
        <Box sx={{ display: 'flex', gap: 4 }}>
          {/* Image skeleton */}
          <Skeleton className="skeleton" variant="rectangular" width={180} height={180} />
          {/* Details skeleton */}
          <Box sx={{ flex: 1 }}>
            <Skeleton className="skeleton" variant="text" width="60%" height={32} sx={{ mb: 2 }} />
            <Skeleton className="skeleton" variant="text" width="40%" height={28} sx={{ mb: 2 }} />
            <Skeleton className="skeleton" variant="text" width="80%" height={24} sx={{ mb: 2 }} />
            <Skeleton className="skeleton" variant="text" width="90%" height={24} sx={{ mb: 2 }} />
            <Skeleton className="skeleton" variant="text" width="50%" height={24} sx={{ mb: 2 }} />
          </Box>
        </Box>
        {/* Action buttons skeleton */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Skeleton className="skeleton" variant="rounded" width={120} height={40} />
          <Skeleton className="skeleton" variant="rounded" width={120} height={40} />
        </Box>
      </Box>
    </>
  );
};

export default MedicineDetailSkeleton;
