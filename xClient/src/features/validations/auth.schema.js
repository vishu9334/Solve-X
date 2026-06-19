import { z } from 'zod';

export const loginZodValidator= z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address format" }),
    
  password: z
  .string()
  .min(6, { message: "Password must be at least 6 characters" })
  .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Must contain at least one number" })
  .regex(/[@$!%*?&]/, { message: "Must contain at least one special character (@$!%*?&)" })
});

export const registerZodValidator = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" }),
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address format" }),
  password: z
  .string()
  .min(6, { message: "Password must be at least 6 characters" })
  .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Must contain at least one number" })
  .regex(/[@$!%*?&]/, { message: "Must contain at least one special character (@$!%*?&)" }),
  role: z
    .enum(["student", "mentor", "admin"])
    .default("student")
});

export const verifyOtpValidator = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email"),

  otp: z
    .string()
    .trim()
    .length(4, "OTP must be 4 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});