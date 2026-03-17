"use client";
import React from "react";
import HeaderWithAction from "@/app/dashboard/components/HeaderWithAction";
import PolicyEditor from "@/app/dashboard/components/PolicyEditor";

export default function OtherPage() {
  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction title="Other Policy" subtitle="Edit other policy" showBack={false} />
      <PolicyEditor type="otherPolicy"  title="Other Policy" />
    </div>
  );
}
 