"use client";
import React from "react";
import HeaderWithAction from "@/app/dashboard/components/HeaderWithAction";
import PolicyEditor from "@/app/dashboard/components/PolicyEditor";

export default function OtherPage() {
  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction title="Other Policies" subtitle="Edit other Policies" showBack={false} />
      <PolicyEditor type="otherPolicy"  title="Other Policies" />
    </div>
  );
}
 