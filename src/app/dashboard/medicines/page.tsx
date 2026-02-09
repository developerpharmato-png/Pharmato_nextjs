"use client";
import React, { Suspense, useEffect, useState } from "react";
import MedicinesTable from "./table";
import HeaderWithAction from "../components/HeaderWithAction";
import FilterSearch from "../components/FilterSearch";
import { useRouter } from "next/navigation";

import { MedicinesExportPath } from "../storeAPICall/API/BaseApi";
import { CustomButton } from "../components/miniComponents";

export default function MedicinesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<string | null>(null);
  const [medicineFilterStatus, setMedicineFilterStatus] =
    useState<string>("all");
  const router = useRouter();

  const [exportLoading, setExportLoading] = useState(false);
  // No date fields needed for export

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch(MedicinesExportPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to export medicines");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const filename = "medicines_export.xlsx";
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      // alert("Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  const handleAdd = () => {
    router.push("/dashboard/medicines/AddEdit");
  };

  const [adminPermissions, setAdminPermissions] = useState<any>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem("adminPermissions");
      if (p) setAdminPermissions(JSON.parse(p));
    } catch (e) {
      // ignore
    }
  }, []);

  const canEditMedicines = adminPermissions?.Medicines?.edit ?? true;
  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Medicines"
        subtitle="Manage medicines, pricing, and availability
 "
        backLabel="Back"
        addLabel="Add "
        showBack={false}
        showSearch={false}
        handleAdd={handleAdd}
        addShow={canEditMedicines}
        ExportButton={
          <>
            <div className="flex items-center ">
              <CustomButton
                onClick={handleExport}
                width="200px"
                disabled={exportLoading}
              >
                {exportLoading ? "Exporting..." : "Export Medicines "}
              </CustomButton>
            </div>
          </>
        }
      />
      {/* Export Section */}

      <div className="mt-4">
        <FilterSearch
          onChange={(f) => {
            setSearchTerm(f.search || "");
            setCategoryId(f.categoryId || null);
            setSubCategoryId(f.subCategoryId || null);
          }}
          placeholder="Search medicines..."
          isSearchShow={true}
          isShowCategory={true}
          isShowSub={true}
          showMedicineFilter={true}
          medicineFilterStatus={medicineFilterStatus}
          setMedicineFilterStatus={setMedicineFilterStatus}
        />
      </div>

      <div className="mt-4">
        <MedicinesTable
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          categoryId={categoryId}
          subCategoryId={subCategoryId}
          medicineFilterStatus={medicineFilterStatus}
          initialData={[]} // Added default empty array for initial data
          initialTotalCount={0} // Added default total count as 0
        />
      </div>
    </div>
  );
}
