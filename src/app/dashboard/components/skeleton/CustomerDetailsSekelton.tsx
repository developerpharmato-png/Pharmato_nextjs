import React from 'react'


const CustomerDetailsSekelton = () => {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 w-full mb-8">
      <div className="h-8 w-48 rounded skeleton-loading mb-6" />
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-gray-700">
        {/* ID */}
        <div>
          <div className="h-4 w-20 rounded skeleton-loading mb-2" />
          <div className="h-4 w-32 rounded skeleton-loading" />
        </div>
        {/* Code */}
        <div>
          <div className="h-4 w-20 rounded skeleton-loading mb-2" />
          <div className="h-4 w-32 rounded skeleton-loading" />
        </div>
        {/* Email */}
        <div>
          <div className="h-4 w-20 rounded skeleton-loading mb-2" />
          <div className="h-4 w-40 rounded skeleton-loading" />
        </div>
        {/* Mobile */}
        <div>
          <div className="h-4 w-20 rounded skeleton-loading mb-2" />
          <div className="h-4 w-32 rounded skeleton-loading" />
        </div>
        {/* Wallet */}
        <div>
          <div className="h-4 w-20 rounded skeleton-loading mb-2" />
          <div className="h-4 w-24 rounded skeleton-loading" />
        </div>
        <div />
        {/* Verified */}
        <div>
          <div className="h-4 w-20 rounded skeleton-loading mb-2" />
          <div className="h-4 w-16 rounded skeleton-loading" />
        </div>
        {/* Active */}
        <div>
          <div className="h-4 w-20 rounded skeleton-loading mb-2" />
          <div className="h-4 w-16 rounded skeleton-loading" />
        </div>
      </div>
    </div>
  );
}

export default CustomerDetailsSekelton