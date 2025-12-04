import React from "react";
import { CustomTable, Column } from "../components/CustomTable";
import { CustomTooltip, CustomImage } from "../components/miniComponents";
import Avatar from "@mui/material/Avatar";
import EditIcon from "@mui/icons-material/Edit";
import { useRouter } from "next/navigation";

interface Category {
  _id: string;
  uniqueCode?: string;
  name: string;
  description?: string;
  isOTC?: boolean;
  isActive?: boolean;
  images?: string[];
}

interface CategoriesTableProps {
  data: Category[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange?: (rows: number) => void;
  onToggleStatus?: (id: string, isActive: boolean) => void;
  loading?: boolean;
}

const CategoriesTable: React.FC<CategoriesTableProps> = ({
  data,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  onToggleStatus,
  loading = false,
}) => {
  const router = useRouter();
  const columns: Column<Category>[] = [
    {
      id: "uniqueCode",
      label: "ID",
      minWidth: 120,
      selector: (row) => (
        <CustomTooltip title={row.uniqueCode || "-"}>
          <span
            style={{
              display: "inline-block",
              width: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              cursor: "pointer",
              color: "var(--primary)",
            }}
            onClick={() => router.push(`/dashboard/categories/edit/${row._id}`)}
          >
            {row.uniqueCode || "-"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "image",
      label: "Image",
      minWidth: 80,
      selector: (row) =>
        row.images && row.images.length > 0 && row.images[0] ? (
          <CustomImage
            coverImage={row.images[0]}
            images={row.images}
            alt={row.name}
            style={{
              height: 32,
              width: 32,
              objectFit: "cover",
              borderRadius: 4,
            }}
          />
        ) : (
          <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
            {row.name ? row.name[0] : "?"}
          </Avatar>
        ),
    },
    {
      id: "name",
      label: "Name",
      minWidth: 120,
      selector: (row) => (
        <CustomTooltip title={row.name || "-"}>
          <span
            style={{
              display: "inline-block",
              width: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.name || "-"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "description",
      label: "Description",
      minWidth: 180,
      selector: (row) => (
        <CustomTooltip title={row.description || "-"}>
          <span
            style={{
              display: "inline-block",
              width: 180,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.description || "-"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "isOTC",
      label: "OTC",
      minWidth: 60,
      selector: (row) => (
        <CustomTooltip title={row.isOTC ? "Yes" : "No"}>
          <span
            style={{
              display: "inline-block",
              width: 60,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.isOTC ? "Yes" : "No"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "isActive",
      label: "Status",
      minWidth: 80,
      selector: (row) => (
        <button
          onClick={() =>
            onToggleStatus && onToggleStatus(row._id, !!row.isActive)
          }
          className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          style={{ backgroundColor: row.isActive ? "#10b981" : "#d1d5db" }}
          title={row.isActive ? "Click to deactivate" : "Click to activate"}
        >
          <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
              row.isActive ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      ),
    },
    {
      id: "actions",
      label: "Edit",
      minWidth: 60,
      selector: (row) => (
        <span
          style={{
            cursor: "pointer",
            color: "var(--primary)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={() => router.push(`/dashboard/categories/edit/${row._id}`)}
        >
          <EditIcon fontSize="small" />
        </span>
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

export default CategoriesTable;
