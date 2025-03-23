import { z } from "zod";

export const insertTeacherSchema = z.object({
  name: z.string(),
  phoneNumber: z.string().nullable(),
  isSubstitute: z.boolean().default(false),
});

export const insertScheduleSchema = z.object({
  teacherId: z.number(),
  day: z.string(),
  period: z.number(),
  className: z.string(),
});

export const insertAbsenceSchema = z.object({
  teacherId: z.number(),
  date: z.string(),
  periods: z.array(z.number()),
});

// User related schemas
export const User = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string(),
  role: z.enum(['admin', 'user']).default('user'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const usernameChangeSchema = z.object({
  newUsername: z.string().min(3),
  password: z.string(),
}); 