import { 
  Box, 
  Button, 
  CircularProgress, 
  IconButton, 
  Typography, 
  useTheme,
  Fade,
  Paper
} from "@mui/material";

import { CloudUpload, X, ZoomIn, Upload, Trash2, RefreshCw } from "lucide-react";

import { FormikProps } from 'formik';

interface ImageUploadFieldProps {
  formik: FormikProps<any>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteImage: (url: string) => void;
  previewOpen: boolean;
  setPreviewOpen: (open: boolean) => void;
  uploading: boolean;
  deleting: boolean;
  label: string;
  id: string;
}

export const ImageUploadField = ({
  formik,
  handleFileChange,
  handleDeleteImage,
  previewOpen,
  setPreviewOpen,
  uploading,
  deleting,
  label,
  id,
}: ImageUploadFieldProps) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="subtitle2"
        fontWeight={600}
        color="text.primary"
        sx={{ mb: 1.5, letterSpacing: 0.1 }}
      >
        {label}
        <Typography component="span" color="error.main" sx={{ ml: 0.5 }}>
          *
        </Typography>
      </Typography>

      {formik.values.images.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            position: "relative",
            borderRadius: 2,
            borderWidth: 2,
            borderStyle: "dashed",
            borderColor: theme.palette.divider,
            bgcolor: theme.palette.grey[50],
            transition: "all 0.2s ease-in-out",
            overflow: "hidden",
            "&:hover": {
              borderColor: theme.palette.primary.main,
              bgcolor: theme.palette.primary.light + "08",
              "& .upload-icon": {
                transform: "scale(1.1)",
                color: theme.palette.primary.main,
              },
            },
          }}
        >
          <input
            id={id}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            style={{ display: "none" }}
          />
          <Button
            component="label"
            htmlFor={id}
            disabled={uploading}
            sx={{
              width: "100%",
              minHeight: 140,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              textTransform: "none",
              color: "text.secondary",
              "&:hover": {
                bgcolor: "transparent",
              },
            }}
          >
            {uploading ? (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <CircularProgress size={40} thickness={4} />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Uploading...
                </Typography>
              </Box>
            ) : (
              <>
                <CloudUpload
                  className="upload-icon"
                  style={{
                    fontSize: 48,
                    transition: "all 0.2s ease-in-out",
                  }}
                />
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="text.primary"
                    sx={{ mb: 0.5 }}
                  >
                    Click to upload or drag and drop
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    PNG, JPG or WEBP (max. 5MB)
                  </Typography>
                </Box>
              </>
            )}
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
          <Paper
            variant="outlined"
            sx={{
              position: "relative",
              borderRadius: 2,
              overflow: "hidden",
              width: "fit-content",
              "&:hover .image-overlay": {
                opacity: deleting ? 0 : 1,
              },
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: 200,
                height: 200,
              }}
            >
              <img
                src={formik.values.images[0]}
                alt={label}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  opacity: deleting ? 0.5 : 1,
                  transition: "opacity 0.2s ease-in-out",
                }}
              />

              {/* Loading overlay for deletion */}
              {deleting && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    bgcolor: "rgba(0, 0, 0, 0.6)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1.5,
                  }}
                >
                  <CircularProgress size={40} thickness={4} sx={{ color: "white" }} />
                  <Typography variant="body2" color="white" fontWeight={600}>
                    Deleting...
                  </Typography>
                </Box>
              )}

              {/* Overlay with actions */}
              {!deleting && (
                <Box
                  className="image-overlay"
                  sx={{
                    position: "absolute",
                    inset: 0,
                    bgcolor: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    opacity: 0,
                    transition: "opacity 0.2s ease-in-out",
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => setPreviewOpen(true)}
                    sx={{
                      bgcolor: "white",
                      "&:hover": { bgcolor: "grey.100" },
                      boxShadow: 2,
                    }}
                  >
                    <ZoomIn style={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteImage(formik.values.images[0])}
                    sx={{
                      bgcolor: "white",
                      color: "error.main",
                      "&:hover": {
                        bgcolor: "error.main",
                        color: "white",
                      },
                      boxShadow: 2,
                    }}
                  >
                    <Trash2 style={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              )}

              {/* Status badge */}
              {!deleting && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    bgcolor: "success.main",
                    color: "white",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    boxShadow: 2,
                  }}
                >
                  <Upload style={{ fontSize: 14 }} />
                  <Typography variant="caption" fontWeight={600}>
                    Uploaded
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Change Image Button */}
          {!deleting && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <input
                id={`${id}-replace`}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                style={{ display: "none" }}
              />
              <Button
                component="label"
                htmlFor={`${id}-replace`}
                variant="outlined"
                startIcon={<RefreshCw />}
                disabled={uploading}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderWidth: 2,
                  "&:hover": {
                    borderWidth: 2,
                  },
                }}
              >
                {uploading ? "Uploading..." : "Change Image"}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Trash2 />}
                onClick={() => handleDeleteImage(formik.values.images[0])}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderWidth: 2,
                  "&:hover": {
                    borderWidth: 2,
                    bgcolor: "error.light",
                    color: "white",
                  },
                }}
              >
                Delete
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* Preview Modal */}
      {previewOpen && (
        <Fade in={previewOpen}>
          <Box
            onClick={() => setPreviewOpen(false)}
            sx={{
              position: "fixed",
              inset: 0,
              zIndex: 1300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(8px)",
              p: 2,
            }}
          >
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{
                position: "relative",
                maxWidth: "90vw",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Paper
                elevation={24}
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  maxHeight: "85vh",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={formik.values.images[0]}
                  alt="Preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "85vh",
                    display: "block",
                  }}
                />
              </Paper>

              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Button
                  onClick={() => setPreviewOpen(false)}
                  variant="contained"
                  startIcon={<X />}
                  sx={{
                    bgcolor: "white",
                    color: "text.primary",
                    fontWeight: 600,
                    px: 3,
                    "&:hover": {
                      bgcolor: "grey.100",
                    },
                  }}
                >
                  Close Preview
                </Button>
              </Box>
            </Box>
          </Box>
        </Fade>
      )}
    </Box>
  );
};