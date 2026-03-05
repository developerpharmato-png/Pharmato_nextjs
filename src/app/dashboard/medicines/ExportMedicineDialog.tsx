import React from "react";
import { Dialog, DialogContent, TextField } from "@mui/material";
import { CustomButton, ModalHeader } from "@/app/dashboard/components/miniComponents";
import { useFormik } from "formik";
import { modalStyles } from "@/utils/style";
import * as Yup from "yup";

interface ExportMedicineDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (email: string) => void;
    loading: boolean;
}

export default function ExportMedicineDialog({
    open,
    onClose,
    onSubmit,
    loading,
}: ExportMedicineDialogProps) {
    const formik = useFormik({
        initialValues: { email: "" },
        validationSchema: Yup.object({
            email: Yup.string().email("Invalid email address").required("Email is required"),
        }),
        onSubmit: (values) => {
            onSubmit(values.email);
        },
    });

    React.useEffect(() => {
        if (!open) {
            formik.resetForm();
        }
    }, [open]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: modalStyles.paper }}
        >
            <ModalHeader title="Export Medicines" onClose={onClose} />
            <form onSubmit={formik.handleSubmit}>
                <DialogContent sx={modalStyles.content}>
                    <TextField
                        label="Email Address"
                        type="email"
                        fullWidth
                        name="email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.email && Boolean(formik.errors.email)}
                        helperText={formik.touched.email && formik.errors.email}
                        disabled={loading}
                        margin="normal"
                    />
                    <div className="mt-6">
                        <CustomButton
                            type="submit"
                            width="100%"
                            disabled={loading || !formik.isValid || !formik.values.email}
                        >
                            {loading ? "Exporting..." : "Export"}
                        </CustomButton>
                    </div>
                </DialogContent>
            </form>
        </Dialog>
    );
}
