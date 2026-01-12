import React from "react";
import { FormikProps } from "formik";
// Moved imports to the top level
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import DeleteIcon from "@mui/icons-material/Delete";

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

interface SwiperModalProps {
  images: string[];
  onClose: () => void;
}

// Extracted SwiperModal to a separate component (outside the main function)
const SwiperModal: React.FC<SwiperModalProps> = ({ images, onClose }) => {
  const [sliderIndex, setSliderIndex] = React.useState(0);
  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl relative p-4" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-0 right-0 m-4 bg-white/70 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold hover:bg-white hover:text-red-600 transition duration-150 z-10"
          title="Close"
        >
          &times;
        </button>
        <Swiper
          initialSlide={0}
          spaceBetween={10}
          slidesPerView={1}
          pagination={{ clickable: true }}
          modules={[Pagination]}
          onSlideChange={swiper => setSliderIndex(swiper.activeIndex)}
          className="w-full h-[60vh] max-h-[500px] rounded-xl overflow-hidden"
        >
          {images.map((url, index) => (
            <SwiperSlide key={index} className="flex items-center justify-center bg-gray-100 rounded-xl">
              <img
                src={url}
                alt={`Slide ${index}`}
                className="max-w-full w-full h-full object-contain p-4"
              />
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="text-center py-2 text-gray-700 font-semibold border-t border-gray-200 mt-2">
          Viewing Image {sliderIndex + 1} of {images.length}
        </div>
      </div>
    </div>
  );
};

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
  return (
    <div className="mb-4">
      <label className="block text-sm font-bold text-gray-800 mb-2">
        {label} <span className="text-red-500">*</span>
        <p className="text-xs text-gray-500 font-normal">PNG, JPG or WEBP (max. 5MB)</p>
      </label>

      {/* Hidden File Input */}
      <input
        id={id}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        style={{ display: "none" }}
      />

      <div className="flex gap-4 items-start">
        {/* Upload Button */}
        <button
          type="button"
          onClick={() => document.getElementById(id)?.click()}
          className="h-28 w-28 flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-400 rounded-lg hover:bg-gray-100 transition duration-150 shadow-inner relative text-gray-500"
          disabled={uploading}
        >
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 rounded-lg">
              <svg className="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            </span>
          )}
          <span className={uploading ? "opacity-30" : "opacity-100"}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-9 h-9">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 12.75l2.25 3 3-4.5 4.5 6" />
            </svg>
          </span>
        </button>

       
        {/* Show preview for web-banner-image-input, url, or images[0] (for categories) */}
        {(id === "web-banner-image-input"
          ? !!formik.values.webImage
          : id === "category-image-input"
            ? Array.isArray(formik.values.images) && formik.values.images.length > 0
            : !!formik.values.url) && (
          <div className="relative h-28 w-28 rounded-lg shadow-md border border-gray-300 overflow-hidden group cursor-pointer mt-1" onClick={() => setPreviewOpen(true)}>
            <img
              src={id === "web-banner-image-input"
                ? formik.values.webImage
                : id === "category-image-input"
                  ? formik.values.images[0]
                  : formik.values.url}
              alt={label}
              className={`h-full w-full object-cover transition-opacity duration-200 ${deleting ? "opacity-50" : "opacity-100"}`}
            />
            <button
              type="button"
              className="absolute top-1 right-1 bg-white text-red-600 rounded-full w-7 h-7 flex items-center justify-center shadow-lg hover:bg-red-600 hover:text-white transition z-10"
              onClick={e => {
                e.stopPropagation();
                handleDeleteImage(
                  id === "web-banner-image-input"
                    ? formik.values.webImage
                    : id === "category-image-input"
                      ? formik.values.images[0]
                      : formik.values.url
                );
              }}
            >
              <DeleteIcon />
            </button>
            {/* Deleting overlay */}
            {deleting && (
              <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
                <svg className="animate-spin h-8 w-8 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <span className="text-white font-semibold text-xs">Deleting...</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <SwiperModal
          images={
            id === "web-banner-image-input"
              ? (formik.values.webImage ? [formik.values.webImage] : [])
              : id === "category-image-input" || id === "subcategory-image-input"
                ? (Array.isArray(formik.values.images) ? formik.values.images : [])
                : (formik.values.url ? [formik.values.url] : [])
          }
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
};