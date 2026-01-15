import { Image } from 'lucide-react';
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
        <div className="lg:col-span-1">
            <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shadow-inner">
                <button
                    type="button"
                    className="w-full block transition-opacity hover:opacity-90"
                >
                    <img
                        src={currentImageSrc}
                        alt={currentAltText}
                        className="w-full h-72 lg:h-96 object-cover"
                    />
                </button>
            </div>

            <div className="mt-4 overflow-x-auto">
                <div className="flex gap-3 items-center">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveIndex(idx)}
                            className={`w-20 h-20 rounded-md overflow-hidden border-2 transition-all duration-200 ease-in-out shrink-0 
                                ${idx === activeIndex
                                    ? 'border-green-600 ring-2 ring-green-500' 
                                    : 'border-gray-200 hover:border-green-500'
                                }`
                            }
                        >
                            <img
                                src={img}
                                alt={`${currentAltText} thumbnail ${idx + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductImageSlider;