"use client"

import { formatMargDate } from "@/utils/function";
import { CustomTable, Column } from "../components/CustomTable";

interface MargItem {
  _id: string;
  margGetDataCount: number;
  margInsertDataCount: number;
  margUpdateDataCount: number;
  status: string;
  type: string;
  createdAt: string;
  updatedAt: string;
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

const columns: Column<MargItem>[] = [
  { id: "_id", label: "ID", minWidth: 80, selector: (row) => row._id },
  { id: "status", label: "Status", minWidth: 100, selector: (row) => row.status },
  { id: "type", label: "Type", minWidth: 100, selector: (row) => row.type },
  { id: "margGetDataCount", label: "Get Count", minWidth: 80, selector: (row) => row.margGetDataCount },
  { id: "margInsertDataCount", label: "Insert Count", minWidth: 80, selector: (row) => row.margInsertDataCount },
  { id: "margUpdateDataCount", label: "Update Count", minWidth: 80, selector: (row) => row.margUpdateDataCount },
  { id: "createdAt", label: "Created At", minWidth: 140, selector: (row) => formatMargDate(row.createdAt) },
  { id: "updatedAt", label: "Updated At", minWidth: 140, selector: (row) => formatMargDate(row.updatedAt) },
];

const MargTable: React.FC<MargTableProps> = ({ data, page, rowsPerPage, totalCount, onPageChange, onRowsPerPageChange, loading }) => {
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
