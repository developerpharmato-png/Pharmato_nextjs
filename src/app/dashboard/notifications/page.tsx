"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { ToastMessages } from "@/utils/ToasterMessage";
import { useFormik } from "formik";
import {
  Box,
  TextField,
  CircularProgress,
  FormControl,
  Autocomplete,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { MdSend } from "react-icons/md";
import {
  CustomButton,
  ErrorMessageCom,
} from "@/app/dashboard/components/miniComponents";
import HeaderWithAction from "@/app/dashboard/components/HeaderWithAction";
import { CustomerDropdownStore, SendCustomerNotificationsStore } from "@/app/dashboard/storeAPICall/useUserStore";
import { CustomerDropdownPath, SendCustomerNotificationsPath } from "@/app/dashboard/storeAPICall/API/BaseApi";

const MAX_TITLE_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 500;

interface NotificationForm {
  userIds: string[];
  title: string;
  message: string;
}

const initNotification: NotificationForm = {
  userIds: [],
  title: "",
  message: "",
};

type NotificationFormErrors = {
  userIds?: string;
  title?: string;
  message?: string;
};

const validateNotification = (
  values: NotificationForm
): NotificationFormErrors => {
  const errors: NotificationFormErrors = {};

  // User selection validation
  if (!values.userIds || values.userIds.length === 0) {
    errors.userIds = "At least one user must be selected";
  }

  // Title validation
  if (!values.title || values.title.trim().length === 0) {
    errors.title = "Title is mandatory";
  } else if (values.title.trim().length < 3) {
    errors.title = "Title must be at least 3 characters";
  } else if (values.title.trim().length > 100) {
    errors.title = "Title must not exceed 100 characters";
  }

  // Message (Body) validation
  if (!values.message || values.message.trim().length === 0) {
    errors.message = "Body is mandatory";
  } else if (values.message.trim().length < 10) {
    errors.message = "Body must be at least 10 characters";
  } else if (values.message.trim().length > 500) {
    errors.message = "Body must not exceed 500 characters";
  }

  return errors;
};

export default function SendNotificationPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      try {
        const result = await CustomerDropdownStore.getState().fetchData({ url: CustomerDropdownPath });
        if (result?.data) {
          setCustomers(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCustomers();
  }, []);

  const formik = useFormik({
    initialValues: initNotification,
    validate: validateNotification,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setSubmitting(true);
      try {
        const result = await SendCustomerNotificationsStore.getState().postData(
          SendCustomerNotificationsPath,
          {
            userIds: values.userIds,
            title: values.title.trim(),
            message: values.message.trim(),
          }
        );

        if (result?.success || result?.status) {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",

            text: result.message || "Notifications sent successfully",
            showConfirmButton: false,
            timer: 2500,
          });
          resetForm();
        } else {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
            title: "Failed to send",
            text: result?.message || "Failed to send notifications",
            showConfirmButton: false,
            timer: 2500,
          });
        }
      } catch (error) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "Error",
          text: "Failed to send notifications",
          showConfirmButton: false,
          timer: 2500,
        });
      } finally {
        setSubmitting(false);
      }
    },
    validateOnChange: true,
    validateOnBlur: true,
  });

  const isAllSelected = customers.length > 0 &&
    formik.values.userIds.length === customers.length &&
    customers.every(c => formik.values.userIds.includes(c._id));

  const autocompleteOptions = useMemo(() => {
    const allOption = { _id: 'all', mobile: 'All Active Users', email: '' };
    return [allOption, ...customers];
  }, [customers]);

  const selectedOptions = formik.values.userIds
    .map(id => customers.find(c => c._id === id))
    .filter(c => c && (c.mobile || c.email));

  const handleAutocompleteChange = (event: any, value: any[]) => {
    if (value.some(v => v._id === 'all')) {
      // If "all" is selected, select all customer IDs
      const allCustomerIds = customers.map(c => c._id);
      formik.setFieldValue('userIds', allCustomerIds);
    } else {
      // Map selected items to their IDs
      const selectedIds = value
        .filter(v => v._id !== 'all')
        .map(v => v._id);
      formik.setFieldValue('userIds', selectedIds);
    }
  };

  const handleCancel = () => {
    formik.resetForm();

  };

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Send Notifications"
        subtitle="Send custom notifications to selected customers."
        showBack={true}
        showSearch={false}
      />

      <Box
        component="form"
        onSubmit={formik.handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        {/* Customer Selection Autocomplete */}
        <Autocomplete
          multiple
          disabled={loading}
          disableCloseOnSelect
          options={autocompleteOptions}
          value={selectedOptions}
          onChange={handleAutocompleteChange}
          getOptionLabel={(option: any) => {
            if (option._id === 'all') return 'All Active Users';
            const mobile = option.mobile || '';
            const email = option.email || '';
            if (mobile && email) return `${mobile} • ${email}`;
            return mobile || email || 'Unknown';
          }}
          ListboxProps={{
            style: {
              maxHeight: '300px',
              overflow: 'auto'
            }
          }}
          filterOptions={(options, state) => {
            const inputValue = state.inputValue.toLowerCase();
            if (!inputValue) return options;

            return options.filter(option =>
              (option.mobile && option.mobile.toLowerCase().includes(inputValue)) ||
              (option.email && option.email.toLowerCase().includes(inputValue))
            );
          }}
          isOptionEqualToValue={(option, value) => option._id === value._id}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Customers *"
              error={formik.touched.userIds && Boolean(formik.errors.userIds)}
              helperText={
                formik.touched.userIds && formik.errors.userIds
                  ? formik.errors.userIds
                  : undefined
              }
              InputProps={{
                ...params.InputProps,
                sx: {
                  maxHeight: '120px',
                  overflowY: 'auto',
                  alignItems: 'flex-start',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                },
                endAdornment: (
                  <Box sx={{ position: 'sticky', right: 0, background: 'white', display: 'flex', alignItems: 'center' }}>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </Box>
                ),
              }}
            />
          )}
          renderOption={(props, option, { selected }) => {
            const { key, ...liProps } = props;
            const displayMobile = option.mobile || '';
            const displayEmail = option.email || '';

            // Show checked if: all are selected, or this individual item is selected
            const isOptionChecked = isAllSelected || selected;

            return (
              <li key={option._id} {...liProps}>
                <Checkbox
                  checked={isOptionChecked}
                  sx={{ mr: 1 }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <span>{option._id === 'all' ? 'All Active Users' : displayMobile}</span>
                  {option._id !== 'all' && displayEmail && (
                    <span style={{ fontSize: '0.85em', color: '#666' }}>
                      {displayEmail}
                    </span>
                  )}
                </Box>
              </li>
            );
          }}
          noOptionsText="No customers found"
        />

        {/* Title Input */}
        <Box>
          <TextField
            label="Notification Title *"
            size="medium"
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{ maxLength: MAX_TITLE_LENGTH }}
            {...formik.getFieldProps("title")}
            error={formik.touched.title && Boolean(formik.errors.title)}
            helperText={
              formik.touched.title && formik.errors.title
                ? formik.errors.title
                : `${formik.values.title.length} / ${MAX_TITLE_LENGTH} characters`
            }
            FormHelperTextProps={{
              sx: { textAlign: "right", mr: 0, mt: 0.5 },
            }}
          />
        </Box>

        {/* Message Textarea */}
        <TextField
          label="Notification Message *"
          multiline
          rows={6}
          InputLabelProps={{ shrink: true }}
          inputProps={{ maxLength: MAX_MESSAGE_LENGTH }}
          {...formik.getFieldProps("message")}
          error={formik.touched.message && Boolean(formik.errors.message)}
          helperText={
            formik.touched.message && formik.errors.message
              ? formik.errors.message
              : `${formik.values.message.length} / ${MAX_MESSAGE_LENGTH} characters`
          }
          FormHelperTextProps={{
            sx: { textAlign: "right", mr: 0, mt: 0.5 },
          }}
        />

        {/* Submit & Cancel Buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <div className="ButtonOuter mr-4" style={{ flex: 1 }}>
            <div className="buttoninner mr-4" >
              <CustomButton
                type="submit"
                disabled={formik.isSubmitting || !formik.isValid || loading}
                width="100%"
              >
                {formik.isSubmitting ? (
                  <>
                    <CircularProgress size={24} color="inherit" />
                    Sending Notifications...
                  </>
                ) : (
                  <>
                    <MdSend size={22} />
                    Send Notification
                  </>
                )}
              </CustomButton>
             <div className="ml-3">
                <CustomButton
                type="button"
                onClick={handleCancel}
                disabled={formik.isSubmitting}
                width="100%"
              >
                Cancel
              </CustomButton>
             </div>
            </div>
          </div>
      
             
          
        </Box>
      </Box>
    </div>
  );
}
