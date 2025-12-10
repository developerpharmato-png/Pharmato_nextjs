import React, { useState } from 'react';

interface ProductImageSliderProps {
  images: string[]; // Define images as an array of strings
  productName: string; // Define productName as a string
}

const ProductImageSlider: React.FC<ProductImageSliderProps> = ({ images, productName }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    
    const defaultImages = images && images.length > 0 ? images : [
        '/path/to/image1.jpg',
       
    ];
    
    const currentImageSrc = defaultImages[activeIndex];
    const currentAltText = productName || "Product Image";

    if (defaultImages.length === 0) {
        return (
            <div className="lg:col-span-1">
                <div className="w-full h-96 flex flex-col items-center justify-center text-8xl text-gray-500 bg-gray-100 rounded-lg">
                    <span className="material-icons text-8xl">photo_camera</span>
                    <span className="text-base mt-2">No Images Available</span>
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
                    {defaultImages.map((img, idx) => (
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