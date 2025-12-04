import React from "react";

export default function AddressFields({ address, errors, onChange }: {
    address: any;
    errors: any;
    onChange: (field: string, value: string) => void;
}) {
    return (
        <div className="border-t pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <label className="block mb-2 font-semibold text-base text-gray-700">Street <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Street" value={address.street} onChange={e => onChange("street", e.target.value)} className={`border px-4 py-3 rounded-xl w-full text-base transition-all duration-200 shadow-sm bg-gray-50 ${errors.street ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-400'}`} />
                {errors.street && <div className="text-red-500 text-sm mt-1">{errors.street}</div>}
            </div>
            <div>
                <label className="block mb-2 font-semibold text-base text-gray-700">City <span className="text-red-500">*</span></label>
                <input type="text" placeholder="City" value={address.city} onChange={e => onChange("city", e.target.value)} className={`border px-4 py-3 rounded-xl w-full text-base transition-all duration-200 shadow-sm bg-gray-50 ${errors.city ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-400'}`} />
                {errors.city && <div className="text-red-500 text-sm mt-1">{errors.city}</div>}
            </div>
            <div>
                <label className="block mb-2 font-semibold text-base text-gray-700">State <span className="text-red-500">*</span></label>
                <input type="text" placeholder="State" value={address.state} onChange={e => onChange("state", e.target.value)} className={`border px-4 py-3 rounded-xl w-full text-base transition-all duration-200 shadow-sm bg-gray-50 ${errors.state ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-400'}`} />
                {errors.state && <div className="text-red-500 text-sm mt-1">{errors.state}</div>}
            </div>
            <div>
                <label className="block mb-2 font-semibold text-base text-gray-700">Country <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Country" value={address.country} onChange={e => onChange("country", e.target.value)} className={`border px-4 py-3 rounded-xl w-full text-base transition-all duration-200 shadow-sm bg-gray-50 ${errors.country ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-400'}`} />
                {errors.country && <div className="text-red-500 text-sm mt-1">{errors.country}</div>}
            </div>
            <div>
                <label className="block mb-2 font-semibold text-base text-gray-700">Pincode <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Pincode" value={address.pincode} onChange={e => onChange("pincode", e.target.value)} className={`border px-4 py-3 rounded-xl w-full text-base transition-all duration-200 shadow-sm bg-gray-50 ${errors.pincode ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-400'}`} />
                {errors.pincode && <div className="text-red-500 text-sm mt-1">{errors.pincode}</div>}
            </div>
            <div>
                <label className="block mb-2 font-semibold text-base text-gray-700">GPS (lat,long) <span className="text-red-500">*</span></label>
                <input type="text" placeholder="GPS (lat,long)" value={address.gps} onChange={e => onChange("gps", e.target.value)} className={`border px-4 py-3 rounded-xl w-full text-base transition-all duration-200 shadow-sm bg-gray-50 ${errors.gps ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-400'}`} />
                {errors.gps && <div className="text-red-500 text-sm mt-1">{errors.gps}</div>}
            </div>
        </div>
    );
}
