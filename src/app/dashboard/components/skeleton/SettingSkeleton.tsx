import React from 'react'

const Line: React.FC<{ height?: number | string; className?: string }> = ({ height = 16, className = '' }) => (
  <div
    className={`bg-gray-200 rounded ${className} animate-pulse`}
    style={{ height: typeof height === 'number' ? `${height}px` : height }}
  />
);

const SettingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-12 h-6 bg-gray-200 rounded animate-pulse" />
        <div className="w-1/3 h-6 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg shadow-sm">
        <div className="space-y-3">
          <Line height={12} className="w-2/5" />
          <Line height={48} />
          <Line height={12} className="w-1/2" />
        </div>

        <div className="space-y-3">
          <Line height={12} className="w-2/5" />
          <Line height={48} />
          <Line height={12} className="w-1/2" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg shadow-sm">
        <div className="space-y-3">
          <Line height={12} className="w-2/5" />
          <Line height={48} />
        </div>

        <div className="space-y-3">
          <Line height={12} className="w-2/5" />
          <Line height={48} />
        </div>
      </div>

      <div className="flex justify-end">
        <div className="w-40 h-12 bg-gray-200 rounded-full animate-pulse" />
      </div>
    </div>
  )
}

export default SettingSkeleton