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

export const adjustmentSchema = z.object({
    productId: z.string({
      required_error: 'Por favor, selecciona un producto.',
    }),
    type: z.enum(
      ['purchase', 'sale', 'return', 'damaged', 'loss', 'count'],
      { required_error: 'Por favor, selecciona un tipo de ajuste.' }
    ),
    quantity: z.coerce
      .number()
      .int()
      .positive({ message: 'La cantidad debe ser un número positivo.' }),
    notes: z.string().optional(),
  });
