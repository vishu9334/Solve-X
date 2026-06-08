import { z } from "zod";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(
    passwordRegex,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
  );

export const sendOtpValidator = {
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email is required")
      .email("Invalid email format"),
  }),
};

export const verifyOtpValidator = {
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email is required")
      .email("Invalid email format"),
    otp: z.coerce
      .string()
      .trim()
      .length(6, "OTP must be exactly 6 digits")
      .regex(/^\d+$/, "OTP must contain only digits"),
  }),
};

export const registerValidator = {
  body: z.object({
    registrationToken: z.string().trim().min(1, "Registration token is required"),
    name: z.string().trim().min(1, "Name is required"),
    password: passwordSchema,
    role: z.enum(["admin", "mentor", "student"]).optional(),
    avatar: z.string().url("Invalid avatar URL format").optional().or(z.literal("")),
  }),
};

export const loginValidator = {
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email is required")
      .email("Invalid email format"),
    password: passwordSchema,
  }),
};
