import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

export const addPaymentSchema = z.object({
  amount: z.coerce
    .number()
    .positive({ message: 'Amount must be greater than 0.' }),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'check'], {
    required_error: 'Please select a payment method.',
  }),
  reference: z.string().optional(),
  notes: z.string().optional(),
});
