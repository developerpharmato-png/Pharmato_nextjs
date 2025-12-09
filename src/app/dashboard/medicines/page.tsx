"use client";
import React, { Suspense, useState } from "react";
import MedicinesTable from "./table";
import HeaderWithAction from "../components/HeaderWithAction";
import FilterSearch from "../components/FilterSearch";
import { useRouter } from "next/navigation";

export default function MedicinesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<string | null>(null);
  const router = useRouter();

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
        />
      </div>
    </div>
  );
}
