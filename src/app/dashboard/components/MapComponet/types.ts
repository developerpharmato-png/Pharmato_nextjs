export interface FormAddress {
  raw: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
}

export interface FormValues {
  latitude?: string | number;
  longitude?: string | number;
  address?: FormAddress;
  [key: string]: any; // for any additional form fields
}

export interface TouchedFields {
  address?: boolean;
  [key: string]: boolean | undefined;
}

export interface ErrorFields {
  address?: string;
  [key: string]: string | undefined;
}

export interface MapComponentProps {
  disabled: boolean;
  values: FormValues;
  handleBlur: (e: React.FocusEvent<any>) => void;
  touched: TouchedFields;
  errors: ErrorFields;
  newselected?: string;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
}
