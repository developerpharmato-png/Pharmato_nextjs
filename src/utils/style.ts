import { he } from "date-fns/locale";


export const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", sm: 400 },
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  // p: 4,
  overflowY: "scroll",
  height: "70vh",
};

// To hide scrollbars for modal, add the following CSS to your global stylesheet (e.g., globals.css):
//
// .modalStyle {
//   scrollbar-width: none; /* Firefox */
//   -ms-overflow-style: none; /* IE 10+ */
// }
// .modalStyle::-webkit-scrollbar {
//   display: none; /* Chrome, Safari, Opera */
// }



export const modalStyles = {
  paper: {
    borderRadius: "16px",
    maxHeight: "90vh", // Prevents dialog from hitting screen edges
    display: "flex",
    flexDirection: "column",
    overflow: "hidden", // Removes outer scrollbar
  },
  content: {
    px: 3,
    py: 1, // Reduced padding
    "&::-webkit-scrollbar": { width: "6px" },
    "&::-webkit-scrollbar-thumb": { backgroundColor: "#e2e8f0", borderRadius: "10px" },
  },
  sectionHeader: {
    fontWeight: 700,
    fontSize: "0.75rem",
    color: "text.secondary",
    textTransform: "uppercase",
    mb: 0.5,
  },
  noticeBox: {
    backgroundColor: "rgba(239, 68, 68, 0.04)",
    p: 1.2,
    borderRadius: "8px",
    mb: 2,
    border: "1px solid rgba(239, 68, 68, 0.15)",
  },
  noticeText: {
    color: "#b91c1c",
    fontSize: "0.75rem",
    display: "block",
  },
  chipContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: 0.75,
    mb: 1,
  },
  confirmChip: {
    backgroundColor: "#f0fdf4",
    color: "#166534",
    fontWeight: 600,
    fontSize: "0.75rem",
    borderRadius: "6px",
    border: "1px solid #dcfce7",
  },
  cancelChip: {
    backgroundColor: "#fff7ed",
    color: "#9a3412",
    fontWeight: 600,
    fontSize: "0.75rem",
    borderRadius: "6px",
    border: "1px solid #ffedd5",
  },
  refundBox: {
    mt: 1,
    p: 1.5,
    display: "flex",
    justifyContent: "flex-end",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px dashed #cbd5e1",
  },
  textField: {
    mt: 1.5,
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      fontSize: "0.85rem",
      "&.Mui-focused fieldset": { borderColor: "var(--status-danger-text)" },
    },
  },
  actions: {
    px: 3,
    py: 2,
    borderTop: "1px solid #f1f5f9", // Separation line for clarity
  },
  cancelBtn: {
    color: "text.secondary",
    textTransform: "none",
    fontWeight: 600,
  },
  confirmBtn: {
    backgroundColor: "var(--status-danger-text)",
    textTransform: "none",
    fontWeight: 600,
    borderRadius: "8px",
    px: 3,
    "&:hover": { backgroundColor: "#7f1d1d" },
  },
};