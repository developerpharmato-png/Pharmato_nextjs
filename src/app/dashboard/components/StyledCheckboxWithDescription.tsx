import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  useTheme,
} from "@mui/material";

interface StyledCheckboxWithDescriptionProps {
  id: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
  title: string;
  description: string;
}

export const StyledCheckboxWithDescription = ({
  id,
  checked,
  onChange,
  title,
  description,
}: StyledCheckboxWithDescriptionProps) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: theme.palette.success.light + "20",
        border: `1px solid ${theme.palette.success.light}`,
        borderRadius: 1,
        width: "fit-content",
      }}
    >
      <FormControlLabel
        control={
          <Checkbox
            id={id}
            name={id} 
            checked={checked}
            onChange={onChange}
            color="success"
            sx={{ pt: 0, pb: 0, alignSelf: "flex-start" }}
          />
        }
        label={
          <Box sx={{ ml: 0.5 }}>
            <Typography
              variant="body1"
              fontWeight="medium"
              color="text.primary"
            >
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {description}
            </Typography>
          </Box>
        }
        sx={{ m: 0, alignItems: "flex-start" }} 
      />
    </Box>
  );
};

interface StandardFormCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
  label: string;
}

export const StandardFormCheckbox = ({ id, checked, onChange, label }: StandardFormCheckboxProps) => {
  const theme = useTheme();

  return (
    <FormControlLabel
      control={
        <Checkbox
          id={id}
          name={id} // Ensure the name prop matches the ID for formik.handleChange
          checked={checked}
          onChange={onChange}
          color="success" // Using success color for consistency
        />
      }
      label={label}
      sx={{
        m: 0,
        ".MuiTypography-root": {
          fontSize: theme.typography.pxToRem(16),
          fontWeight: theme.typography.fontWeightMedium,
          // Conditionally apply success color if checked
          color: checked
            ? theme.palette.success.main
            : theme.palette.text.primary,
        },
      }}
    />
  );
};
