import React from "react";
import { styled } from "@mui/material/styles";
import Tooltip, { tooltipClasses, TooltipProps } from "@mui/material/Tooltip";
interface ErrorMessageComProps {
  error: string;
}

export const ErrorMessageCom = ({ error }: ErrorMessageComProps) => {
  return (
    <>
      <div className="bg-red-50 border-l-4 border-red-400 p-1 rounded-r-lg mt-2 ml-3">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-red-400 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            ></path>
          </svg>
          <span className="text-red-700 text-sm font-medium">{error}</span>
        </div>
      </div>
    </>
  );
};

interface CustomButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  width?: string;
  height?: string;
}
export const CustomButton = ({
  children,
  onClick,
  disabled,
  type = "button",
  className = "",
  width = "100px",
  height,
}: CustomButtonProps) => {
  const buttonStyle: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={buttonStyle}
      className={`relative cursor-pointer overflow-hidden px-8 py-2 rounded-xl font-semibold text-white shadow-lg 
        ${
          disabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-(--primary) hover:bg-(--primary)"
        } 
        transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-(--primary) focus:ring-offset-2 group
        ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-0 bg-white/20 transition-all duration-300 group-hover:h-1/2"></div>

      <div className="absolute inset-x-0 bottom-0 h-0 bg-white/10 transition-all duration-300 group-hover:h-1/2"></div>

      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>

      <div className="absolute inset-0 -top-full bg-linear-to-b from-transparent via-white/10 to-transparent transform transition-transform duration-1000 group-hover:translate-y-full"></div>
    </button>
  );
};

export const CustomTooltip = styled(
  ({
    className,
    children,
    ...props
  }: TooltipProps & { className?: string; children: React.ReactNode }) => (
    <Tooltip {...props} arrow classes={{ popper: className }}>
      {children}
    </Tooltip>
  )
)(({}) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "var(--primary)",
    color: "var(--color-white)",
    fontSize: "0.875rem",
    padding: "8px 12px",
    borderRadius: "8px",
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: "var(--primary)",
  },
}));

// A consistent close button used across dialogs and modals
export const CustomCloseButton: React.FC<{
  onClick?: () => void;
  size?: 'small' | 'medium';
  ariaLabel?: string;
  sx?: any;
}> = ({ onClick, size = 'medium', ariaLabel = 'close', sx }) => {
  return (
    <IconButton
      onClick={onClick}
      size={size}
      aria-label={ariaLabel}
      sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' }, ...sx }}
    >
      <CloseIcon />
    </IconButton>
  );
};

import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import MobileStepper from "@mui/material/MobileStepper";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import { Box, Typography } from "@mui/material";

interface CustomImageProps {
  coverImage: string;
  images?: string[];
  alt?: string;
  style?: React.CSSProperties;
}


export const CustomImage: React.FC<CustomImageProps> = ({
  coverImage,
  images = [],
  alt = "",  
  style,
}) => {
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState(0);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length > 0) setOpen(true);
    setCurrent(0);
  };
  const handleClose = () => setOpen(false);

  const handleStep = (step: number) => setCurrent(step);

  return (
    <>
      <img
        src={coverImage}
        alt={alt}
        style={style}
        onClick={handleOpen}
        className={images.length > 0 ? "cursor-pointer" : ""}
      />
      <Dialog open={open} onClose={handleClose} maxWidth="md">
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 180,
              minWidth: 180,
              position: "relative",
              flexDirection: "column",
            }}
          >
            {images.length > 1 ? (
              <>
                <img
                  src={images[current]}
                  alt={`img-${current}`}
                  style={{
                    height: 240,
                    width: 240,
                    objectFit: "cover",
                    borderRadius: 8,
                    margin: 8,
                  }}
                />
                <MobileStepper
                  steps={images.length}
                  position="static"
                  activeStep={current}
                  nextButton={
                    <IconButton
                      size="small"
                      onClick={() => handleStep((current + 1) % images.length)}
                      disabled={images.length <= 1}
                    >
                      <KeyboardArrowRight />
                    </IconButton>
                  }
                  backButton={
                    <IconButton
                      size="small"
                      onClick={() => handleStep((current - 1 + images.length) % images.length)}
                      disabled={images.length <= 1}
                    >
                      <KeyboardArrowLeft />
                    </IconButton>
                  }
                  sx={{
                    background: "transparent",
                    marginTop: 2,
                  }}
                />
              </>
            ) : (
              <img
                src={images[0] || coverImage}
                alt={alt}
                style={{
                  height: 240,
                  width: 240,
                  objectFit: "cover",
                  borderRadius: 8,
                  margin: 8,
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const BackArrowIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-6 h-6"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

// Helper function for the image upload SVG path
export const ImageUploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-8 h-8 text-gray-500"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5V7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.25 12.75l2.25 3 3-4.5 4.5 6"
    />
  </svg>
);

// Helper function for the image delete SVG path
export const DeleteIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-4 h-4"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);





// ModalHeader.tsx


interface ModalHeaderProps {
    title: string;
    onClose: () => void;
}

export function ModalHeader({ title, onClose }: ModalHeaderProps) {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                pb: 1,
                // New: Subtle background color and bottom margin for separation
                backgroundColor: 'rgba(0, 128, 0, 0.05)', // Light green tint
                borderRadius: '8px 8px 0 0',
                mx: -4, // Extend to modal edges (compensates for box padding)
                mt: -4,
                px: 4,
                py: 2,
            }}
        >
            <Typography id="modal-title" variant="h6" component="h2" 
                sx={{ 
                    fontWeight: 700, 
                    color: 'var(--primary)', // Use theme primary color (green)
                }}>
                {title}
            </Typography>
            <IconButton onClick={onClose} aria-label="close" sx={{ color: 'var(--primary)' }}>
                <CloseIcon />
            </IconButton>
        </Box>
    );
}