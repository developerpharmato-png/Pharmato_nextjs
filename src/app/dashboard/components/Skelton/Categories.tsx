import React from "react";

export default function CategoriesSkeleton() {
  return (
    <div className="containerStyle scrollbar-hide">
      <div className="mb-8 relative">
        <div className="absolute left-0 top-0 w-10 h-10 rounded-full skeleton-loading" />
        <div className="pl-14">
          <div className="h-8 w-48 rounded mb-2 skeleton-loading" />
          <div className="h-4 w-64 rounded skeleton-loading" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 sm:p-8">
        <form className="space-y-6">
          <div>
            <div style={{ height: 16, width: 120, marginBottom: 6, background: 'transparent', color: '#888', fontSize: 14, fontWeight: 500 }}>
              Category Name *
            </div>
            <div className="h-10 w-full rounded skeleton-loading" />
          </div>
          <div>
            <div style={{ height: 16, width: 120, marginBottom: 6, background: 'transparent', color: '#888', fontSize: 14, fontWeight: 500 }}>
              Description *
            </div>
            <div className="h-20 w-full rounded skeleton-loading" />
          </div>
          <div>
            <div style={{ height: 16, width: 120, marginBottom: 6, background: 'transparent', color: '#888', fontSize: 14, fontWeight: 500 }}>
              Category Image
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg skeleton-loading" />
              <div style={{ height: 16, width: 80, marginBottom: 6, background: 'transparent', color: '#888', fontSize: 14, fontWeight: 500 }}>
                Upload
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded skeleton-loading" />
            <div style={{ height: 16, width: 80, marginBottom: 6, background: 'transparent', color: '#888', fontSize: 14, fontWeight: 500 }}>
              OTC
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded skeleton-loading" />
            <div style={{ height: 16, width: 80, marginBottom: 6, background: 'transparent', color: '#888', fontSize: 14, fontWeight: 500 }}>
              Active
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <div className="flex-1 h-10 rounded skeleton-loading" />
            <div className="h-10 w-32 rounded skeleton-loading" />
          </div>
        </form>
      </div>
    </div>
  );
}
