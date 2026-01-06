import React from 'react'

const StoreSkeleton = () => {
  return (
    <div className="space-y-6 mt-8 px-8 py-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-40 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-60 animate-pulse" />
      </div>

      {/* Grid form skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Store Name field */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-12 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Store Manager field */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-12 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>

      {/* Pincode Select skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="h-12 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* Address Fields skeleton */}
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="h-12 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Map skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* Status skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
        <div className="h-12 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* Button skeleton */}
      <div className="flex gap-4 mt-8">
        <div className="h-12 bg-gray-200 rounded w-32 animate-pulse" />
      </div>
    </div>
  )
}

export default StoreSkeleton 