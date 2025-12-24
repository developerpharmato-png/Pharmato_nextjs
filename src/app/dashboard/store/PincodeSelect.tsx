import React, { useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";

export default function PincodeSelect({
  pincodes,
  value,
  error,
  onChange,
}: {
  pincodes: any[]; // kept for compatibility
  value: string[]; // selected pincode strings
  error?: string;
  onChange: (selected: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setInputValue("");
  }, [value]);

  const addPincode = (pin: string) => {
    const normalized = pin.trim();
    if (!/^([1-9][0-9]{5})$/.test(normalized)) return;
    if (value.includes(normalized)) return;
    onChange([...value, normalized]);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey && e.code === "Space") {
      e.preventDefault();
      if (/^([1-9][0-9]{5})$/.test(inputValue) && !value.includes(inputValue)) {
        addPincode(inputValue);
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (/^([1-9][0-9]{5})$/.test(inputValue) && !value.includes(inputValue)) {
        addPincode(inputValue);
      }
    }
    if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleDelete = (tag: string) => {
    onChange(value.filter((v) => v !== tag));
  };

  return (
    <div>
      <TextField
        fullWidth
        label={"Service Pincodes (press Ctrl+Space or Enter to add)"}
        placeholder="Type a 6-digit pincode"
        value={inputValue}
        onChange={(e) => {
          const val = e.target.value.replace(/[^0-9]/g, "");
          if (val.length <= 6) setInputValue(val);
        }}
        onKeyDown={handleKeyDown}
        error={Boolean(error)}
        helperText={error}
      />

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
        {value.map((tag) => (
          <Chip key={tag} label={tag} onDelete={() => handleDelete(tag)} color="primary" />
        ))}
      </Box>
    </div>
  );
}
