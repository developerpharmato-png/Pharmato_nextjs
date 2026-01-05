"use client";
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Box } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ErrorMessageCom, CustomButton, CustomCloseButton } from '../components/miniComponents';
import { MdSave } from 'react-icons/md';

type Role = { _id: string; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; email?: string; roleId: string; mobile: string }) => Promise<void>;
  initialValues?: { name?: string; email?: string; roleId?: string; mobile?: string };
  roles: Role[];
  editing?: boolean;
};

export default function AdminForm({ open, onClose, onSubmit, initialValues = {}, roles, editing = false }: Props) {
  const formik = useFormik({
    initialValues: {
      name: initialValues.name || '',
      email: initialValues.email || '',
      roleId: initialValues.roleId || '',
      mobile: initialValues.mobile || '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: editing ? Yup.string().email('Invalid email') : Yup.string().email('Invalid email').required('Email is required'),
      roleId: Yup.string().required('Role is required'),
      mobile: Yup.string()
        .test('mobile', 'Mobile number must be exactly 10 digits', (val) => !val || /^\d{10}$/i.test(val))
        .notRequired(),
    }),
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(values);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      // Added subtle shadow and rounded corners to the dialog container
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pr: 1,
          // Stronger title styling
          fontWeight: 600,
          fontSize: '1.25rem',
          color: 'var(--primary)',
          borderBottom: '1px solid #e0e0e0',
          mb: 0,
          pb: 1,
        }}
      >
        {editing ? 'Edit  Details' : 'Add New '}
        <CustomCloseButton onClick={onClose} size="medium" ariaLabel="close" />
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 3, pb: 2, borderBottom: 'none' }}>
        <Box
          component="form"
          onSubmit={formik.handleSubmit}
          // Increased gap for better visual separation
          sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}
        >
          {/* Name Field */}
          <TextField
            label="Full Name" // Enhanced label  
            fullWidth
            size="medium" // Increased size for better feel
            variant="outlined"
            {...formik.getFieldProps('name')}
            error={formik.touched.name && Boolean(formik.errors.name)}
            required
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: 1 },
              bgcolor: 'background.paper', // Ensure white background
            }}
          />
          {formik.touched.name && formik.errors.name && (
            <ErrorMessageCom error={formik.errors.name as string} />
          )}

          {/* Email Field */}
          <TextField
            label="Email Address" // Enhanced label
            fullWidth
            size="medium"
            variant="outlined"
            {...formik.getFieldProps('email')}
            error={formik.touched.email && Boolean(formik.errors.email)}
            disabled={editing}
            required={!editing}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                // Style for disabled state
                ...(editing && { bgcolor: '#f5f5f5' })
              },
            }}
          />
          {formik.touched.email && formik.errors.email && (
            <ErrorMessageCom error={formik.errors.email as string} />
          )}
          {editing && (
            <Box sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: -2 }}>
              * Email cannot be changed when editing an existing admin.
            </Box>
          )}

          {/* Mobile Number Field */}
          <TextField
            label="Mobile Number (optional)"
            fullWidth
            size="medium"
            variant="outlined"
            {...formik.getFieldProps('mobile')}
            error={formik.touched.mobile && Boolean(formik.errors.mobile)}
            inputProps={{ maxLength: 10 }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
          />
          {formik.touched.mobile && formik.errors.mobile && (
            <ErrorMessageCom error={formik.errors.mobile as string} />
          )}
          {formik.touched.mobile && formik.errors.mobile && (
            <ErrorMessageCom error={formik.errors.mobile as string} />
          )}

          {/* Role Select Field */}
          <TextField
            select
            label="Assign Role" // Enhanced label
            fullWidth
            size="medium"
            variant="outlined"
            {...formik.getFieldProps('roleId')}
            error={formik.touched.roleId && Boolean(formik.errors.roleId)}
            required
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
          >
            <MenuItem value="" disabled sx={{ fontStyle: 'italic', color: 'text.secondary' }}>Select an administrative role</MenuItem>
            {roles.map((r) => (
              <MenuItem key={r._id} value={r._id}>{r.name}</MenuItem>
            ))}
          </TextField>
          {formik.touched.roleId && formik.errors.roleId && (
            <ErrorMessageCom error={formik.errors.roleId as string} />
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ pr: 3, pb: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>


        {/* Submit Button - uses CustomButton for consistency */}
        <CustomButton
          type="submit"
          onClick={() => formik.submitForm()}
          width="120px"
          // Applied loading state via button text
          disabled={formik.isSubmitting}
        >                     <MdSave size={22} />{" "}

          {formik.isSubmitting ? 'Processing...' : (editing ? 'Save ' : 'Add ')}
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
}