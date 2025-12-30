import React from 'react'

const Line: React.FC<{ height?: number | string; className?: string }> = ({ height = 16, className = '' }) => (
  <div
    className={`bg-gray-200 rounded ${className} animate-pulse`}
    style={{ height: typeof height === 'number' ? `${height}px` : height }}
  />
);

const PrivacySkeleton: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-12 h-6 bg-gray-200 rounded animate-pulse" />
        <div className="w-1/3 h-6 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <Line height={18} className="w-1/2 mb-4" />
        <Line height={420} className="w-full" />
      </div>

      <div className="flex justify-end">
        <div className="w-32 h-10 bg-gray-200 rounded-full animate-pulse" />
      </div>
    </div>
  )
}

export default PrivacySkeleton