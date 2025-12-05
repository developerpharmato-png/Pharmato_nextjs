import React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export default function PincodeSelect({
  pincodes,
  value,
  error,
  onChange,
}: {
  pincodes: any[];
  value: string[];
  error?: string;
  onChange: (selected: string[]) => void;
}) {
  return (
    <div>
      <Autocomplete
        multiple
        disableCloseOnSelect
        options={pincodes.map((pin: any) => String(pin.pincode))}
        value={value}
        onChange={(_, selected) => onChange(selected as string[])}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Service Pincodes * (multi select)
"
            variant="outlined"
            error={!!error}
            helperText={error || ""}
          />
        )}
        sx={{ background: "#e3f2fd", borderRadius: 2 }}
      />
    </div>
  );
}
