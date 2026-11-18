export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

export function requireObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new AppError(400, "Expected a JSON object.");
  return value;
}

export function requireText(value, field, maxLength = 200) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.trim().length > maxLength
  )
    throw new AppError(400, `${field} must contain 1–${maxLength} characters.`);
  return value.trim();
}
