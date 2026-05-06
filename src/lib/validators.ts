import { z } from 'zod';

// ── Sign In Schema ──
export const signInSchema = z.object({
  emailOrPhone: z
    .string()
    .min(1, 'Email or phone is required')
    .refine(
      (val) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ||
        /^\+?[\d\s\-()]{7,}$/.test(val),
      { message: 'Enter a valid email or phone number' }
    ),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

// ── Sign Up Schema ──
export const signUpSchema = z.object({
  role: z.enum(['rider', 'driver']),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(60, 'Name is too long'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  countryCode: z.string().min(1, 'Country code required'),
  phone: z
    .string()
    .min(7, 'Enter a valid phone number')
    .max(15, 'Phone number is too long')
    .regex(/^[\d\s\-]+$/, 'Only digits, spaces, and dashes allowed'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number')
    .regex(/[^A-Za-z0-9]/, 'Include at least one special character'),
  licenseNumber: z.string().optional(),
  cnic: z.string().optional(),
  terms: z
    .boolean()
    .refine((v) => v === true, { message: 'You must accept the terms' }),
}).superRefine((data, ctx) => {
  if (data.role === 'driver') {
    if (!data.licenseNumber || data.licenseNumber.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['licenseNumber'],
        message: 'License number is required for drivers',
      });
    }
    if (!data.cnic || !/^\d{5}-\d{7}-\d$/.test(data.cnic.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cnic'],
        message: 'CNIC must be in format 12345-1234567-1',
      });
    }
  }
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;

// ── Password strength helper ──
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: 'Too weak',  color: '#DC2626' },
    { label: 'Weak',      color: '#DC2626' },
    { label: 'Fair',      color: '#D97706' },
    { label: 'Good',      color: '#F59E0B' },
    { label: 'Strong',    color: '#059669' },
    { label: 'Very strong', color: '#059669' },
  ];

  return { score, ...levels[Math.min(score, 5)] };
}
