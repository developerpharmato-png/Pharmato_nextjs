import React from "react";
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

export default function PincodeSelect({ pincodes, value, error, onChange }: {
    pincodes: any[];
    value: string[];
    error?: string;
    onChange: (selected: string[]) => void;
}) {
    return (
        <div>
            <label className="block mb-2 font-semibold text-base text-gray-700">Service Pincodes <span className="text-red-500">*</span> <span className="text-xs text-gray-400">(multi select)</span></label>
            <Autocomplete
                multiple
                disableCloseOnSelect
                options={pincodes.map((pin: any) => String(pin.pincode))}
                value={value}
                onChange={(_, selected) => onChange(selected as string[])}
                renderInput={(params) => (
                    <TextField {...params} label="Select Pincodes" variant="outlined" error={!!error} helperText={error || ''} />
                )}
                sx={{ background: '#e3f2fd', borderRadius: 2 }}
            />
        </div>
    );
}
