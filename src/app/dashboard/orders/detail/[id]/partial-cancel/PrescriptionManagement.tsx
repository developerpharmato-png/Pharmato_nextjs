"use client";
import React from "react";

const PrescriptionManagement = ({ 
  order, 
  handleApprovePrescription, 
  setShowRejectModalPresc, 
  approveLoading, 
  rejectLoading,
  downloadImageByUrl,
  CustomImage 
}: any) => {

  // Logic to always show 4 slots as seen in the image
  const prescriptionUrls = order?.prescription_url || [];
  const displaySlots = [...prescriptionUrls];
  while (displaySlots.length < 4) {
    displaySlots.push(null); // Fill remaining slots with null for "Empty Slot" UI
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-6">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div className="flex items-start gap-3">
          {/* RX Icon */}
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14H7v-2h3v2zm3-4H7v-2h6v2zm3-4H7V7h9v2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">
              Prescription Management
            </h2>
            <p className="text-sm text-gray-400 font-medium">
              Attached files for verification
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <span className="px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
          {order?.prescription_status || "Verification Pending"}
        </span>
      </div>

      {/* --- DOCUMENT GRID (4 Slots) --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {displaySlots.map((url, idx) => {
          if (!url) {
            return (
              <div key={`empty-${idx}`} className="h-48 rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/30 flex flex-col items-center justify-center gap-2">
                <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[10px] font-bold text-gray-300 uppercase">Empty Slot</span>
              </div>
            );
          }

          const isPdf = url.toLowerCase().endsWith(".pdf");
          return (
            <div key={idx} className="group relative h-48 rounded-xl border border-gray-100 overflow-hidden bg-white shadow-sm hover:ring-2 hover:ring-blue-100 transition-all">
              {isPdf ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-red-50/30">
                  <svg className="w-10 h-10 text-red-400 mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 012-2h4.586A1 1 0 0111.293 2.707l3 3a1 1 0 01.293.707V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                  </svg>
                  <span className="text-[10px] font-black text-red-500 uppercase">PDF Document</span>
                </div>
              ) : (
                <div className="w-full h-full relative">
                  <CustomImage 
                    coverImage={url} 
                    images={[url]} 
                    style={{ height: '100%', width: '100%', objectFit: 'cover' }} 
                  />
                </div>
              )}
              
              {/* Overlay Download Button */}
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <button 
                  onClick={() => downloadImageByUrl(url)}
                  className="bg-white p-2 rounded-full shadow-lg text-gray-700 hover:scale-110 transition-transform"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- ACTION BUTTONS (At the bottom) --- */}
      {order?.prescription_status?.toLowerCase() === "pending" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
          <button
            onClick={handleApprovePrescription}
            disabled={approveLoading}
            className="flex items-center justify-center gap-2 py-4 px-6 border-2 border-green-500 text-green-600 font-black text-sm uppercase tracking-wide rounded-xl hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            {approveLoading ? "Wait..." : (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-green-500 flex items-center justify-center text-[10px]">✓</div>
                Approve Prescription
              </>
            )}
          </button>
          
          <button
            onClick={() => setShowRejectModalPresc(true)}
            disabled={rejectLoading}
            className="flex items-center justify-center gap-2 py-4 px-6 border-2 border-red-500 text-red-600 font-black text-sm uppercase tracking-wide rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {rejectLoading ? "Wait..." : (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center text-[10px]">✕</div>
                Reject Prescription
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PrescriptionManagement;