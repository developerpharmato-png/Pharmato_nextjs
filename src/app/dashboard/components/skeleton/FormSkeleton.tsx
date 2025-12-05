import React from "react";

export default function FormSkeleton() {
  return (
    <div className="animate-pulse p-8">
      <div className="h-8 w-1/3 bg-gray-200 rounded mb-6" />
      <div className="h-6 w-1/2 bg-gray-200 rounded mb-4" />
      <div className="bg-white rounded-lg shadow p-6 sm:p-8">
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-5 w-1/4 bg-gray-200 rounded mb-2" />
              <div className="h-10 w-full bg-gray-100 rounded" />
            </div>
          ))}
          <div className="flex gap-4 pt-4">
            <div className="h-12 w-32 bg-gray-200 rounded" />
            <div className="h-12 w-32 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
