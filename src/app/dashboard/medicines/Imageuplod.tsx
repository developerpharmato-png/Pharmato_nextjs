import React, { useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { Swiper, SwiperSlide } from "swiper/react";
import { CustomImage } from "../components/miniComponents";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";
import { LucideDelete } from "lucide-react";
import DeleteIcon from "@mui/icons-material/Delete";
interface ImageFormState {
  images: string[];
  coverImage: string;
}

// Props for the main Uploader component
interface MedicineImageUploaderProps {
  id?: string;
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

interface ImageUploadButtonProps {
  onClick: () => void;
  loading?: boolean;
}

const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({ onClick, loading }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-28 w-28 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-400 rounded-lg hover:bg-gray-100 transition duration-150 shadow-inner relative"
      title="Upload photos"
      disabled={loading}
    >
      {/* Loader overlay in center */}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 rounded-lg">
          <CircularProgress size={40} thickness={5} color="primary" />
        </span>
      )}
      {/* Icon is faded when loading */}
      <span className={loading ? "opacity-30" : "opacity-100"}>
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
      </span>
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
    <div className="relative h-44 w-44 rounded-lg shadow-md border border-gray-300 overflow-hidden group">
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
        className="absolute top-1 right-1  bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition duration-200 hover:bg-red-700 z-10"
        title="Delete image"
      >
        <DeleteIcon />
      </button>
    </div>
  );
};

// --- Main Component: MedicineImageUploader ---

const MedicineImageUploader: React.FC<MedicineImageUploaderProps> = ({
  id,
  form,
  touched,
  errors,
  uploading,
  handleFileChange,
  setPrimaryImage,
  handleDeleteImage,
  openSlider,
}) => {
  const [sliderOpen, setSliderOpen] = React.useState(false);
  const [sliderIndex, setSliderIndex] = React.useState(0);

  const handleOpenSlider = (index: number) => {
    setSliderIndex(index);
    setSliderOpen(true);
  };

  const handleCloseSlider = () => {
    setSliderOpen(false);
  };

  return (
    <div id={id} tabIndex={-1} className="outline-none">
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
          loading={uploading}
        />
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
              openSlider={handleOpenSlider}
            />
          ))}
        </div>
      )}


      {sliderOpen && (
        <div className="fixed inset-0  bg-opacity-75 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl relative p-4">
            {" "}

            <button
              onClick={handleCloseSlider}
              // Close button position and color updated for a dark overlay
              className="absolute top-0 right-0 m-4 bg-white/70 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold hover:bg-white hover:text-red-600 transition duration-150 z-10"
              title="Close"
            >
              &times;
            </button>
            <Swiper
              initialSlide={sliderIndex}
              spaceBetween={10}
              slidesPerView={1}
              pagination={{ clickable: true }}
              modules={[Pagination]}
              // MODIFICATION: Increased Swiper container height for better visual impact
              className="w-full h-[70vh] max-h-[700px] rounded-xl overflow-hidden"
            >
              {form.images.map((url, index) => (
                // MODIFICATION: Added background to SwiperSlide for contrast
                <SwiperSlide
                  key={index}
                  className="flex items-center justify-center bg-gray-100 rounded-xl"
                >
                  <img
                    src={url}
                    alt={`Slide ${index}`}
                    // CRITICAL MODIFICATION: object-contain ensures the full image is visible without cropping.
                    // Increased image container height to utilize more of the SwiperSlide area.
                    className="max-w-full w-full h-full object-contain p-4"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
            {/* Display index */}
            <div className="text-center py-2 text-gray-700 font-semibold border-t border-gray-200 mt-2">
              Viewing Image {sliderIndex + 1} of {form.images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineImageUploader;
