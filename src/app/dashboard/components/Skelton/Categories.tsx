import React from "react";

export default function CategoriesSkeleton() {
  return (
    <div className="containerStyle scrollbar-hide">
      <div className="mb-8 relative animate-pulse">
        <div className="absolute left-0 top-0 w-10 h-10 bg-gray-200 rounded-full" />
        <div className="pl-14">
          <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 sm:p-8 animate-pulse">
        <form className="space-y-6">
          <div>
            <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-10 w-full bg-gray-100 rounded" />
          </div>
          <div>
            <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-20 w-full bg-gray-100 rounded" />
          </div>
          <div>
            <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
          </div>
          <div className="flex gap-4 pt-4">
            <div className="flex-1 h-10 bg-gray-200 rounded" />
            <div className="h-10 w-32 bg-gray-100 rounded" />
          </div>
        </form>
      </div>
    </div>
  );
}
