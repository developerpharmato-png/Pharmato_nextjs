// AddEditPincodeModal.tsx
"use client";

import React, { useState } from "react";
import axios from "axios";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Modal,
  Box,
  TextField,
  Grid,
  CircularProgress,
  Chip,
} from "@mui/material";
import Swal from "sweetalert2";
import { CustomButton, ModalHeader } from "../components/miniComponents"; // Assuming path
import { modalStyle } from "@/utils/style";

const PincodeSchema = Yup.object().shape({
  pincodes: Yup.array()
    .of(
      Yup.string()
        .matches(
          /^([1-9][0-9]{5})$/,
          "Each pincode must be exactly 6 digits and cannot start with 0."
        )
        .required("Pincode is required")
    )
    .min(1, "You must enter at least one valid pincode."),
});



// Add support for editing pincodes by accepting `id` and `pincode` as props.
export function AddEditPincodeModal({
  open,
  onClose,
  onSaveSuccess,
  id, // New prop for editing
  pincode, // New prop for editing
}: any) {
  console.log(pincode, "pincode");
  console.log(id, "id");

  const [inputValue, setInputValue] = useState(pincode || ""); // Initialize with pincode value if editing
  const [loading, setLoading] = useState(true);
  const [modalTitle, setModalTitle] = useState(
    id ? "Edit Pincode" : "Add New Pincode(s)"
  ); // Dynamic title

  const formik = useFormik<{ pincodes: string[] }>({
    initialValues: {
      pincodes: pincode ? [pincode] : [], // Pre-fill for editing
    },
    validationSchema: PincodeSchema,
    onSubmit: async (values) => {
      console.log("Submitting pincodes:", values.pincodes); // Debugging log
      setLoading(true);
      try {
        let response;
        if (id) {
          // Update pincode if `id` is provided
          response = await axios.put(`/api/admin/pincode`, {
            id, // Include the id for editing
            pincode: values.pincodes[0],
            isActive: true, // Assuming isActive is required
          });
        } else {
          // Add new pincodes
          response = await axios.post("/api/admin/pincode", {
            data: { pincodes: values.pincodes },
          });
        }

        const successMessage =
          response.data.message ||
          (id
            ? "Pincode updated successfully!"
            : "Pincodes added successfully!");
        setModalTitle(successMessage);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: successMessage,
          showConfirmButton: false,
          timer: 2000,
        });
        formik.resetForm();
        setInputValue("");
        onClose();
        onSaveSuccess();
      } catch (err: any) {
        console.error("Error during submission:", err); // Debugging log
        const errorMessage = err.response?.data?.message || "Operation Failed";
        setModalTitle(errorMessage);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: errorMessage,
          showConfirmButton: false,
          timer: 2000,
        });
      }
      setLoading(false);
    },
  });

  // Ensure the `inputValue` is updated when the `pincode` prop changes.
  React.useEffect(() => {
    if (pincode) {
      setInputValue(pincode); // Update inputValue when pincode prop changes
    }
  }, [pincode]);

  // Clear inputValue and form values when the modal is closed
  React.useEffect(() => {
    if (!open) {
      setInputValue("");
      formik.resetForm();
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey && e.code === "Space") {
      e.preventDefault();
      if (
        /^([1-9][0-9]{5})$/.test(inputValue) &&
        !formik.values.pincodes.includes(inputValue)
      ) {
        formik.setFieldValue("pincodes", [
          ...formik.values.pincodes,
          inputValue,
        ]);
        setInputValue("");
      }
    }
  };

  const handleDeleteTag = (tag: string) => {
    formik.setFieldValue(
      "pincodes",
      formik.values.pincodes.filter((t: string) => t !== tag)
    );
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="modal-title">
      <Box sx={modalStyle}>
        <ModalHeader title={ id ? "Edit Pincode" : "Add New Pincode(s)"} onClose={onClose} />

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid container sx={{ width: "100%" }}>
              <TextField
                fullWidth
                id="pincode"
                name="pincode"
                label="Enter a 6-digit pincode and press Ctrl + Space"
                placeholder="Type a 6-digit pincode"
                value={inputValue}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  if (value.length <= 6) {
                    setInputValue(value);
                  }
                }}
                onKeyDown={handleKeyDown}
              />
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                {formik.values.pincodes.map((tag: string) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleDeleteTag(tag)}
                    color="primary"
                  />
                ))}
              </Box>
            </Grid>

            <Grid
              container
              justifyContent="center"
              sx={{ mt: 2, width: "100%" }}
            >
              <CustomButton
                type="submit"
                width="200px"
                disabled={loading || formik.values.pincodes.length === 0}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : id ? (
                  "Update Pincode "
                ) : (
                  "Add Pincode "
                )}
              </CustomButton>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Modal>
  );
}
