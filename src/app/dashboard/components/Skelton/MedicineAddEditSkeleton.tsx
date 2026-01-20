import React from 'react'
import InputLabel from '@mui/material/InputLabel';


const skeletonBlock = (style = {}) => (
  <div
    style={{
      background: 'linear-gradient(90deg, #f3f3f3 25%, #e0e0e0 50%, #f3f3f3 75%)',
      borderRadius: 8,
      minHeight: 32,
      marginBottom: 16,
      animation: 'skeleton-loading 1.2s infinite linear',
      ...style,
    }}
  />
);

const MedicineAddEditSkeleton = () => {
  return (
    <div>
      <style>{`
        @keyframes skeleton-loading {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, #f3f3f3 25%, #e0e0e0 50%, #f3f3f3 75%);
          background-size: 200% 100%;
          border-radius: 8px;
          animation: skeleton-loading 1.2s infinite linear;
        }
      `}</style>
      {/* Image uploader skeleton */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ width: 80, height: 80 }} />
        ))}
      </div>

      {/* Form fields skeleton with real labels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <InputLabel shrink>Medicine Name *</InputLabel>
          <div className="skeleton" style={{ height: 40 }} />
        </div>
        <div>
          <InputLabel shrink>Category *</InputLabel>
          <div className="skeleton" style={{ height: 40 }} />
        </div>
        <div>
          <InputLabel shrink>MRP *</InputLabel>
          <div className="skeleton" style={{ height: 40 }} />
        </div>
        <div>
          <InputLabel shrink>Price *</InputLabel>
          <div className="skeleton" style={{ height: 40 }} />
        </div>
        <div>
          <InputLabel shrink>Manufacturer *</InputLabel>
          <div className="skeleton" style={{ height: 40 }} />
        </div>
        <div>
          <InputLabel shrink>Stock Quantity *</InputLabel>
          <div className="skeleton" style={{ height: 40 }} />
        </div>
      </div>

      {/* Description skeleton with label */}
      <div style={{ margin: '32px 0 16px 0' }}>
        <InputLabel shrink>Description</InputLabel>
        <div className="skeleton" style={{ height: 80 }} />
      </div>

      {/* More fields skeleton with real labels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <InputLabel shrink>Expiry Date *</InputLabel>
          <div className="skeleton" style={{ height: 40 }} />
        </div>
        <div>
          <InputLabel shrink>Batch Number *</InputLabel>
          <div className="skeleton" style={{ height: 40 }} />
        </div>
        <div>
          <InputLabel id="store-select-label" shrink>Store</InputLabel>
          <div className="skeleton" style={{ height: 40 }} />
        </div>
        <div>
          <InputLabel shrink>Unit *</InputLabel>
          <div className="skeleton" style={{ height: 40 }} />
        </div>
      </div>

      {/* Button skeleton */}
      <div className="skeleton" style={{ height: 48, width: 180, margin: '40px auto 0 auto' }} />
    </div>
  );
}

export default MedicineAddEditSkeleton  