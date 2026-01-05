"use client";
import React from "react";
import HeaderWithAction from "@/app/dashboard/components/HeaderWithAction";
import PolicyEditor from "@/app/dashboard/components/PolicyEditor";

export default function PrivacyPage() {
  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction title="Privacy Policy" subtitle="Edit privacy policy" showBack={false} />
      <PolicyEditor type="userPrivacyPolicy"  title="Privacy Policy" />
    </div>
  );
}
