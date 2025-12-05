import React from "react";
import TextField from "@mui/material/TextField";
import { ErrorMessageCom } from "../components/miniComponents";

export default function AddressFields({ address, errors, onChange }: {
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange("street", e.target.value)}
                    fullWidth
                    variant="outlined"
                    placeholder="Street"
                    error={Boolean(errors.street)}
                    InputProps={{
                        style: {
                            borderRadius: "0.75rem",
                            background: "#f3f4f6",
                        },
                    }}
                />
                {errors.street && <ErrorMessageCom error={errors.street} />}
            </div>
            <div>
                <TextField
                    name="city"
                    label="City *"
                    value={address.city}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange("city", e.target.value)}
                    fullWidth
                    variant="outlined"
                    placeholder="City"
                    error={Boolean(errors.city)}
                    InputProps={{
                        style: {
                            borderRadius: "0.75rem",
                            background: "#f3f4f6",
                        },
                    }}
                />
                {errors.city && <ErrorMessageCom error={errors.city} />}
            </div>
            <div>
                <TextField
                    name="state"
                    label="State *"
                    value={address.state}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange("state", e.target.value)}
                    fullWidth
                    variant="outlined"
                    placeholder="State"
                    error={Boolean(errors.state)}
                    InputProps={{
                        style: {
                            borderRadius: "0.75rem",
                            background: "#f3f4f6",
                        },
                    }}
                />
                {errors.state && <ErrorMessageCom error={errors.state} />}
            </div>
            <div>
                <TextField
                    name="country"
                    label="Country *"
                    value={address.country}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange("country", e.target.value)}
                    fullWidth
                    variant="outlined"
                    placeholder="Country"
                    error={Boolean(errors.country)}
                    InputProps={{
                        style: {
                            borderRadius: "0.75rem",
                            background: "#f3f4f6",
                        },
                    }}
                />
                {errors.country && <ErrorMessageCom error={errors.country} />}
            </div>
            <div>
                <TextField
                    name="pincode"
                    label="Pincode *"
                    value={address.pincode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange("pincode", e.target.value)}
                    fullWidth
                    variant="outlined"
                    placeholder="Pincode"
                    error={Boolean(errors.pincode)}
                    InputProps={{
                        style: {
                            borderRadius: "0.75rem",
                            background: "#f3f4f6",
                        },
                    }}
                />
                {errors.pincode && <ErrorMessageCom error={errors.pincode} />}
            </div>
            <div>
                <TextField
                    name="gps"
                    label="GPS (lat,long) *"
                    value={address.gps}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange("gps", e.target.value)}
                    fullWidth
                    variant="outlined"
                    placeholder="GPS (lat,long)"
                    error={Boolean(errors.gps)}
                    InputProps={{
                        style: {
                            borderRadius: "0.75rem",
                            background: "#f3f4f6",
                        },
                    }}
                />
                {errors.gps && <ErrorMessageCom error={errors.gps} />}
            </div>
        </div>
    );
}
