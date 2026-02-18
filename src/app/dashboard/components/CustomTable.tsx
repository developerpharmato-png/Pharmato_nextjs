"use client";
import React from "react";
// import Skeleton from "@mui/material/Skeleton";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Paper, IconButton
} from "@mui/material";
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
function TablePaginationActions(props: any) {
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <div style={{ flexShrink: 0, marginLeft: 16, display: 'flex' }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
        size="small"
      >
        <FirstPageIcon />
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
        size="small"
      >
        <KeyboardArrowLeft />
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
        size="small"
      >
        <KeyboardArrowRight />
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
        size="small"
      >
        <LastPageIcon />
      </IconButton>
    </div>
  );
}

export type Column<T> = {
  id: string;
  label: string;
  minWidth?: number;
  align?: "right" | "left" | "center";
  selector: (row: T) => React.ReactNode;
};

type CustomTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange?: (rows: number) => void;
  loading?: boolean;
  NoDataMessage?: string;
};

export function CustomTable<T>({
  columns,
  data,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  loading = false,
  onFilterChange,
  NoDataMessage

}: CustomTableProps<T> & { onFilterChange?: (filter: string) => void }) {

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onFilterChange) {
      onFilterChange(event.target.value);
    }
  };

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>

      <TableContainer sx={{ height: { xs: '53vh', sm: '53vh', md: '54vh', lg: '50vh', xl: '60vh' } }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align || "left"}
                  style={{ minWidth: col.minWidth }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: rowsPerPage }).map((_, idx) => (
                <TableRow key={idx}>
                  {columns.map((col) => (
                    <TableCell key={col.id} align={col.align || "left"}>
                      <div
                        className="skeleton-loading"
                        style={{ width: col.minWidth || 80, height: 32 }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data || !Array.isArray(data) || data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  {NoDataMessage || "No data found"}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => (
                <TableRow hover tabIndex={-1} key={idx}>
                  {columns.map((col) => (
                    <TableCell key={col.id} align={col.align || "left"}
                      sx={{ padding: "8px" }}
                    >
                      {col.selector(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={e => onRowsPerPageChange?.(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[5, 10, 25, 50]}
        ActionsComponent={TablePaginationActions}
      />
    </Paper>
  );
}
