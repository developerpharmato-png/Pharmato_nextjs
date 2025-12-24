import * as Yup from "yup";

export function validateCategory(formData: any) {
  const errors: Record<string, string> = {};
  if (!formData.name || formData.name.trim().length < 2) {
    errors.name =
      "Category name is required and must be at least 2 characters.";
  }
  if (!formData.description || formData.description.trim().length < 5) {
    errors.description =
      "Description is required and must be at least 5 characters.";
  }
  if (!formData.images || formData.images.length === 0) {
    errors.images = "Please upload a category image.";
  }
  return errors;
}

export const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .matches(/^[^@\s]+@[^@\s]+\.com$/, "Email must contain @ and end with .com")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters long")
    .required("Password is required"),
});

export const RegistervalidationSchema = Yup.object({
  name: Yup.string().required("Full Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .matches(/^[^@\s]+@[^@\s]+\.com$/, "Email must contain @ and end with .com")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters long")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Confirm Password is required"),
  phone: Yup.string()
    .matches(/^\d{10}$/, "Phone number must be exactly 10 digits")
    .required("Phone number is required"),
  role: Yup.string().required("Role is required"),
});

export const StoreValidationSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(2, "Store name must be at least 2 characters")
    .required("Store name is required"),
  servicePinCodes: Yup.array()
    .of(Yup.string())
    .min(1, "Select at least one pincode")
    .required("Select at least one pincode"),
  address: Yup.object().shape({
    street: Yup.string()
      .trim()
      .required("Street is required"),
    city: Yup.string()
      .trim()
      .required("City is required"),
    state: Yup.string()
      .trim()
      .required("State is required"),
    country: Yup.string()
      .trim()
      .required("Country is required"),
    pincode: Yup.string()
      .trim()
      .matches(/^\d{6}$/, "Pincode must be 6 digits")
      .required("Pincode is required"),
    gps: Yup.string()
      .trim()
      .required("GPS is required"),
  }),
  GoogleAddress: Yup.string()
    .trim(),
  status: Yup.number()
    .oneOf([0, 1], "Invalid status")
    .required("Status is required"),
  adminManagerId: Yup.string()
    .required("Store Manager is required"),
});




export const medicineFormValidationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  description: Yup.string().required('Description is required'),
  manufacturer: Yup.string().required('Manufacturer is required'),
  category: Yup.string().required('Form type is required'),
  categoryId: Yup.string().required('Category is required'),
  storeId: Yup.string().required('Store is required'),
  price: Yup.number()
    .typeError('Price must be a number')
    .required('Selling price is required')
    .test('price-lte-mrp', 'Selling price cannot be greater than MRP', function (value) {
      const mrp = (this.parent as any)?.mrp;
      if (value === undefined || value === null || mrp === undefined || mrp === null) return true;
      const priceNum = Number(value);
      const mrpNum = Number(mrp);
      if (Number.isNaN(priceNum) || Number.isNaN(mrpNum)) return true;
      return priceNum <= mrpNum;
    }),
  purchasePrice: Yup.number().typeError('Purchase price must be a number').required('Purchase price is required'),
  mrp: Yup.number().typeError('MRP must be a number').required('MRP is required'),
  discount: Yup.number(),
  stock: Yup.number().typeError('Stock must be a number').required('Stock is required'),
  expiryDate: Yup.string().required('Expiry date is required'),
  batchNumber: Yup.string().required('Batch number is required'),
  isOTC: Yup.boolean(),
  requiresPrescription: Yup.boolean(),
  images: Yup.array().min(1, 'At least one image is required').max(5, 'Maximum 5 images allowed'),
  coverImage: Yup.string().nullable(),
  highlights: Yup.array().of(Yup.string()),
});