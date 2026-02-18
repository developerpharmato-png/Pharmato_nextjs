"use client";

import Link from "next/link";
import { CustomButton } from "./miniComponents";
import { useRouter } from "next/navigation";
import { showUnsavedConfirm } from "../components/ConfirmNavigation";

type Props = {
  title: string;
  subtitle?: string;
  backLabel?: string;
  addLabel?: string;
  addHref?: string;
  showBack?: boolean;
  showSearch?: boolean;
  searchValue?: string;
  addShow?: boolean;
  handleAdd?: () => void;
  onSearchChange?: (value: string) => void;
  rightNode?: React.ReactNode;
  isunsaved?: boolean;
  onBack?: () => void;
  ExportButton?: React.ReactNode;
  showclearAll?: boolean;
  showOrderFilters?: boolean;
  prescriptionStatus?: any;
  setPrescriptionStatus?: (value: any) => void;
  orderStatus?: any;
  lastSyncDateTime?: any;
  setOrderStatus?: (value: any) => void;
  setPage?: (value: any) => void;
};

import React from "react";

const BackArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

// Search Magnifying Gladdss SVG
const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
  >
    <circle cx="11" cy="11" r="8" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
  </svg>
);

// Clear (X) SVG
const ClearIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

// --- Main Component ---

export default function HeaderWithAction({
  title,
  subtitle,
  backLabel = "Back",
  addLabel = "Add",
  addHref,
  showBack = true,
  showSearch = false,
  searchValue,
  onSearchChange,
  rightNode,
  addShow = false,
  handleAdd,
  isunsaved = false,
  onBack,
  ExportButton,
  showclearAll = true,
  lastSyncDateTime = ""
}: Props) {
  const router = useRouter();

  const handleBack = async () => {
    if (onBack) {
      onBack();
      return;
    }

    if (isunsaved) {
      const confirm = await showUnsavedConfirm({
        title: "Unsaved Changes",
        text: "Your data is not saved. Are you sure you want to leave?",
      });
      if (confirm) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  const backButton = showBack && (
    <button
      type="button"
      onClick={handleBack}
      className="absolute left-0 top-0 inline-flex items-center justify-center w-10 h-10 text-gray-500 bg-white border border-gray-200 rounded-full shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 z-10"
      aria-label={`Go ${backLabel}`}
    >
      <BackArrowIcon />
    </button>
  );

  const addAction = addShow ? (
    <CustomButton type="submit" onClick={handleAdd} width="auto" className="min-w-[40px] sm:min-w-[100px] px-3">
      <span className="material-icons sm:hidden">add</span>
      <span className="hidden sm:inline">{addLabel}</span>
    </CustomButton>
  ) : (
    addHref && (
      <Link
        href={addHref}
        className="p-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md flex items-center gap-2 font-medium"
      >
        <span className="material-icons text-xl">add</span>
        <span className="hidden sm:inline">{addLabel}</span>
      </Link>
    )
  );

  return (
    <div className="relative mb-6 w-full">
      {backButton}

      {/* Main Flex Wrapper: Stacks on mobile, row on desktop */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        {/* Title and Subtitle Area */}
        <div className={`flex flex-col gap-1 ${showBack ? "pl-12 sm:pl-14" : ""}`}>
          <h1
            className="text-xl sm:text-3xl md:text-4xl font-bold leading-tight"
            style={{
              backgroundImage: `linear-gradient(90deg, #10B981, #059669)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "#10B981",
            }}
          >
            {title}
          </h1>

          {subtitle && (
            <div className="flex flex-col">
              {/* Subtitle: Visible on small screens but smaller font, full detail on desktop */}
              <p className="text-gray-500 text-xs sm:text-sm md:text-base line-clamp-1 sm:line-clamp-none">
                {subtitle}
              </p>

              <div
                className="mt-1 h-0.5 w-8 sm:w-12 rounded-full"
                style={{
                  backgroundImage: `linear-gradient(90deg, #059669, #10B981, #A7F3D0)`,
                }}
              />

              {lastSyncDateTime && (
                <p className="text-gray-400 text-[10px] sm:text-xs mt-1 italic">
                  Last Synced: {lastSyncDateTime}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions Area (Export, RightNode/Wallet, Add) */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 flex-wrap">
          {ExportButton && (
            <div className="scale-90 sm:scale-100">
              {ExportButton}
            </div>
          )}

          <div className="flex items-center gap-2">
            {rightNode}
            {addAction}
          </div>
        </div>
      </div>
    </div>
  );
}
