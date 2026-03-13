import { describe, it, expect } from "vitest";
import {
  NioError,
  AuthError,
  RateLimitError,
  ValidationError,
} from "@/domain/errors";

describe("NioError", () => {
  it("is instanceof Error", () => {
    const err = new NioError("AUTH_REQUIRED", "test");
    expect(err).toBeInstanceOf(Error);
  });

  it("sets code and message correctly", () => {
    const err = new NioError("RATE_LIMITED", "slow down");
    expect(err.code).toBe("RATE_LIMITED");
    expect(err.message).toBe("slow down");
  });

  it('sets name to "NioError"', () => {
    const err = new NioError("VALIDATION_ERROR", "bad input");
    expect(err.name).toBe("NioError");
  });
});

describe("AuthError", () => {
  it("is instanceof NioError", () => {
    const err = new AuthError("not logged in");
    expect(err).toBeInstanceOf(NioError);
  });

  it('code is "AUTH_REQUIRED"', () => {
    const err = new AuthError("not logged in");
    expect(err.code).toBe("AUTH_REQUIRED");
  });

  it('name is "AuthError"', () => {
    const err = new AuthError("not logged in");
    expect(err.name).toBe("AuthError");
  });
});

describe("RateLimitError", () => {
  it("is instanceof NioError", () => {
    const err = new RateLimitError("too fast", 5000);
    expect(err).toBeInstanceOf(NioError);
  });

  it('code is "RATE_LIMITED"', () => {
    const err = new RateLimitError("too fast", 5000);
    expect(err.code).toBe("RATE_LIMITED");
  });

  it("stores retryAfterMs", () => {
    const err = new RateLimitError("too fast", 3000);
    expect(err.retryAfterMs).toBe(3000);
  });

  it('name is "RateLimitError"', () => {
    const err = new RateLimitError("too fast", 5000);
    expect(err.name).toBe("RateLimitError");
  });
});

describe("ValidationError", () => {
  it("is instanceof NioError", () => {
    const err = new ValidationError("invalid field");
    expect(err).toBeInstanceOf(NioError);
  });

  it('code is "VALIDATION_ERROR"', () => {
    const err = new ValidationError("invalid field");
    expect(err.code).toBe("VALIDATION_ERROR");
  });

  it('name is "ValidationError"', () => {
    const err = new ValidationError("invalid field");
    expect(err.name).toBe("ValidationError");
  });
});

describe("instanceof checks", () => {
  it("AuthError is instanceof NioError but not ValidationError", () => {
    const err = new AuthError("auth fail");
    expect(err).toBeInstanceOf(NioError);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(ValidationError);
    expect(err).not.toBeInstanceOf(RateLimitError);
  });

  it("ValidationError is not instanceof AuthError or RateLimitError", () => {
    const err = new ValidationError("bad data");
    expect(err).toBeInstanceOf(NioError);
    expect(err).not.toBeInstanceOf(AuthError);
    expect(err).not.toBeInstanceOf(RateLimitError);
  });
});
