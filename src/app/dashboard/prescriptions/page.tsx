import React, { Suspense } from "react";
import PrescriptionsTable from "./table";
import HeaderWithAction from "../components/HeaderWithAction";

export default function PrescriptionsPage() {
  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Prescriptions"
        subtitle="Track and manage patient prescriptions"
        showBack={false}
        showSearch={false}
      />
      <div></div>
      <div className="w-full bg-white rounded-xl shadow-md p-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          }
        >
          <PrescriptionsTable />
        </Suspense>
      </div>
    </div>
  );
}
