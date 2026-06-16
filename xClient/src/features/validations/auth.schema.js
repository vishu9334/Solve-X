import { z } from 'zod';

export const loginZodValidation = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address format" }),
    
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .regex(/[A-Za-z]/, { message: "Password must contain at least one letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" })
});
