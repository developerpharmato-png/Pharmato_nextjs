import React from 'react';

const CoponSkeleton = () => {
  return (
    <div className="containerStyle scrollbar-hide animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="skeleton-loading h-8 w-64 mb-2" />
        <div className="skeleton-loading h-4 w-48" />
      </div>

      <div className="space-y-6">
        {/* Row 1: Code & Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="skeleton-loading h-14 w-full" />
          </div>
          <div className="space-y-2">
            <div className="skeleton-loading h-14 w-full" />
          </div>
        </div>

        {/* Row 2: Description (Textarea) */}
        <div className="space-y-2">
          <div className="skeleton-loading h-36 w-full" />
        </div>

        {/* Row 3: Type & Value */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="skeleton-loading h-14 w-full" />
          <div className="skeleton-loading h-14 w-full" />
        </div>

        {/* Row 4: Min Order & Max Discount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="skeleton-loading h-14 w-full" />
          <div className="skeleton-loading h-14 w-full" />
        </div>

        {/* Row 5: Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="skeleton-loading h-14 w-full" />
          <div className="skeleton-loading h-14 w-full" />
        </div>

        {/* Row 6: Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="skeleton-loading h-14 w-full" />
          <div className="skeleton-loading h-14 w-full" />
        </div>

        {/* Toggles Section */}
        <div className="border-t pt-6 space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="skeleton-loading h-6 w-12 rounded-full" />
              <div className="space-y-2">
                <div className="skeleton-loading h-4 w-32" />
                <div className="skeleton-loading h-3 w-56" />
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="flex justify-center mt-10">
          <div className="skeleton-loading h-12 w-full max-w-md rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default CoponSkeleton;