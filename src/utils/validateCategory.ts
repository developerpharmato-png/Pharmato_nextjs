import * as Yup from "yup";

export function validateCategory(formData: any) {
  const errors: Record<string, string> = {};
  if (!formData.name || formData.name.trim().length < 2) {
    errors.name =
      "Category name is required and must be at least 2 characters.";
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
    .min(0, 'Value cannot be negative')
    .required('Selling price is required')
    .test('price-lte-mrp', 'Selling price cannot be greater than MRP', function (value) {
      const mrp = (this.parent as any)?.mrp;
      if (value === undefined || value === null || mrp === undefined || mrp === null) return true;
      const priceNum = Number(value);
      const mrpNum = Number(mrp);
      if (Number.isNaN(priceNum) || Number.isNaN(mrpNum)) return true;
      return priceNum <= mrpNum;
    }),
  purchasePrice: Yup.number()
    .typeError('Purchase price must be a number')
    .min(0, 'Value cannot be negative')
    .required('Purchase price is required'),
  mrp: Yup.number()
    .typeError('MRP must be a number')
    .min(0, 'Value cannot be negative')
    .required('MRP is required'),
  discount: Yup.number()
    .min(0, 'Value cannot be negative')
    .max(100, 'Discount cannot exceed 100%'),
  stock: Yup.number()
    .typeError('Stock must be a number')
    .min(0, 'Value cannot be negative')
    .required('Stock is required'),
  expiryDate: Yup.string().required('Expiry date is required'),
  batchNumber: Yup.string().required('Batch number is required'),
  isOTC: Yup.boolean(),
  requiresPrescription: Yup.boolean(),
  images: Yup.array().min(1, 'At least one image is required').max(5, 'Maximum 5 images allowed'),
  coverImage: Yup.string().nullable(),
  highlights: Yup.array().of(Yup.string()),
});


export const CouponsvalidationSchema = Yup.object().shape({
  code: Yup.string()
    .required("Code is mandatory")
    .min(2, "Code must be at least 2 characters")
    .max(50, "Code must not exceed 50 characters"),
  title: Yup.string()
    .required("Title is mandatory")
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must not exceed 100 characters"),
  description: Yup.string()
    .required("Description is mandatory")
    .min(10, "Description must be at least 10 characters"),
  type: Yup.string()
    .required("Discount Type is mandatory")
    .oneOf(["fixed", "percentage"]),
  value: Yup.number()
    .required("Value is mandatory")
    .test("value-validation", function (value) {
      const { type } = this.parent;
      if (type === "fixed") {
        return value > 0 ? true : this.createError({ message: "Amount must be greater than 0" });
      } else if (type === "percentage") {
        return value > 0 && value <= 100
          ? true
          : this.createError({ message: "Percentage must be between 1 and 100" });
      }
      return true;
    }),
  maxDiscountAmount: Yup.number()
    .typeError("Max Discount must be a number")
    .test("discount-validation", function (value) {
      const { type } = this.parent;
      if (type === "fixed") {
        return true; // Not applicable for fixed
      }
      if (value !== undefined && value !== null) {
        return value > 0
          ? true
          : this.createError({ message: "Max Rs Discount must be greater than 0 if provided" });
      }
      return true;
    }),
  minOrderValue: Yup.number()
    .required("Min Order Value is mandatory")
    .min(0, "Min Order Value cannot be negative"),
  scope: Yup.string()
    .required("Scope is mandatory")
    .oneOf(["global", "category", "product"], "Scope must be global, category, or product"),
  startAt: Yup.string()
    .required("Start Date is mandatory")
    .test("start-date-validation", "Start Date must be today or in the future", function (value) {
      if (!value) return false;
      const startDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return startDate >= today;
    }),
  endAt: Yup.string()
    .required("End Date is mandatory")
    .test("end-date-validation", "End Date must be on or after Start Date", function (value) {
      const { startAt } = this.parent;
      if (!value || !startAt) return false;
      const endDate = new Date(value);
      const start = new Date(startAt);
      return endDate >= start;
    }),
  totalUses: Yup.number()
    .required("Max Coupons is mandatory")
    .min(1, "Max Coupons must be at least 1")
    .test("total-gte-perUser", function (value) {
      const { perUserLimit } = this.parent as any;
      if (typeof value === 'number' && typeof perUserLimit === 'number') {
        return value >= perUserLimit || this.createError({ message: "Total uses must be >= per-user limit" });
      }
      return true;
    }),
  perUserLimit: Yup.number()
    .required("Max Coupons Per User is mandatory")
    .min(1, "Max Per User must be at least 1")
    .test("perUser-le-total", function (value) {
      const { totalUses } = this.parent as any;
      if (typeof value === 'number' && typeof totalUses === 'number') {
        return value <= totalUses || this.createError({ message: "Per-user limit cannot exceed total uses" });
      }
      return true;
    }),
  isStackable: Yup.boolean(),
  isSecret: Yup.boolean(),
  isActive: Yup.boolean(),
});