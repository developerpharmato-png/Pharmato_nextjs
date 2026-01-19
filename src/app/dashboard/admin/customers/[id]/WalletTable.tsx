import { CustomTable, Column } from "@/app/dashboard/components/CustomTable";
import { CustomTooltip } from "@/app/dashboard/components/miniComponents";
import { formatMargDate, getStatusColor } from "@/utils/function";
import React from "react";



interface WalletEntry {
  _id: string;
  amount: number;
  payment_mode?: string;
  payment_status?: string;
  recharge_status?: string;
  payment_id?: string;
  recharge_id?: string;
  wallet_transaction_type?: string;
  createdAt?: string;
}

interface WalletTableProps {
  data: WalletEntry[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange?: (rows: number) => void;
  loading?: boolean;
}

const WalletTable: React.FC<WalletTableProps> = ({
  data,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  loading = false,
}) => {
  const columns: Column<WalletEntry>[] = [
    {
      id: "wallet_transaction_type",
      label: "Transaction Type",
      minWidth: 120,
      selector: (row) => (
        <CustomTooltip title={row.wallet_transaction_type || "-"}>
          <span>{row.wallet_transaction_type || "-"}</span>
        </CustomTooltip>
      ),
    },
    {
      id: "amount",
      label: "Amount",
      minWidth: 80,
      selector: (row) => (
        <span className={row.amount >= 0 ? "text-green-700 font-semibold" : "text-red-600 font-semibold"}>
          ₹{row.amount.toFixed(2)}
        </span>
      ),
    },
    {
      id: "payment_mode",
      label: "Mode",
      minWidth: 80,
      selector: (row) => (
        <span>{row.payment_mode || "-"}</span>
      ),
    },
    {
      id: "recharge_status",
      label: "Recharge Status",
      minWidth: 100,
      selector: (row) => (

        <span
          className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase text-center inline-flex justify-center items-center customTooltip ${getStatusColor(
            row.recharge_status || ""
          )}`}
          style={{ minWidth: 110, letterSpacing: 0.4 }}
        >
          {row.recharge_status || "Pending"}
        </span>
      ),
    },
    {
      id: "payment_status",
      label: "Payment Status",
      minWidth: 100,
      selector: (row) => (

        <span
          className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase text-center inline-flex justify-center items-center customTooltip ${getStatusColor(
            row.payment_status || ""
          )}`}
          style={{ minWidth: 110, letterSpacing: 0.4 }}
        >
          {row.payment_status || "Pending"}
        </span>
      ),
    },
    {
      id: "payment_id",
      label: "Payment ID",
      minWidth: 120,
      selector: (row) => (
        <CustomTooltip title={row.payment_id || "-"}>
          <span>{row.payment_id || "-"}</span>
        </CustomTooltip>
      ),
    },
    {
      id: "recharge_id",
      label: "Recharge ID",
      minWidth: 120,
      selector: (row) => (
        <CustomTooltip title={row.recharge_id || "-"}>
          <span>{row.recharge_id || "-"}</span>
        </CustomTooltip>
      ),
    },
    {
      id: "createdAt",
      label: "Date",
      minWidth: 120,
      selector: (row) => (
        <span>{formatMargDate(row.createdAt ?? "") || "-"}</span>
      ),
    },
  ];

  return (
    <CustomTable
      columns={columns}
      data={data}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={totalCount}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      loading={loading}
    />
  );
};

export default WalletTable;
