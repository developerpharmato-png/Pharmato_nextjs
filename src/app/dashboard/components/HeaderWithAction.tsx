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
  isunsaved = true,
  onBack,
  ExportButton,
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
      className="absolute left-0 top-0 inline-flex items-center justify-center w-10 h-10 text-gray-500 bg-white border border-gray-200 rounded-full shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
      aria-label={`Go ${backLabel}`}
    >
      <BackArrowIcon />
    </button>
  );

  const addAction = addShow ? (
    <CustomButton type="submit" onClick={handleAdd} width="100px">
      <span className="hidden sm:inline">{addLabel}</span>
    </CustomButton>
  ) : (
    addHref && (
      <Link
        href={addHref}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md flex items-center gap-2 font-medium"
      >
        <span className="material-icons">add</span>
        <span className="hidden sm:inline">{addLabel}</span>
      </Link>
    )
  );

  return (
    <div className="relative mb-4">
      {backButton}

      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-4 ${showBack ? "pl-14" : ""}`}>
          <div>
            <h1
              className="text-2xl sm:text-4xl font-bold text-gray-800"
              style={{
                // Title gradient retained
                backgroundImage: `linear-gradient(90deg, #10B981, #059669)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "#10B981",
              }}
            >
              {title}
            </h1>
            {subtitle && (
              // Subtitle and the new styled line
              <div>
                <p className="text-gray-600 hidden sm:block">{subtitle}</p>
                <div
                  // NEW: Styled green gradient line below the subtitle
                  className="hidden sm:block mt-1 h-0.5 w-12 rounded-full"
                  style={{
                    backgroundImage: `linear-gradient(90deg, #059669, #10B981, #A7F3D0)`, // Dark Green to Light Green Gradient
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {ExportButton && <>{ExportButton}</>}

          {rightNode}
          {addAction}
        </div>
      </div>
    </div>
  );
}
