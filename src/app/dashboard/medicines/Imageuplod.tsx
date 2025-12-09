import React, { useState } from "react";

// --- 1. TYPE DEFINITIONS ---
// Define the shape of the form data related to images
interface ImageFormState {
  images: string[];
  coverImage: string;
}

// Props for the main Uploader component
interface MedicineImageUploaderProps {
  form: ImageFormState;
  touched: { images?: boolean };
  errors: { images?: string | string[] };
  uploading: boolean;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setPrimaryImage: (url: string) => void;
  handleDeleteImage: (url: string) => void;
  // NEW: Handler for opening the gallery/slider
  openSlider: (index: number) => void;
}

// Props for the Image Display Card
interface ImageDisplayCardProps {
  url: string;
  index: number; // For identifying which image was clicked
  coverImage: string;
  setPrimaryImage: (url: string) => void;
  handleDeleteImage: (url: string) => void;
  openSlider: (index: number) => void;
}

// --- Utility Components ---

const ErrorMessageCom: React.FC<{ error: string | string[] }> = ({ error }) => {
  const errorMessage = Array.isArray(error) ? error.join(", ") : error;
  return <p className="text-red-500 text-sm mt-1">{errorMessage}</p>;
};

// --- Reusable Component 1: ImageUploadButton ---

const ImageUploadButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-28 w-28 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-400 rounded-lg hover:bg-gray-100 transition duration-150 shadow-inner"
      title="Upload photos"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-9 h-9 text-gray-500"
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
    </button>
  );
};

// --- Reusable Component 2: ImageDisplayCard ---

const ImageDisplayCard: React.FC<ImageDisplayCardProps> = ({
  url,
  index,
  coverImage,
  setPrimaryImage,
  handleDeleteImage,
  openSlider,
}) => {
  const isPrimary = coverImage === url;

  return (
    // STYLED IMAGE CONTAINER
    <div className="relative h-24 w-24 rounded-lg shadow-md border border-gray-300 overflow-hidden group">
      <img
        src={url}
        alt="Medicine"
        className="h-full w-full object-cover cursor-pointer"
        onClick={() => openSlider(index)} // <-- CLICK TO OPEN SLIDER
      />

      {/* Primary Tag / Set Primary Button */}
      {isPrimary ? (
        <span className="absolute top-1 left-1 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg font-semibold z-10">
          Primary
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setPrimaryImage(url)}
          className="absolute top-1 left-1 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg transition duration-200 font-semibold opacity-80 hover:opacity-100 z-10"
          title="Set as primary"
        >
          Set Primary
        </button>
      )}

      {/* Delete Button - ALWAYS VISIBLE */}
      <button
        type="button"
        onClick={() => handleDeleteImage(url)}
        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg transition duration-200 hover:bg-red-700 z-10"
        title="Delete image"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

// --- Main Component: MedicineImageUploader ---

const MedicineImageUploader: React.FC<MedicineImageUploaderProps> = ({
  form,
  touched,
  errors,
  uploading,
  handleFileChange,
  setPrimaryImage,
  handleDeleteImage,
  openSlider, // New prop
}) => {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-800 mb-2">
        Medicine Images *
        <p className="text-xs text-gray-500 font-normal">
          Min 1, Max 5 images. Each &le; 5MB.
        </p>
      </label>
      
      {/* Hidden File Input (ID changed to match the original requirement: "medicine-image-input") */}
      <input
        id="medicine-image-input" // Changed ID to avoid conflict with "medicine-edit-image-input" if both are used
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      
      {/* Upload Button and Upload Status */}
      <div className="flex items-center gap-4">
        <ImageUploadButton
          onClick={() =>
            document.getElementById("medicine-image-input")?.click()
          }
        />
        {uploading && (
          <span className="text-blue-600 font-medium">Uploading...</span>
        )}
      </div>

      {/* Form Validation Error */}
      {touched?.images && errors?.images && (
        <ErrorMessageCom error={errors.images} />
      )}
      
      {/* Image Display Cards */}
      {form.images.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3 justify-start w-fit">
          {form.images.map((url, index) => (
            <ImageDisplayCard
              key={url}
              url={url}
              index={index} // Pass the index to ImageDisplayCard
              coverImage={form.coverImage}
              setPrimaryImage={setPrimaryImage}
              handleDeleteImage={handleDeleteImage}
              openSlider={openSlider} // Pass the slider handler
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicineImageUploader;