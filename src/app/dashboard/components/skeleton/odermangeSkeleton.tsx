import React from 'react';


const OdermangeSkeleton = () => {
  return (
    <div className="containerStyle scrollbar-hide">
      {/* Header and Action Button Skeleton */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <div className="h-8 w-48 rounded skeleton-loading mb-2" />
          <div className="h-4 w-32 rounded skeleton-loading" />
        </div>
        <div className="h-10 w-48 rounded skeleton-loading" />
      </div>

      {/* Order ID and Status badge skeleton */}
      <div style={{ marginBottom: 16, marginTop: -4 }}>
        <div className="h-4 w-32 rounded skeleton-loading mb-2" />
        <div className="h-6 w-40 rounded-full skeleton-loading" />
      </div>

      {/* Prescription Management Skeleton */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg skeleton-loading w-10 h-10" />
            <div>
              <div className="h-6 w-48 rounded skeleton-loading mb-2" />
              <div className="h-4 w-32 rounded skeleton-loading" />
            </div>
          </div>
          <div className="px-4 py-2 rounded-full h-6 w-32 skeleton-loading" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          {[1,2,3,4].map((i) => (
            <div key={i} className="flex flex-col rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm h-full">
              <div className="relative flex-1 bg-gray-50 min-h-40 flex items-center justify-center">
                <div className="w-16 h-16 rounded-lg skeleton-loading" />
              </div>
              <div className="w-full py-3 skeleton-loading" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
          <div className="h-12 rounded-xl skeleton-loading" />
          <div className="h-12 rounded-xl skeleton-loading" />
        </div>
      </div>

      {/* Medicines Table Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
        <div className="h-6 w-48 rounded skeleton-loading mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4  rounded-lg">
              <div className="w-6 h-6 rounded-full skeleton-loading" />
              <div className="w-16 h-16 rounded skeleton-loading" />
              <div className="flex-1">
                <div className="h-4 w-3/4 rounded skeleton-loading mb-2" />
                <div className="h-3 w-1/3 rounded skeleton-loading mb-2" />
                <div className="h-4 w-20 rounded skeleton-loading" />
              </div>
              <div className="w-24 h-10 rounded skeleton-loading" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OdermangeSkeleton;