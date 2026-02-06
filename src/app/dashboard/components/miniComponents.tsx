import React, { useState } from "react";
import { styled } from "@mui/material/styles";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Zoom } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
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
    // width: width,
    height: height,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={buttonStyle}
      className={`relative cursor-pointer overflow-hidden px-8 py-2 rounded-xl font-semibold text-white shadow-lg 
        ${disabled
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
)(({ }) => ({
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
  size?: "small" | "medium";
  ariaLabel?: string;
  sx?: any;
}> = ({ onClick, size = "medium", ariaLabel = "close", sx }) => {
  return (
    <IconButton
      onClick={onClick}
      size={size}
      aria-label={ariaLabel}
      sx={{
        color: "text.secondary",
        "&:hover": { color: "error.main" },
        ...sx,
      }}
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


// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/zoom";
import "swiper/css/navigation";

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
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleOpen = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (images.length > 0) {
      // Find the index of the clicked image if it exists in the array
      const targetIndex = images.indexOf(coverImage);
      setCurrentIndex(targetIndex !== -1 ? targetIndex : 0);
      setOpen(true);
    }
  };

  const downloadImage = () => {
    const url = images[currentIndex];
    const link = document.createElement("a");
    link.href = url;
    link.download = `image_${currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <> 
      {/* Trigger Image */}
      <img
        src={coverImage}
        alt={alt}
        style={{ ...style, cursor: images.length > 0 ? "zoom-in" : "default" }}
        onClick={(e) => handleOpen(e, 0)}
        className="transition-all duration-300 hover:brightness-90 rounded-lg"
      />

      {open && (
        <>
          <div className="fixed inset-0 z-[1000] w-[90vw] h-[90vh]  flex items-center justify-center m-auto bg-white backdrop-blur-sm p-4">
            <div className="flex flex-col">
              <div className="absolute top-0 left-0 w-full p-5 flex justify-between items-center to-transparent">
                <span className="text-gray-400 font-medium">
                  {currentIndex + 1} / {images.length}
                </span>
                <div className="flex gap-4">
                  <button onClick={() => setOpen(false)} className="text-gray-400  hover:text-red-400 transition-colors" title="Close">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

            
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                <Swiper
                  modules={[Pagination, Zoom, Navigation]}
                  initialSlide={currentIndex}
                  zoom={{ maxRatio: 3, minRatio: 1, toggle: true }}
                  navigation={true}
                  pagination={{ clickable: true, type: 'bullets' }}
                  grabCursor={true}
                  simulateTouch={true}
                  onSlideChange={(swiper) => setCurrentIndex(swiper.activeIndex)}
                  className="w-full h-full max-w-5xl"
                  style={{
                    // Customizing Swiper Arrow Colors via CSS Variables
                    // @ts-ignore
                    "--swiper-navigation-color": "#fff",
                    "--swiper-pagination-color": "#fff",
                  }}
                >
                  {images.map((url, index) => (
                    <SwiperSlide key={index} className="flex items-center justify-center">
                        <div className="swiper-zoom-container cursor-grab">
                          <img
                            src={url}
                            alt={`Slide ${index}`}
                            draggable={false}
                            style={{ userSelect: "none" }}
                            className="max-h-[85vh] w-auto object-contain pointer-events-auto"
                          />
                        </div>
                    </SwiperSlide>
                  ))}
                </Swiper>

                <div className="absolute bottom-8 text-gray-500 text-xs hidden md:block text-center">
                   Double Click to Zoom 
                </div>
              </div>
            </div>

          </div>
        </>
      )}
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
        backgroundColor: "rgba(0, 128, 0, 0.05)", // Light green tint
        borderRadius: "8px 8px 0 0",
        padding: "16px",
      }}
    >

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",

          // New: Subtle background color and bottom margin for separation


        }}
      >
        <Typography
          id="modal-title"
          variant="h6"
          component="h2"
          sx={{
            fontWeight: 700,
            color: "var(--primary)", // Use theme primary color (green)
          }}
        >
          {title}
        </Typography>
        <IconButton
          onClick={onClose}
          aria-label="close"
          sx={{ color: "var(--primary)" }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

    </Box>
  );
}

interface StatusToggleButtonProps {
  isActive: boolean;
  onToggle: (newStatus: boolean) => void;
  loading?: boolean;
  disabled?: boolean;
}

export const StatusToggleButton: React.FC<StatusToggleButtonProps> = ({
  isActive,
  onToggle,
  loading = false,
  disabled = false,
}) => {
  return (
    <button
      onClick={() => onToggle(!isActive)}
      disabled={disabled || loading}
      className="relative cursor-pointer inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ backgroundColor: isActive ? "#10b981" : "#d1d5db" }}
      title={isActive ? "Click to deactivate" : "Click to activate"}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isActive ? "translate-x-6" : "translate-x-1"
          }`}
      />
    </button>
  );
};

interface ConfirmStatusAlertComponentProps {
  isActive: boolean;
  title?: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  children: React.ReactNode;
}

export const ConfirmStatusAlertComponent: React.FC<ConfirmStatusAlertComponentProps> = ({
  isActive,
  title,
  text,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  children,
}) => {
  const handleClick = () => {
    const { showConfirmStatusAlert } = require("./ConfirmStatusAlert");
    showConfirmStatusAlert({
      isActive,
      title: title || (isActive ? "Deactivate?" : "Activate?"),
      text: text || (isActive ? "Are you sure?" : "Are you sure?"),
      confirmText: confirmText || (isActive ? "Deactivate" : "Activate"),
      cancelText: cancelText || "Cancel",
      onConfirm,
      onCancel,
    });
  };

  return (
    <div onClick={handleClick}>
      {children}
    </div>
  );
};







