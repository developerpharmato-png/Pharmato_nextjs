import { Image, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

interface ProductImageSliderProps {
    images: string[]; // Define images as an array of strings
    productName: string; // Define productName as a string
}

const ProductImageSlider: React.FC<ProductImageSliderProps> = ({ images, productName }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const hasImages = images && images.length > 0;
    const currentImageSrc = hasImages ? images[activeIndex] : undefined;
    const currentAltText = productName || "Product Image";

    if (!hasImages) {
        // Show avatar/placeholder if no images
        return (
            <div className="lg:col-span-1 flex items-center justify-center">
                <div className="h-44 w-44 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-md border border-gray-200">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-2">
                        <Image size={48} className="text-gray-400" />
                    </div>
                    <span className="text-gray-500 font-medium text-base mt-1">No Images Available</span>
                </div>
            </div>
        );
    }

    return (
        <div className="lg:col-span-1 flex flex-col items-center">
            <div className="relative w-full flex items-center justify-center rounded-xl bg-white shadow-sm" style={{ minHeight: '18rem', maxHeight: '28rem' }}>
                {/* Left Arrow */}
                {images.length > 1 && (
                    <button
                        type="button"
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-green-100 border border-gray-200 rounded-full p-1 shadow transition"
                        onClick={() => setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="w-6 h-6 text-green-600" />
                    </button>
                )}

                {/* Main Image */}
                <img
                    src={currentImageSrc}
                    alt={currentAltText}
                    className="max-w-full max-h-96 object-contain bg-white rounded-xl"
                    style={{ margin: '0 auto', display: 'block' }}
                />

                {/* Right Arrow */}
                {images.length > 1 && (
                    <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-green-100 border border-gray-200 rounded-full p-1 shadow transition"
                        onClick={() => setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                        aria-label="Next image"
                    >
                        <ChevronRight className="w-6 h-6 text-green-600" />
                    </button>
                )}
            </div>

            {/* Thumbnails */}
            <div className="mt-4 overflow-x-auto w-full">
                <div className="flex gap-2 items-center justify-center">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveIndex(idx)}
                            className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ease-in-out shrink-0 focus:outline-none
                                ${idx === activeIndex
                                    ? 'border-green-600 ring-2 ring-green-400'
                                    : 'border-gray-200 hover:border-green-400'
                                }`
                            }
                            aria-label={`Show image ${idx + 1}`}
                        >
                            <img
                                src={img}
                                alt={`${currentAltText} thumbnail ${idx + 1}`}
                                className="w-full h-full object-contain bg-white"
                            />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductImageSlider;