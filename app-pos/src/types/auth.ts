import { z } from 'zod';

export const RegisterSchema = z.object({
  username: z.string().min(4, "Username must be at least 4 characters."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(['Owner', 'Staff']).refine(
    (value) => value === 'Owner' || value === 'Staff',
    { message: "Role must be Owner or Staff only." }
  ),
  fullName: z.string().optional().or(z.literal("")).transform((val) => val || undefined)
});

export const LoginSchema = z.object({
  username: z.string().min(1, "Please enter your username."),
  password: z.string().min(1, "Please enter your password."),
  userType: z.enum(["Staff", "Owner"], { message: "Invalid user type" })
});