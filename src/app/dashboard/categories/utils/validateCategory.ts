export function validateCategory(formData: any) {
  const errors: Record<string, string> = {};
  if (!formData.name || formData.name.trim().length < 2) {
    errors.name = "Category name is required and must be at least 2 characters.";
  }
  if (!formData.description || formData.description.trim().length < 5) {
    errors.description = "Description is required and must be at least 5 characters.";
  }
  if (!formData.images || formData.images.length === 0) {
    errors.images = "Please upload a category image.";
  }
  return errors;
}
