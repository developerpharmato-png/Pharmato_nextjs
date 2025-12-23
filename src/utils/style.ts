export const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", sm: 400 },
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};


export const modalStyles = {
  // Dialog Paper Container
  paper: {
    overflow: "visible",
    borderRadius: "16px",
    padding: "8px",
  },
  
  // Dialog Content area
  content: {
    overflow: "visible",
  },

  // Warning/Notice Box (Tailwind equivalent in SX)
  noticeBox: {
    backgroundColor: "var(--status-danger-bg)",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "16px",
    border: "1px solid",
    borderColor: "rgba(var(--status-danger-text-rgb), 0.1)", // Adjust based on your variable setup
  },

  // Cancel Button (Secondary/Ghost)
  cancelBtn: {
    color: "gray",
    fontWeight: "bold",
    textTransform: "none",
    borderRadius: "8px",
    "&:hover": { backgroundColor: "#f5f5f5" },
  },

  // Confirm/Danger Button
  confirmBtn: {
    backgroundColor: "var(--status-danger-text)",
    textTransform: "none",
    fontWeight: "bold",
    borderRadius: "8px",
    px: 4,
    "&:hover": {
      backgroundColor: "#7f1d1d",
      boxShadow: "0 4px 12px rgba(153, 27, 27, 0.2)",
    },
    "&.Mui-disabled": {
      backgroundColor: "#f3f4f6",
      color: "#9ca3af",
    },
  },

  // Action Container
  actions: {
    p: 3,
    pt: 1,
    gap: 1,
  },

  // Danger-themed TextField
  textField: {
    mt: 2,
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      fontSize: "0.9rem",
      "&.Mui-focused fieldset": {
        borderColor: "var(--status-danger-text)",
      },
    },
    "& .MuiInputBase-input::placeholder": {
      fontSize: "0.85rem",
      opacity: 0.6,
    },
  },
};