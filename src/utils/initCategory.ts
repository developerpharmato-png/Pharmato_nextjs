export const initCategory = {
  name: "",
  description: "",
  isOTC: false,
  images: [],
  isActive: true,
};

export const RegisterinitialValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  role: "admin",
};

export const StoreInitialValues = {
  name: "",
  servicePinCodes: [],
  address: {
    street: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    gps: "",
  },
  GoogleAddress: "",
  status: 1,
  adminManagerId: "",
};


export const initialMedicineFormValues = {
  name: '',
  description: '',
  manufacturer: '',
  category: 'Tablet',
  categoryId: '',
  subCategoryId: '',
  price: '',
  purchasePrice: '',
  mrp: '',
  discount: 0,
  stock: '',
  expiryDate: '',
  batchNumber: '',
  isOTC: false,
  requiresPrescription: true,
  images: [],
  coverImage: undefined,
  highlights: [] as string[],
  unitInput: '',
  unit: '',
};