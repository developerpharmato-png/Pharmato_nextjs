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
}: {
  address: any;
  errors: any;
  onChange: (field: string, value: string) => void;
}) {
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
          fullWidth
          variant="outlined"
          placeholder="Street"
          error={Boolean(errors.street)}
        
        />
        {errors.street && <ErrorMessageCom error={errors.street} />}
      </div>
      <div>
        <TextField
          name="city"
          label="City *"
          value={address.city}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange("city", e.target.value)
          }
          fullWidth
          variant="outlined"
          placeholder="City"
          error={Boolean(errors.city)}
        
        />
        {errors.city && <ErrorMessageCom error={errors.city} />}
      </div>
      <div>
        <FormControl fullWidth variant="outlined">
          <InputLabel id="state-label">State *</InputLabel>
          <Select
            labelId="state-label"
            name="state"
            value={address.state}
            label="State *"
            onChange={(e) => onChange("state", e.target.value)}
         
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
        {errors.state && <ErrorMessageCom error={errors.state} />}
      </div>
      <div>
        <TextField
          name="country"
          label="Country"
          value={address.country || "India"}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange("country", e.target.value)
          }
          fullWidth
          variant="outlined"
          placeholder="Country"
          error={Boolean(errors.country)}
         
        />
        {errors.country && <ErrorMessageCom error={errors.country} />}
      </div>
      <div>
        <TextField
          name="pincode"
          label="Pincode *"
          value={address.pincode}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange("pincode", e.target.value)
          }
          fullWidth
          variant="outlined"
          placeholder="Pincode"
          error={Boolean(errors.pincode)}
        
        />
        {errors.pincode && <ErrorMessageCom error={errors.pincode} />}
      </div>
      <div>
        <TextField
          name="gps"
          label="GPS (lat,long) *"
          value={address.gps}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange("gps", e.target.value)
          }
          fullWidth
          variant="outlined"
          placeholder="GPS (lat,long)"
          error={Boolean(errors.gps)}
        
        />
        {errors.gps && <ErrorMessageCom error={errors.gps} />}
      </div>
      {/* googleMap field removed per request */}
    </div>
  );
}
