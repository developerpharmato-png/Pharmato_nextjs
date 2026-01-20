import React from 'react'


const PartialCancel = () => {
  return (
    <div className="containerStyle scrollbar-hide">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="h-8 w-48 rounded skeleton-loading mb-2" />
        <div className="h-4 w-32 rounded skeleton-loading" />
      </div>

      {/* Order Summary Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
            <div className="w-5 h-5 rounded-full skeleton-loading" />
            <div className="h-6 w-32 rounded skeleton-loading" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <div className="h-3 w-20 rounded skeleton-loading mb-1" />
                  <div className="h-4 w-32 rounded skeleton-loading" />
                </div>
                <div>
                  <div className="h-3 w-20 rounded skeleton-loading mb-1" />
                  <div className="h-4 w-24 rounded skeleton-loading" />
                </div>
                <div>
                  <div className="h-3 w-20 rounded skeleton-loading mb-1" />
                  <div className="h-4 w-16 rounded skeleton-loading" />
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <div className="h-3 w-20 rounded skeleton-loading mb-1" />
                  <div className="h-4 w-32 rounded skeleton-loading" />
                </div>
                <div>
                  <div className="h-3 w-20 rounded skeleton-loading mb-1" />
                  <div className="h-4 w-24 rounded skeleton-loading" />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 space-y-3">
              <div className="flex justify-between">
                <div className="h-3 w-20 rounded skeleton-loading" />
                <div className="h-4 w-16 rounded skeleton-loading" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-20 rounded skeleton-loading" />
                <div className="h-4 w-16 rounded skeleton-loading" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-20 rounded skeleton-loading" />
                <div className="h-4 w-16 rounded skeleton-loading" />
              </div>
              <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                <div className="h-4 w-20 rounded skeleton-loading" />
                <div className="h-5 w-24 rounded skeleton-loading" />
              </div>
              <div className="mt-4 h-6 w-32 rounded skeleton-loading" />
            </div>
          </div>
        </div>
      </div>

      {/* Customer Details Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6 mb-6">
        <div className="flex items-center gap-2 mb-8 border-b border-gray-100 pb-3">
          <div className="w-5 h-5 rounded-lg skeleton-loading" />
          <div className="h-6 w-32 rounded skeleton-loading" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="h-3 w-24 rounded skeleton-loading mb-4" />
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full skeleton-loading" />
              <div>
                <div className="h-4 w-32 rounded skeleton-loading mb-1" />
                <div className="h-3 w-48 rounded skeleton-loading" />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-3 w-24 rounded skeleton-loading" />
            <div className="space-y-4">
              <div>
                <div className="h-3 w-16 rounded skeleton-loading mb-1" />
                <div className="h-4 w-32 rounded skeleton-loading" />
              </div>
              <div>
                <div className="h-3 w-16 rounded skeleton-loading mb-1" />
                <div className="h-4 w-32 rounded skeleton-loading" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Medicines Table Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
        <div className="h-6 w-48 rounded skeleton-loading mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4    rounded-lg">
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

export default PartialCancel