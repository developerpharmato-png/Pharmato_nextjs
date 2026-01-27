"use client";
import React, { useEffect, useState } from "react";
import HeaderWithAction from "../components/HeaderWithAction";
import MargTable from "./MargTable";
import { MargStore } from "../storeAPICall/useUserStore";
import { MargImportPath, MargListPath } from "../storeAPICall/API/BaseApi";

const MargPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { data, loading, fetchData, postData } = MargStore();

  const margList = (data && data.data) || [];
  const lastSyncDateTime = (data && data.lastSyncDateTime) || ""
  const totalCount = data && data.totalCount ? data.totalCount : margList.length;

  useEffect(() => {
    fetchData({ url: MargListPath, data: { limit: rowsPerPage, offset: page + 1 } });
  }, [fetchData, page, rowsPerPage]);

  const handleImport = async () => {
    await postData(MargImportPath, {});
    fetchData({ url: MargListPath, data: { limit: rowsPerPage, offset: page + 1 } });
  };
  console.log(lastSyncDateTime, "margList")

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Marg"
        subtitle="Sync data from Marg ERP"
        addLabel="Sync from Marg"
        handleAdd={handleImport}
        addShow={true}
        showBack={false}
        lastSyncDateTime={lastSyncDateTime}
      />
      <div className="mt-10">
        <MargTable
          data={margList}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default MargPage;
