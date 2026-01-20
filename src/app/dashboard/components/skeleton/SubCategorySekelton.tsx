import React from 'react';

const labelStyle = {
  height: 16,
  width: 140,
  marginBottom: 6,
  background: 'transparent',
  color: '#888',
  fontSize: 14,
  fontWeight: 500,
};

const SubCategorySekelton = () => {
  return (
    <div className="containerStyle scrollbar-hide">
      <div className="bg-white rounded-lg shadow p-6 sm:p-8">
        <form className="space-y-6">
          {/* Parent Category */}
          <div>
            <div style={labelStyle}>Parent Category *</div>
            <div className="h-10 w-full rounded skeleton-loading" />
          </div>
          {/* Subcategory Name */}
          <div>
            <div style={labelStyle}>Subcategory Name *</div>
            <div className="h-10 w-full rounded skeleton-loading" />
          </div>
          {/* Description */}
          <div>
            <div style={labelStyle}>Description *</div>
            <div className="h-20 w-full rounded skeleton-loading" />
          </div>
          {/* Image Upload */}
          <div>
            <div style={labelStyle}>Subcategory Image *</div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg skeleton-loading" />
              <div style={{ ...labelStyle, width: 80 }}>Upload</div>
            </div>
          </div>
          {/* OTC Checkbox */}
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded skeleton-loading" />
            <div style={{ ...labelStyle, width: 80 }}>OTC</div>
          </div>
          {/* Button */}
          <div className="flex gap-4 pt-4">
            <div className="flex-1 h-10 rounded skeleton-loading" />
            <div className="h-10 w-32 rounded skeleton-loading" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubCategorySekelton;