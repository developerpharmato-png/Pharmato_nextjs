"use client";
import React, { Suspense, useEffect, useState } from "react";
import MedicinesTable from "./table";
import HeaderWithAction from "../components/HeaderWithAction";
import FilterSearch from "../components/FilterSearch";
import { useRouter, useSearchParams } from "next/navigation";

import { MedicinesExportPath } from "../storeAPICall/API/BaseApi";
import { CustomButton } from "../components/miniComponents";
import ExportMedicineDialog from "./ExportMedicineDialog";
import Swal from "sweetalert2";

function MedicinesPageContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<string | null>(null);
  const [medicineFilterStatus, setMedicineFilterStatus] =
    useState<string>("all");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [exportLoading, setExportLoading] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  // No date fields needed for export

  const handleExport = async (email: string) => {
    setExportLoading(true);
    try {
      const res = await fetch(MedicinesExportPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success || data.status) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: data.message || "Export initiated. The medicine list will be sent to your email shortly.",
          showConfirmButton: false,
          timer: 3000,
        });
        setShowExportDialog(false);
      } else {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: data.message || "Export failed",
          showConfirmButton: false,
          timer: 3000,
        });
      }
    } catch (e) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Export failed",
        showConfirmButton: false,
        timer: 3000,
      });
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

  // Apply filter from URL query params on component load
  useEffect(() => {
    const filter = searchParams.get("filter");
    const search = searchParams.get("search");
    if (search) setSearchTerm(search);
    if (filter) {
      // Map dashboard filter labels to medicine filter values
      const filterMap: { [key: string]: string } = {
        "Total Medicines": "all",
        "Low Stock": "lowstock",
        "Out of Stock": "outofstock",
        Expired: "expired",
      };
      const mappedFilter = filterMap[filter] || "all";
      setMedicineFilterStatus(mappedFilter);
    }
  }, [searchParams]);

  return (
    <div className="containerStyleTable scrollbar-hide">
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
                onClick={() => setShowExportDialog(true)}
                width="200px"
              >
                Export Medicines
              </CustomButton>
            </div>
            <ExportMedicineDialog
              open={showExportDialog}
              onClose={() => setShowExportDialog(false)}
              onSubmit={handleExport}
              loading={exportLoading}
            />
          </>
        }
      />
      {/* Export Section */}

      <div className="">
        <FilterSearch
          initial={{ search: searchParams.get("search") || "" }}
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

      <div className="">
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

export default function MedicinesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MedicinesPageContent />
    </Suspense>
  );
}
