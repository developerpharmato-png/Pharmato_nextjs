import React from "react";
import Skeleton from "@mui/material/Skeleton";

export default function SkeltonEditMedicine() {
  return (
    <div className="p-6">
      <div className="containerStyle scrollbar-hide">
        <div className="mb-8 relative">
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" width={220} height={40} style={{ marginLeft: 50 }} />
        </div>
        <div className="space-y-8">
          {/* Image Upload Section */}
          <Skeleton variant="rectangular" width={120} height={28} />
          <div className="flex gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" width={112} height={112} />
            ))}
          </div>
          {/* Medicine Details Section */}
          <Skeleton variant="rectangular" width={320} height={28} />
          <Skeleton variant="rectangular" width={320} height={80} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton variant="rectangular" width={320} height={28} />
            <Skeleton variant="rectangular" width={320} height={28} />
          </div>
          {/* Category/Subcategory Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton variant="rectangular" width={320} height={28} />
            <Skeleton variant="rectangular" width={320} height={28} />
          </div>
          {/* Stock/Batch/Expiry Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton variant="rectangular" width={320} height={28} />
            <Skeleton variant="rectangular" width={320} height={28} />
          </div>
          {/* Expiry Date Section */}
          <Skeleton variant="rectangular" width={320} height={28} />
          {/* Price Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" width={180} height={28} />
            ))}
          </div>
          {/* Composition Section */}
          <Skeleton variant="rectangular" width={320} height={28} />
          <div className="flex gap-4 mb-3">
            <Skeleton variant="rectangular" width={140} height={28} />
            <Skeleton variant="rectangular" width={140} height={28} />
          </div>
          {/* Highlights Section */}
          <Skeleton variant="rectangular" width={320} height={28} />
          <div className="flex gap-4 mb-3">
            <Skeleton variant="rectangular" width={280} height={28} />
          </div>
          {/* Classification Section */}
          <Skeleton variant="rectangular" width={320} height={28} />
          {/* Submission Button */}
          <Skeleton variant="rectangular" width={180} height={48} />
        </div>
      </div>
    </div>
  );
}
