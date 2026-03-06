"use client";
import React, { useEffect, useState } from "react";
import HeaderWithAction from "../components/HeaderWithAction";
import MargTable from "./MargTable";
import { MargStore } from "../storeAPICall/useUserStore";
import { MargImportPath, MargListPath } from "../storeAPICall/API/BaseApi";
import Swal from "sweetalert2";
import { CustomButton } from "../components/miniComponents";

const MargPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { data, fetchData, postData } = MargStore();
  const [syncLoading, setSyncLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);

  const margList = (data && data.data) || [];
  const lastSyncDateTime = (data && data.lastSyncDateTime) || ""
  const totalCount = data && data.totalCount ? data.totalCount : margList.length;

  useEffect(() => {
    fetchData({ url: MargListPath, data: { limit: rowsPerPage, offset: page + 1 } });
  }, [fetchData, page, rowsPerPage]);

  const handleImport = async () => {
    setSyncLoading(true);
    try {
      await postData(MargImportPath, {});
      fetchData({ url: MargListPath, data: { limit: rowsPerPage, offset: page + 1 } });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleCheckUpdate = async () => {
    setCheckLoading(true);
    try {
      const response = await fetch("/api/admin/marg/check-live-order-dispatch-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const resData = await response.json();
      if (response.ok) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: resData.message || "Live order dispatch status checked successfully.",
          showConfirmButton: false,
          timer: 2000,
        });
      } else {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: resData.message || "Failed to check update",
          showConfirmButton: false,
          timer: 2000,
        });
      }
    } catch (error) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Something went wrong",
        showConfirmButton: false,
        timer: 2000,
      });
    } finally {
      setCheckLoading(false);
    }
  };
  console.log(lastSyncDateTime, "margList")

  return (
    <div className="containerStyleTable scrollbar-hide">
      <HeaderWithAction
        title="Sync Management  "
        subtitle="Sync data from Marg ERP"
        addLabel={syncLoading ? "Syncing..." : "Sync Medicines"}
        handleAdd={handleImport}
        addShow={true}
        showBack={false}
        lastSyncDateTime={lastSyncDateTime}
        rightNode={
          <CustomButton onClick={handleCheckUpdate} disabled={checkLoading} width="auto" className="ml-2">
            {checkLoading ? "Checking..." : "Sync Order"}
          </CustomButton>
        }
      />
      <div className="mt-10">
        <MargTable
          data={margList}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          loading={syncLoading}
        />
      </div>
    </div>
  );
};

export default MargPage;
