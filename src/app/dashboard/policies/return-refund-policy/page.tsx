"use client";
import React from "react";
import HeaderWithAction from "@/app/dashboard/components/HeaderWithAction";
import PolicyEditor from "@/app/dashboard/components/PolicyEditor";

export default function ReturnRefundPage() {
  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction title="Return & Refund Policy" subtitle="Edit Return & Refund Policy" showBack={false} />
      <PolicyEditor type="return&RefundPolicy" title="Return & Refund Policy"  />
    </div>
  );
}
  