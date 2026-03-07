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
  Typography,
} from "@mui/material";
import { MdSend } from "react-icons/md";
import {
  CustomButton,
  ErrorMessageCom,
} from "@/app/dashboard/components/miniComponents";
import {
  CustomerDropdownStore,
  SendCustomerNotificationsStore,
} from "@/app/dashboard/storeAPICall/useUserStore";
import {
  CustomerDropdownPath,
  SendCustomerNotificationsPath,
} from "@/app/dashboard/storeAPICall/API/BaseApi";
import TextareaField from "../components/skeleton/FieldCom";

const MAX_TITLE_LENGTH = 40;
const MAX_MESSAGE_LENGTH = 160;

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
  values: NotificationForm,
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
    errors.message = "Message is mandatory";
  } else if (values.message.trim().length < 10) {
    errors.message = "Message must be at least 10 characters";
  } else if (values.message.trim().length > 500) {
    errors.message = "Message must not exceed 500 characters";
  }

  return errors;
};

interface SendNotificationFormProps {
  handleClose: () => void;
}

export default function SendNotificationForm({
  handleClose,
}: SendNotificationFormProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [disableClose, setDisableClose] = useState(true);

  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      try {
        const result = await CustomerDropdownStore.getState().fetchData({
          url: CustomerDropdownPath,
        });
        if (result?.data) {
          setCustomers(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
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
          },
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
          handleClose();
          resetForm();
        } else {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
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

  const isAllSelected =
    customers.length > 0 &&
    formik.values.userIds.length === customers.length &&
    customers.every((c) => formik.values.userIds.includes(c._id));

  const autocompleteOptions = useMemo(() => {
    const allOption = { _id: "all", mobile: "All Active Users", email: "" };
    return [allOption, ...customers];
  }, [customers]);

  const selectedOptions = formik.values.userIds
    .map((id) => customers.find((c) => c._id === id))
    .filter((c) => c && (c.mobile || c.email));

  const handleAutocompleteChange = (event: any, value: any[]) => {
    if (value.some((v) => v._id === "all")) {
      // Temporarily allow the dropdown to close and select all customer IDs
      setDisableClose(false);
      const allCustomerIds = customers.map((c) => c._id);
      formik.setFieldValue("userIds", allCustomerIds);
      // Restore behavior after the change so other selections don't close dropdown
      setTimeout(() => setDisableClose(true), 0);
    } else {
      // Map selected items to their IDs
      const selectedIds = value
        .filter((v) => v._id !== "all")
        .map((v) => v._id);
      formik.setFieldValue("userIds", selectedIds);
    }
  };

  const handleOptionClick = (event: any, option: any) => {
    // Toggle "All Active Users" selection
    if (option._id === "all") {
      // Allow the dropdown to close when the user clicks the "all" option
      setDisableClose(false);
      if (isAllSelected) {
        // All are selected, so unselect all
        formik.setFieldValue("userIds", []);
      } else {
        // Not all selected, so select all
        const allCustomerIds = customers.map((c) => c._id);
        formik.setFieldValue("userIds", allCustomerIds);
      }
      // Restore the default behavior shortly after
      setTimeout(() => setDisableClose(true), 0);
    }
  };

  const handleCancel = () => {
    formik.resetForm();
  };

  return (
    <Box
      component="form"
      onSubmit={formik.handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
    >
      {/* Selected Users Count Indicator */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 1,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#333" }}>
          Selected Users
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, color: "var(--primary)" }}
        >
          {formik.values.userIds.length} / {customers.length}
        </Typography>
      </Box>

      <Autocomplete
        multiple
        disabled={loading}
        disableCloseOnSelect={disableClose}
        options={autocompleteOptions}
        value={selectedOptions}
        onChange={handleAutocompleteChange}
        // This prevents the UI from becoming massive when 50+ items are selected
        limitTags={2}
        getOptionLabel={(option) => {
          if (option._id === "all") return "All Active Users";
          return option.mobile && option.email
            ? `${option.mobile} • ${option.email}`
            : option.mobile || option.email || "Unknown";
        }}
        isOptionEqualToValue={(option, value) => option._id === value._id}
        sx={{
          width: "100%",
          // Fix for the border: Apply max height to the root container
          "& .MuiOutlinedInput-root": {
            maxHeight: "90px",
            overflowY: "auto",
            alignItems: "start",
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--color-primary)",
            },
          },
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select Customers *"
            size="small"
            margin="dense"
            error={formik.touched.userIds && Boolean(formik.errors.userIds)}
            placeholder={selectedOptions.length === 0 ? "Search..." : ""}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
          />
        )}
        renderOption={(props, option, { selected }) => {
          const isOptionChecked = isAllSelected || selected;
          return (
            <li
              {...props}
              key={option._id}
              onMouseDown={(e) => handleOptionClick(e, option)}
            >
              <Checkbox checked={isOptionChecked} sx={{ mr: 1 }} />
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: option._id === "all" ? "bold" : "normal" }}
                >
                  {option._id === "all" ? "All Active Users" : option.mobile}
                </Typography>
                {option._id !== "all" && option.email && (
                  <Typography variant="caption" color="textSecondary">
                    {option.email}
                  </Typography>
                )}
              </Box>
            </li>
          );
        }}
      />

      {/* Title Input */}
      <Box>
        <TextField
          label="Notification Title *"

          fullWidth
          size="small"

          margin="dense"
          InputLabelProps={{ shrink: true }}
          value={formik.values.title}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= MAX_TITLE_LENGTH) {
              formik.setFieldValue("title", value);
            }
          }}
          onBlur={formik.handleBlur}
          name="title"
          inputProps={{ maxLength: MAX_TITLE_LENGTH }}
          error={formik.touched.title && Boolean(formik.errors.title)}
        />
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mt: 0.25,
          }}
        >

          <Typography
            variant="caption"
            sx={{ color: "#999", fontSize: "12px" }}
          >
            {formik.values.title.length}/{MAX_TITLE_LENGTH}
          </Typography>
        </Box>
        <Box>
          {formik.touched.title && formik.errors.title && (
            <ErrorMessageCom error={formik.errors.title} />
          )}
        </Box>
      </Box>

      {/* Message Textarea */}
      {/* <TextField
                label="Notification Message *"
                multiline
                rows={6}
                InputLabelProps={{ shrink: true }}
                inputProps={{ maxLength: MAX_MESSAGE_LENGTH }}
                {...formik.getFieldProps("message")}
                error={formik.touched.message && Boolean(formik.errors.message)}
            /> */}

      <Box sx={{ mt: 0 }}>
        <TextareaField
          id="targetScreen"
          name="alt"
          label="Message"

          value={formik.values.message}
          onChange={(e) => {
            formik.setFieldValue("message", e.target.value);
          }}
          placeholder="Enter message here"
          maxLength={MAX_MESSAGE_LENGTH}
          rows={4}
          showCount={true}
          className=""

        />
      </Box>
      {formik.touched.message && formik.errors.message && (
        <ErrorMessageCom error={formik.errors.message} />
      )}
      <Box className="ButtonOuter" sx={{ mt: 0.5, mb: "10px", display: "flex", justifyContent: "flex-end" }}>
        <Box className="buttoninner">
          <CustomButton type="submit" disabled={loading}>
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
        </Box>
      </Box>
    </Box>
  );
}
