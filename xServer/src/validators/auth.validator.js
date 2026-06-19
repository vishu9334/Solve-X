

import { z } from "zod";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(
    passwordRegex,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
  );

const registerValidator = {
  body: z.object({
    name: z.string().trim().min(1, "Name is required"),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email is required")
      .email("Invalid email format"),

    password: passwordSchema,
    role: z.enum(["mentor", "student", "admin"]).optional().default("student"),
  }),
};

const verifyOtpValidator = {
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email is required")
      .email("Invalid email format"),

    otp: z
      .string()
      .trim()
      .length(4, "OTP must be exactly 4 digits")
      .regex(/^\d+$/, "OTP must contain only digits"),
  }),
};

const loginValidator = {
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email is required")
      .email("Invalid email format"),

    password: z.string().min(1, "Password is required"),
  }),
};

const forgotPasswordValidator = {
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email is required")
      .email("Invalid email format"),
  }),
};

const resetPasswordValidator = {
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email is required")
      .email("Invalid email format"),

    otp: z
      .string()
      .trim()
      .length(4, "OTP must be exactly 4 digits")
      .regex(/^\d+$/, "OTP must contain only digits"),

    password: passwordSchema,
  }),
};

const resendOtpValidator = {
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email is required")
      .email("Invalid email format"),
  }),
};

export {
  registerValidator,
  verifyOtpValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  resendOtpValidator,
};