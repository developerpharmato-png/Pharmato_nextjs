import React from 'react';

const NotificationDetailSkeleton = () => {
    return (
        <div className="w-full">
            {/* Message Box Skeleton */}
            <div className="bg-white rounded p-4 mb-4 shadow-sm border border-gray-100">
                <div className="h-6 w-32 rounded skeleton-loading mb-4" />
                <div className="h-4 w-full rounded skeleton-loading mb-2" />
                <div className="h-4 w-5/6 rounded skeleton-loading mb-2" />
                <div className="h-4 w-4/6 rounded skeleton-loading" />
            </div>

            {/* Table Skeleton */}
            <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 flex p-4 border-b border-gray-200 gap-4">
                    <div className="h-4 w-1/4 rounded skeleton-loading" />
                    <div className="h-4 w-1/4 rounded skeleton-loading" />
                    <div className="h-4 w-1/2 rounded skeleton-loading" />
                </div>
                {/* Table Rows */}
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex p-4 border-b border-gray-100 gap-4">
                        <div className="h-4 w-1/4 rounded skeleton-loading" />
                        <div className="h-4 w-1/4 rounded skeleton-loading" />
                        <div className="h-4 w-1/2 rounded skeleton-loading" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotificationDetailSkeleton;
