import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "./auth.schema";

describe("loginSchema", () => {
  it("lowercases and trims the email", () => {
    const result = loginSchema.safeParse({ email: "  User@Example.com  ", password: "anything" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("user@example.com");
  });

  it("rejects a malformed email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });
});

describe("registerSchema password policy", () => {
  const base = { name: "Ada", email: "ada@example.com" };

  it("rejects a password under 10 characters", () => {
    expect(registerSchema.safeParse({ ...base, password: "Ab1" }).success).toBe(false);
  });

  it("rejects a password with no digit", () => {
    expect(registerSchema.safeParse({ ...base, password: "NoDigitsHere" }).success).toBe(false);
  });

  it("rejects a password with no uppercase letter", () => {
    expect(registerSchema.safeParse({ ...base, password: "alllowercase1" }).success).toBe(false);
  });

  it("accepts a password meeting all four rules", () => {
    expect(registerSchema.safeParse({ ...base, password: "GoodPass1word" }).success).toBe(true);
  });
});
