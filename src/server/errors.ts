export type ErrorCode = "unauthorized" | "forbidden" | "not_found" | "invalid_input" | "conflict" | "rate_limited" | "password_change_required";

const STATUS: Record<ErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  invalid_input: 400,
  conflict: 409,
  rate_limited: 429,
  password_change_required: 403,
};

/** Thrown by services; route handlers turn it into the `{ error: { code, message } }` envelope. */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
  get status() {
    return STATUS[this.code];
  }
}
