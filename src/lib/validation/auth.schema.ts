import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

// Deliberately strict: >=10 chars, mixed case, digit — cheap to enforce,
// meaningfully raises the floor on credential-stuffing viability.
export const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(200)
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[0-9]/, "Password must include a digit"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
