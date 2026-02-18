import React, { useEffect, useState } from "react";
import { CustomTable, Column } from "../components/CustomTable";
import { CustomTooltip, CustomImage } from "../components/miniComponents";
import Avatar from "@mui/material/Avatar";
import { useRouter } from "next/navigation";
import { EditIcon } from "lucide-react";
import { showConfirmStatusAlert } from "../components/ConfirmStatusAlert";

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
  confirmStatusMsg?: {
    title?: string;
    text?: string;
    confirmText?: string;
    cancelText?: string;
  };
}

const CategoriesTable: React.FC<CategoriesTableProps> = (props) => {
  const {
    data,
    page,
    rowsPerPage,
    totalCount,
    onPageChange,
    onRowsPerPageChange,
    onToggleStatus,
    loading = false,
    confirmStatusMsg,
  } = props;
  const router = useRouter();
  const [adminPermissions, setAdminPermissions] = useState<any>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem("adminPermissions");
      if (p) setAdminPermissions(JSON.parse(p));
    } catch (e) {
      // ignore
    }
  }, []);

  const canEditCategories = adminPermissions?.Categories?.edit ?? true;

  const baseColumns: Column<Category>[] = [
    {
      id: "uniqueCode",
      label: "ID",
      minWidth: 50,

      selector: (row: Category) => (
        <span
          className={canEditCategories ? "ID-List" : ""}
          style={{ cursor: canEditCategories ? "pointer" : "default" }}
          onClick={() => canEditCategories && router.push(`/dashboard/categories/edit/${row._id}`)}
        >
          {row.uniqueCode || "-"}
        </span>
      ),
    },
    {
      id: "image",
      label: "Image",
      minWidth: 50,
      selector: (row: Category) =>
        row.images && row.images.length > 0 && row.images[0] ? (
          <div className=" h-[50px] w-[50px]">
            <CustomImage
              coverImage={row.images[0]}
              images={row.images}
              alt={row.name}
            />
          </div>
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
      selector: (row: Category) => (
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
      selector: (row: Category) => (
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
      selector: (row) => (
        <CustomTooltip title={row.isOTC ? "Yes" : "No"}>
          {row.isOTC ? (
            <span className="OTCYes">Yes</span>
          ) : (
            <span className="OTCNo">No</span>
          )}
        </CustomTooltip>
      ),
    },
  ];

  const columns: Column<Category>[] = [...baseColumns];

  columns.push({
    id: "isActive",
    label: "Status",
    minWidth: 80,
    selector: (row: Category) => (
      <button
        onClick={() => {
          if (!canEditCategories) return;
          showConfirmStatusAlert({
            isActive: !!row.isActive,
            title:
              confirmStatusMsg?.title ||
              (row.isActive ? "Deactivate Status?" : "Activate Status?"),
            text:
              confirmStatusMsg?.text ||
              (row.isActive
                ? "Are you sure you want to deactivate this Category?"
                : "Are you sure you want to activate this Category?"),
            confirmText:
              confirmStatusMsg?.confirmText ||
              (row.isActive ? "Deactivate" : "Activate"),
            cancelText: confirmStatusMsg?.cancelText || "Cancel",
            onConfirm: () =>
              onToggleStatus && onToggleStatus(row._id, !row.isActive),
          });
        }}
        disabled={!canEditCategories}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${!canEditCategories ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        style={{ backgroundColor: row.isActive ? "#10b981" : "#d1d5db" }}
        title={!canEditCategories ? "Status Toggle Permission Denied" : (row.isActive ? "Click to deactivate" : "Click to activate")}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${row.isActive ? "translate-x-6" : "translate-x-1"
            }`}
        />
      </button>
    ),
  });

  if (canEditCategories) {
    columns.push({
      id: "actions",
      label: "Edit",
      minWidth: 60,
      selector: (row: Category) => (
        <CustomTooltip title="Edit">
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
        </CustomTooltip>
      ),
    });
  }

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
