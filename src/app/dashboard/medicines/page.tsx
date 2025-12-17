"use client";
import React, { Suspense, useState } from "react";
import MedicinesTable from "./table";
import HeaderWithAction from "../components/HeaderWithAction";
import FilterSearch from "../components/FilterSearch";
import { useRouter } from "next/navigation";

import { MedicinesExportPath } from "../storeAPICall/API/BaseApi";

export default function MedicinesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<string | null>(null);
  const router = useRouter();

  const [exportLoading, setExportLoading] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch(MedicinesExportPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: exportStartDate, endDate: exportEndDate }),
      });
      if (!res.ok) throw new Error("Failed to export medicines");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      let filename = "medicines_export.xlsx";
      if (exportStartDate && exportEndDate) {
        filename = `medicines_export_${exportStartDate}_to_${exportEndDate}.xlsx`;
      }
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  const handleAdd = () => {
    router.push("/dashboard/medicines/new");
  };
  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Medicines"
        subtitle="Manage your medicine inventory"
        backLabel="Back"
        addLabel="Add "
        addHref="/dashboard/medicines/new"
        showBack={false}
        showSearch={false}
        handleAdd={handleAdd}
        addShow={true}
      />
      {/* Export Section */}
      <div className="flex items-center gap-2 mt-4">
        <label>Start Date:</label>
        <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} />
        <label>End Date:</label>
        <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} />
        <button
          onClick={handleExport}
          disabled={exportLoading}
          style={{ background: "green", color: "white", padding: "8px 16px", borderRadius: 6 }}
        >
          {exportLoading ? "Exporting..." : "Export Medicines (Excel)"}
        </button>
      </div>
  
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
        />
      </div>

      <div className="mt-4">
        <MedicinesTable
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          categoryId={categoryId}
          subCategoryId={subCategoryId}
          initialData={[]} // Added default empty array for initial data
          initialTotalCount={0} // Added default total count as 0
        />
      </div>
    </div>
  );
}
