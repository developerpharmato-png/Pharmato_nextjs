import Swal from "sweetalert2";

export const ToastMessages = {
  // Price validation
  INVALID_PRICE: "Selling price cannot be greater than MRP",

  // Image validation
  TOO_MANY_IMAGES: "You can upload up to 5 images only",
  TOO_MANY_IMAGES_CURRENT: (currentCount: number) =>
    `You can upload up to 5 images. Currently ${currentCount} uploaded.`,
  INVALID_FILE_TYPE: "Please upload only image files (JPEG, PNG, GIF, WebP, SVG)",
  FILE_TOO_LARGE: "Please upload an image smaller than 5MB",
  IMAGES_UPLOADED: (count: number) => `Uploaded ${count} image(s)`,
  IMAGE_DELETED: "Image deleted",
  IMAGE_DELETE_FAILED: (error: string) => error || "Failed to delete image",

  // Expiry date validation
  INVALID_EXPIRY_DATE: "Expiry Date cannot be a past date",

  // Image requirement
  IMAGE_REQUIRED: "Please upload a medicine image before submitting",

  // Medicine success messages
  MEDICINE_UPDATED: "Medicine updated successfully",
  MEDICINE_CREATED: "Medicine created successfully",

  // Medicine error messages
  MEDICINE_UPDATE_FAILED: "Failed to update medicine",
  MEDICINE_CREATE_FAILED: "Failed to create medicine",

  // Composition/Highlights validation
  COMPOSITION_LIMIT: "You can add up to 5 composition items only",
  HIGHLIGHTS_LIMIT: "You can add up to 5 highlights only",

  // Category messages
  CATEGORY_IMAGE_REQUIRED: "Please upload a category image before submitting",
  CATEGORY_CREATED: "Category created successfully",
  CATEGORY_UPDATED: "Category updated successfully",
  CATEGORY_CREATE_FAILED: "Failed to create category",
  CATEGORY_UPDATE_FAILED: "Failed to update category",

  // Subcategory messages
  SUBCATEGORY_IMAGE_REQUIRED: "Please upload a subcategory image before submitting",
  SUBCATEGORY_UPDATED: "Subcategory updated successfully",
  SUBCATEGORY_UPDATE_FAILED: "Failed to update subcategory",

  // Admin management messages
  ADMIN_CREATED: "Admin invited successfully",
  ADMIN_UPDATED: "Admin updated successfully",
  ADMIN_CREATE_FAILED: "Failed to save admin",
  ADMIN_UPDATE_FAILED: "Failed to update admin",
  ADMIN_ACTIVATED: "Admin activated successfully",
  ADMIN_DEACTIVATED: "Admin deactivated successfully",
  ADMIN_STATUS_UPDATE_FAILED: "Failed to update status",
  ADMIN_INVITE_RESENT: "Password reset link sent successfully",
  ADMIN_INVITE_RESEND_FAILED: "Failed to send password reset link",
  SUPERADMIN_STATUS_LOCKED: "Cannot change SuperAdmin status",


  // Permission messages
  PERMISSIONS_UPDATED: "Permissions updated successfully",
  PERMISSIONS_UPDATE_FAILED: "Failed to update permissions",
  PERMISSIONS_LOAD_FAILED: "Failed to load permissions",
  ROLE_REQUIRED: "Please select a role",
  SUPERADMIN_PERMISSIONS_LOCKED: "SuperAdmin permissions cannot be modified",

  // Role messages
  ROLE_CREATED: "Role added successfully",
  ROLE_UPDATED: "Role updated successfully",
  ROLE_CREATE_FAILED: "Failed to add role",
  ROLE_UPDATE_FAILED: "Failed to update role",
  ROLE_ACTIVATED: "Role activated successfully",
  ROLE_DEACTIVATED: "Role deactivated successfully",
  ROLE_STATUS_UPDATE_FAILED: "Failed to update role status",
  SUPERADMIN_ROLE_LOCKED: "Cannot edit SuperAdmin role",
  SUPERADMIN_STATUS_LOCKED_ROLE: "Cannot change status of SuperAdmin",

  // Policy messages
  POLICY_UPDATED: "Policy updated successfully",
  POLICY_UPDATE_FAILED: "Failed to update policy",
  POLICY_CONTENT_REQUIRED: "Content is required",

  // Settings messages
  SETTINGS_UPDATED: "Settings updated successfully",
  SETTINGS_UPDATE_FAILED: "Failed to update settings",
  THRESHOLD_VALIDATION: "Free delivery threshold must be greater than or equal to the delivery fee",

  // Banner image messages
  BANNER_IMAGE_CREATED: "Banner added successfully",
  BANNER_IMAGE_UPDATED: "Banner updated successfully",
  BANNER_IMAGE_DELETE_FAILED: "Failed to delete banner image",
  BANNER_STATUS_UPDATED: "Banner status updated",
  BANNER_STATUS_UPDATE_FAILED: "Failed to update banner status",
  BANNER_IMAGE_REQUIRED: "Banner image is required",
  BANNER_CATEGORY_REQUIRED: "Category is required",

  // Store messages
  STORE_CREATED: "Store added successfully",
  STORE_UPDATED: "Store updated successfully",
  STORE_CREATE_FAILED: "Failed to add store",
  STORE_UPDATE_FAILED: "Failed to update store",
  STORE_STATUS_UPDATED: "Store status updated successfully",
  STORE_STATUS_UPDATE_FAILED: "Failed to update store status",

  // Order messages
  PRESCRIPTION_APPROVED: "Prescription approved successfully",
  PRESCRIPTION_APPROVE_FAILED: "Failed to approve prescription",
  PRESCRIPTION_REJECTED: "Prescription rejected successfully",
  PRESCRIPTION_REJECT_FAILED: "Failed to reject prescription",
  PRESCRIPTION_REJECTION_REASON_REQUIRED: "Provide rejection reason",
  ORDER_CANCELLED: "Selected medicines cancelled successfully",
  ORDER_CANCEL_FAILED: "Failed to cancel medicines",
  ORDER_ACCEPTED: "Selected medicines accepted",
  ORDER_ACCEPT_FAILED: "Failed to accept medicines",
  ORDER_STATUS_UPDATED: "Order status updated successfully",
  ORDER_STATUS_UPDATE_FAILED: "Failed to update order status",

  // Medicine status messages
  MEDICINE_ACTIVATED: "Medicine activated successfully",
  MEDICINE_DEACTIVATED: "Medicine deactivated successfully",
  MEDICINE_STATUS_UPDATE_FAILED: "Failed to update medicine status",

  // Category status messages
  CATEGORY_ACTIVATED: "Category activated successfully",
  CATEGORY_DEACTIVATED: "Category deactivated successfully",
  CATEGORY_STATUS_UPDATE_FAILED: "Failed to update category status",

  // Subcategory status messages
  SUBCATEGORY_ACTIVATED: "Subcategory activated successfully",
  SUBCATEGORY_DEACTIVATED: "Subcategory deactivated successfully",
  SUBCATEGORY_STATUS_UPDATE_FAILED: "Failed to update subcategory status",

  // Login messages
  ADMIN_ACCOUNT_INACTIVE: "Your account has been deactivated. Please contact your administrator",
  ADMIN_ROLE_INACTIVE: "Your role has been deactivated. Please contact your administrator",
  LOGIN_SUCCESS: "Login successful",
  INVALID_CREDENTIALS: "Invalid email or password",
};



