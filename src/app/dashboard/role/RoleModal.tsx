"use client";
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  Box,
} from "@mui/material";
import {
  CustomButton,
  CustomCloseButton,
  ErrorMessageCom,
} from "../components/miniComponents";

type RoleItem = {
  _id: string;
  name: string;
  permissions?: string[];
  isActive: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  formik: any;
  roles: RoleItem[];
  editId: string | null;
  setEditId: (id: string | null) => void;
};

export default function RoleModal({
  open,
  onClose,
  formik,
  roles,
  editId,
  setEditId,
}: Props) {
  const handleClose = () => {
    onClose();
    setEditId(null);
    try {
      formik.resetForm();
    } catch (e) {
      /* ignore */
    }
  };

  const isSuperEdited =
    !!editId && roles.find((r) => r._id === editId)?.name === "SuperAdmin";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          width: "30vw",
          maxWidth: "30vw",
          minWidth: 320,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pr: 1,
          fontWeight: 600,
          fontSize: "1.25rem",
          color: "var(--primary)",
          borderBottom: "1px solid #e0e0e0",
          mb: 0,
          pb: 1,
        }}
      >
        {editId ? "Edit Role" : "Add New Role"}
        <CustomCloseButton
          onClick={handleClose}
          size="medium"
          ariaLabel="Close modal"
        />
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 3, pb: 2, borderBottom: "none" }}>
        <Box
          component="form"
          onSubmit={formik.handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <TextField
            label="Role Name"
            fullWidth
            size="medium"
            variant="outlined"
            {...formik.getFieldProps("name")}
            error={formik.touched.name && Boolean(formik.errors.name)}
            sx={{
              "& .MuiOutlinedInput-root": { borderRadius: 1 },
              bgcolor: isSuperEdited ? "#f5f5f5" : "inherit",
            }}
            disabled={isSuperEdited}
          />
          {formik.touched.name && formik.errors.name && (
            <ErrorMessageCom error={formik.errors.name} />
          )}

          {isSuperEdited && (
            <p className="mt-1 text-xs text-red-500 font-medium">
              Role name is locked for SuperAdmin.
            </p>
          )}

          <div className="flex gap-3 justify-end pt-4  border-gray-100">
            <CustomButton type="submit" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? "Saving..." : editId ? "Update " : "Add "}
            </CustomButton>
          </div>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{ pr: 3, pb: 2, pt: 2, borderTop: "1px solid #e0e0e0" }}
      />
    </Dialog>
  );
}
