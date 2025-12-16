import React from "react";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import { ErrorMessageCom } from "../components/miniComponents";

export default function AddressFields({
  address,
  errors,
  onChange,
  onBlur,
  touched,
}: {
  address: any;
  errors: any;
  onChange: (field: string, value: string) => void;
  onBlur?: (field: string) => void;
  touched?: any;
}) {
  const getError = (field: string) => {
    if (!errors) return null;
    if (touched?.[field]) {
      return errors[field] || null;
    }
    return null;
  };

  const handleBlur = (field: string) => {
    if (onBlur) onBlur(field);
  };

  return (
    <div className=" grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <TextField
          name="street"
          label="Street *"
          value={address.street}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange("street", e.target.value)
          }
          onBlur={() => handleBlur("street")}
          fullWidth
          variant="outlined"
          placeholder="Street"
          error={Boolean(getError("street"))}
        />
        {getError("street") && (
          <ErrorMessageCom error={getError("street")} />
        )}
      </div>
      <div>
        <TextField
          name="city"
          label="City *"
          value={address.city}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange("city", e.target.value)
          }
          onBlur={() => handleBlur("city")}
          fullWidth
          variant="outlined"
          placeholder="City"
          error={Boolean(getError("city"))}
        />
        {getError("city") && (
          <ErrorMessageCom error={getError("city")} />
        )}
      </div>
      <div>
        <FormControl 
          fullWidth 
          variant="outlined"
          error={Boolean(getError("state"))}
        >
          <InputLabel id="state-label">State *</InputLabel>
          <Select
            labelId="state-label"
            name="state"
            value={address.state}
            label="State *"
            onChange={(e) => onChange("state", e.target.value)}
            onBlur={() => handleBlur("state")}
          >
            {[
              "Andhra Pradesh",
              "Arunachal Pradesh",
              "Assam",
              "Bihar",
              "Chhattisgarh",
              "Goa",
              "Gujarat",
              "Haryana",
              "Himachal Pradesh",
              "Jharkhand",
              "Karnataka",
              "Kerala",
              "Madhya Pradesh",
              "Maharashtra",
              "Manipur",
              "Meghalaya",
              "Mizoram",
              "Nagaland",
              "Odisha",
              "Punjab",
              "Rajasthan",
              "Sikkim",
              "Tamil Nadu",
              "Telangana",
              "Tripura",
              "Uttar Pradesh",
              "Uttarakhand",
              "West Bengal",
              "Andaman and Nicobar Islands",
              "Chandigarh",
              "Dadra and Nagar Haveli and Daman and Diu",
              "Delhi",
              "Jammu and Kashmir",
              "Ladakh",
              "Lakshadweep",
              "Puducherry",
            ].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {getError("state") && <ErrorMessageCom error={getError("state")} />}
      </div>
      <div>
        <TextField
          name="country"
          label="Country"
          value={address.country || "India"}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange("country", e.target.value)
          }
          onBlur={() => handleBlur("country")}
          fullWidth
          variant="outlined"
          placeholder="Country"
          error={Boolean(getError("country"))}
        />
        {getError("country") && (
          <ErrorMessageCom error={getError("country")} />
        )}
      </div>
      <div>
        <TextField
          name="pincode"
          label="Pincode *"
          value={address.pincode}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange("pincode", e.target.value)
          }
          onBlur={() => handleBlur("pincode")}
          fullWidth
          variant="outlined"
          placeholder="Pincode"
          error={Boolean(getError("pincode"))}
        />
        {getError("pincode") && (
          <ErrorMessageCom error={getError("pincode")} />
        )}
      </div>
      <div>
        <TextField
          name="gps"
          label="GPS (lat,long) *"
          value={address.gps}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange("gps", e.target.value)
          }
          onBlur={() => handleBlur("gps")}
          fullWidth
          variant="outlined"
          placeholder="GPS (lat,long)"
          error={Boolean(getError("gps"))}
        />
        {getError("gps") && (
          <ErrorMessageCom error={getError("gps")} />
        )}
      </div>
      {/* googleMap field removed per request */}
    </div>
  );
}
