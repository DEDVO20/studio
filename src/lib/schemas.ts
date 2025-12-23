import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({
    message: 'Por favor, introduce una dirección de correo electrónico válida.',
  }),
  password: z.string().min(6, {
    message: 'La contraseña debe tener al menos 6 caracteres.',
  }),
});

export const addPaymentSchema = z.object({
  amount: z.coerce
    .number()
    .positive({ message: 'El monto debe ser mayor que 0.' }),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'check'], {
    required_error: 'Por favor, selecciona un método de pago.',
  }),
  reference: z.string().optional(),
  notes: z.string().optional(),
});
