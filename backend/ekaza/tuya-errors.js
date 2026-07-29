export class TuyaError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = "TuyaError";
    this.code = code;
    this.cause = cause;
  }
}

export function sanitizedErrorCode(error) {
  if (error instanceof TuyaError) return error.code;
  if (error?.name === "AbortError") return "timeout";
  return "provider_unavailable";
}
