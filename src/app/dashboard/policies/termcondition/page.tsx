"use client";
import React from "react";
import HeaderWithAction from "@/app/dashboard/components/HeaderWithAction";
import PolicyEditor from "@/app/dashboard/components/PolicyEditor";

export default function TermsPage() {
  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction title="Terms & Conditions" subtitle="Edit terms & conditions" showBack={false} />
      <PolicyEditor type="userTerm&Condition" title="Terms & Conditions"  />
    </div>
  );
}
  