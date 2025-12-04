import { styled } from '@mui/material/styles';
import Tooltip, { tooltipClasses, TooltipProps } from '@mui/material/Tooltip';
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
type CustomButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  width?: string;
  height?: string;
};

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
            : "bg-[var(--primary)] hover:bg-[var(--primary)]"
        } 
        transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 group
        ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-0 bg-white/20 transition-all duration-300 group-hover:h-1/2"></div>

      <div className="absolute inset-x-0 bottom-0 h-0 bg-white/10 transition-all duration-300 group-hover:h-1/2"></div>

      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>

      <div className="absolute inset-0 -top-full bg-gradient-to-b from-transparent via-white/10 to-transparent transform transition-transform duration-1000 group-hover:translate-y-full"></div>
    </button>
  );
};


export const CustomTooltip = styled(
  ({ className, children, ...props }: TooltipProps & { className?: string; children: React.ReactNode }) => (
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
