import React from 'react'

const Line: React.FC<{ height?: number | string; className?: string }> = ({ height = 16, className = '' }) => (
  <div
    className={`skeleton-loading rounded ${className}`}
    style={{ height: typeof height === 'number' ? `${height}px` : height, background: 'var(--skeleton-bg, #e5e7eb)' }}
  />
);

const SettingSkeleton: React.FC = () => {
  return (
    <div className="space-y-10 mt-8 max-w-5xl">
      {/* Logistics Section Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-l-4 border-gray-200 pl-4">
          <div className="w-8 h-8 rounded skeleton-loading" />
          <div className="w-32 h-6 rounded skeleton-loading" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="w-full h-14 rounded-lg skeleton-loading" />
            </div>
          ))}
        </div>
      </div>

      {/* Surge Pricing Section Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-l-4 border-gray-200 pl-4">
          <div className="w-8 h-8 rounded skeleton-loading" />
          <div className="w-36 h-6 rounded skeleton-loading" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
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
        </div>
      </div>

      {/* Action Row Skeleton */}
      <div className="flex justify-start">
        <div className="w-48 h-12 rounded-xl skeleton-loading" />
      </div>
    </div>
  )
}

export default SettingSkeleton