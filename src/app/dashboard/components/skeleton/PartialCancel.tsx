import React from 'react'

const PartialCancel = () => {
  return (
    <div className="">
      <div className="flex justify-between items-center mb-4">
        <div className="h-6 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--background)] rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="h-4 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded animate-pulse" />
            <div className="h-40 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        <div className="bg-[var(--background)] rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="h-4 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded animate-pulse" />
            <div className="h-40 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">Ordered Medicines List</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
              <div className="w-16 h-16 bg-gray-200 rounded animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 w-3/4 rounded mb-2 animate-pulse" />
                <div className="h-3 bg-gray-200 w-1/3 rounded mb-2 animate-pulse" />
                <div className="h-4 bg-gray-200 w-20 rounded animate-pulse" />
              </div>
              <div className="w-24 h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PartialCancel