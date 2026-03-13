class NioError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "NioError";
    this.code = code;
  }
}

class AuthError extends NioError {
  constructor(message: string) {
    super("AUTH_REQUIRED", message);
    this.name = "AuthError";
  }
}

class RateLimitError extends NioError {
  readonly retryAfterMs: number;

  constructor(message: string, retryAfterMs: number) {
    super("RATE_LIMITED", message);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

class ValidationError extends NioError {
  constructor(message: string) {
    super("VALIDATION_ERROR", message);
    this.name = "ValidationError";
  }
}

export { AuthError, NioError, RateLimitError, ValidationError };
