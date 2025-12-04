"use client";
import React, { Suspense, useState } from "react";
import MedicinesTable from "./table";
import HeaderWithAction from "../components/HeaderWithAction";
import { useRouter } from "next/navigation";

export default function MedicinesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const handleAdd = () => {
    router.push("/dashboard/medicines/new");
  };
  return (
    <div>
      <HeaderWithAction
        title="Medicines"
        subtitle="Manage your medicine inventory"
        backLabel="Back"
        addLabel="Add Medicine"
        addHref="/dashboard/medicines/new"
        showBack={false}
        showSearch
        searchValue={searchTerm}
        handleAdd={handleAdd}
        addShow={true}
        onSearchChange={setSearchTerm}
      />
      <div className="w-full bg-white rounded-xl shadow-md p-8">
        <MedicinesTable
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>
    </div>
  );
}
