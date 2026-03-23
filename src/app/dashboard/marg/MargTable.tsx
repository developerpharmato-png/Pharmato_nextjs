"use client"

import { formatMargDate } from "@/utils/function";
import { CustomTable, Column } from "../components/CustomTable";
import { useRouter } from "next/navigation";
import { CustomTooltip } from "../components/miniComponents";

interface MargItem {
  _id: string;
  margGetDataCount: number;
  margInsertDataCount: number;
  margUpdateDataCount: number;
  status: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  margInsertData?: any[];
  uniqueCode?: string;
}

interface MargTableProps {
  data: MargItem[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  loading?: boolean;
}

const MargTable: React.FC<MargTableProps> = ({ data, page, rowsPerPage, totalCount, onPageChange, onRowsPerPageChange, loading }) => {
  const router = useRouter();

  const handleOpenDetail = (row: MargItem) => {
    try {
      sessionStorage.setItem("margDetailId", row._id);
    } catch (e) {
      // ignore storage failures
    }
    router.push("/dashboard/marg/detail");
  };

  const columns: Column<MargItem>[] = [
    {
      id: "_id",
      label: "ID",
      minWidth: 100,
      selector: (row) => (
        <CustomTooltip
          title={row._id}
        >
          <span
            className={`ID-List ${row.margInsertDataCount === 1 ? "cursor-pointer text-green-600" : "text-gray-700"}`}
            onClick={() => handleOpenDetail(row)}
          >
            {row.uniqueCode}
          </span>
        </CustomTooltip>
      ),
    },
    { id: "status", label: "Status", minWidth: 100, selector: (row) => row.status },
    { id: "type", label: "Type", minWidth: 100, selector: (row) => row.type },
    { id: "margGetDataCount", label: "Get Count", minWidth: 90, selector: (row) => row.margGetDataCount },
    { id: "margInsertDataCount", label: "Insert Count", minWidth: 100, selector: (row) => row.margInsertDataCount },
    { id: "margUpdateDataCount", label: "Update Count", minWidth: 100, selector: (row) => row.margUpdateDataCount },
    { id: "createdAt", label: "Started", minWidth: 140, selector: (row) => formatMargDate(row.createdAt) },
    { id: "updatedAt", label: "End", minWidth: 140, selector: (row) => formatMargDate(row.updatedAt) },
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

export default MargTable;
