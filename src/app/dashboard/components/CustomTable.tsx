"use client";
import React from "react";
import Skeleton from "@mui/material/Skeleton";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Paper
} from "@mui/material";

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
}: CustomTableProps<T> & { onFilterChange?: (filter: string) => void }) {

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onFilterChange) {
      onFilterChange(event.target.value);
    }
  };

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
    
      <TableContainer sx={{ height: { xs: '30vh', sm: '23vh', md: '44vh', lg: '50vh', xl: '60vh' } }}>
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
                      <Skeleton variant="rectangular" width={col.minWidth || 80} height={32} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data || data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => (
                <TableRow hover tabIndex={-1} key={idx}>
                  {columns.map((col) => (
                    <TableCell key={col.id} align={col.align || "left"}>
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
      />
    </Paper>
  );
}
