import React from 'react'

const Line: React.FC<{ height?: number | string; className?: string }> = ({ height = 16, className = '' }) => (
  <div
    className={`skeleton-loading rounded ${className}`}
    style={{ height: typeof height === 'number' ? `${height}px` : height, background: 'var(--skeleton-bg, #e5e7eb)' }}
  />
);

const SettingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 mt-8 max-w-5xl">
      {/* Logistics Accordion Skeleton */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Accordion Header */}
        <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded skeleton-loading" />
            <div className="w-32 h-6 rounded skeleton-loading" />
          </div>
          <div className="w-5 h-5 rounded-full skeleton-loading" />
        </div>

        {/* Accordion Body */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="w-24 h-4 rounded skeleton-loading mb-2" />
              <div className="w-full h-12 rounded-lg skeleton-loading" />
            </div>
          ))}
        </div>

        {/* Form Action Skeleton */}
        <div className="p-4 bg-white border-t border-gray-50 flex justify-end">
          <div className="w-40 h-10 rounded-xl skeleton-loading" />
        </div>
      </div>

      {/* Surge Pricing Accordion Skeleton */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Accordion Header */}
        <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded skeleton-loading" />
            <div className="w-40 h-6 rounded skeleton-loading" />
          </div>
          <div className="w-5 h-5 rounded-full skeleton-loading" />
        </div>

        {/* Global Apply All Row Skeleton */}
        <div className="p-6 bg-blue-50/30 border-b border-gray-100 flex flex-col lg:flex-row gap-6">
          <div className="w-24 h-5 rounded skeleton-loading" />
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-10 rounded skeleton-loading" />
            <div className="h-10 rounded skeleton-loading" />
            <div className="h-10 rounded skeleton-loading" />
            <div className="h-10 rounded skeleton-loading" />
          </div>
        </div>

        {/* Days List Skeleton */}
        <div className="divide-y divide-gray-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 flex flex-col lg:flex-row gap-6">
              <div className="w-24 h-6 rounded skeleton-loading" />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="h-10 rounded skeleton-loading" />
                <div className="h-10 rounded skeleton-loading" />
                <div className="h-10 rounded skeleton-loading" />
                <div className="h-6 w-20 rounded skeleton-loading self-center" />
              </div>
            </div>
          ))}
        </div>

        {/* Form Action Skeleton */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <div className="w-48 h-10 rounded-xl skeleton-loading" />
        </div>
      </div>
    </div>
  )
}

export default SettingSkeleton