import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";
import { CustomButton, ModalHeader } from "@/app/dashboard/components/miniComponents";
import { WalletAddAmountStore } from "@/app/dashboard/storeAPICall/useUserStore";
import { WalletAddAmountPath } from "@/app/dashboard/storeAPICall/API/BaseApi";
import { useFormik } from "formik";
import { modalStyles } from "@/utils/style";



interface WalletAddAmountDialogProps {
    userId: string;
    onSuccess?: () => void;
    open: boolean;
    setOpen: (open: boolean) => void;
}

export default function WalletAddAmountDialog({ userId, onSuccess, open, setOpen }: WalletAddAmountDialogProps) {


    const { postData: addAmountPost, loading: addLoading, data: amountDData } = WalletAddAmountStore();
    console.log(amountDData, "amountDData");

    const formik = useFormik({
        initialValues: { amount: "" },
        validate: (values) => {
            const errors: { amount?: string } = {};
            if (!values.amount) {
                errors.amount = "Amount is required";
            } else if (isNaN(Number(values.amount)) || Number(values.amount) <= 0) {
                errors.amount = "Enter a valid positive number";
            }
            return errors;
        },
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                const res = await addAmountPost(WalletAddAmountPath, { userId, amount: Number(values.amount) });
                if (res?.success || res?.status) {
                    if (typeof window !== "undefined") {
                        // Use dynamic import for SweetAlert2 and .fire for ESM
                        const module = await import("sweetalert2");
                        const Swal = module.default || module;
                        Swal.fire({
                            toast: true,
                            position: "top-end",
                            icon: "success",
                            title: res.message || "Amount added successfully",
                            showConfirmButton: false,
                            timer: 2000,
                        });
                    }
                    resetForm();
                    setOpen(false);
                    if (onSuccess) onSuccess();
                } else {
                    // Show error toast
                    if (typeof window !== "undefined") {
                        const module = await import("sweetalert2");
                        const Swal = module.default || module;
                        Swal.fire({
                            toast: true,
                            position: "top-end",
                            icon: "error",
                            title: res?.message || "Failed to add amount",
                            showConfirmButton: false,
                            timer: 2000,
                        });
                    }
                }
            } catch (e) {
                if (typeof window !== "undefined") {
                    const module = await import("sweetalert2");
                    const Swal = module.default || module;
                    Swal.fire({
                        toast: true,
                        position: "top-end",
                        icon: "error",
                        title: "Failed to add amount",
                        showConfirmButton: false,
                        timer: 2000,
                    });
                }
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <Dialog open={open} onClose={() => setOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: modalStyles.paper }}
        >
            <ModalHeader title="Add Amount to Wallet" onClose={() => setOpen(false)} />
            <form onSubmit={formik.handleSubmit}>


                <DialogContent

                    sx={{ ...modalStyles.content,  }}
                >
                    <TextField
                        label="Amount"
                        type="number"
                        fullWidth
                        name="amount"
                        value={formik.values.amount}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        margin="normal"
                        disabled={addLoading || formik.isSubmitting}
                        error={formik.touched.amount && Boolean(formik.errors.amount)}
                        helperText={formik.touched.amount && formik.errors.amount}
                    />
                </DialogContent>
                <DialogActions
                    sx={modalStyles.sectionHeader}
                >
                  
                    <CustomButton type="submit"
                        disabled={addLoading || formik.isSubmitting}>
                        {addLoading || formik.isSubmitting ? "Adding..." : "Add"}
                    </CustomButton>
                </DialogActions>
            </form>
        </Dialog>
    );
}
