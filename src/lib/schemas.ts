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

export const customerSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  email: z.string().email({ message: 'Por favor, introduce un correo válido.' }),
  phone: z.string().min(7, { message: 'El teléfono debe ser válido.' }),
  address: z.string().optional(),
  taxId: z.string().optional(),
  creditLimit: z.coerce.number().min(0, { message: 'El límite de crédito no puede ser negativo.' }).default(0),
});

export const expenseSchema = z.object({
  date: z.date({
    required_error: 'Por favor, selecciona una fecha.',
  }),
  description: z.string().min(3, { message: 'La descripción debe tener al menos 3 caracteres.' }),
  category: z.string().min(3, { message: 'La categoría debe tener al menos 3 caracteres.' }),
  amount: z.coerce.number().positive({ message: 'El monto debe ser un número positivo.' }),
  notes: z.string().optional(),
});

export const productSchema = z.object({
    name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    description: z.string().optional(),
    price: z.coerce.number().positive({ message: 'El precio debe ser un número positivo.' }),
    cost: z.coerce.number().min(0, { message: 'El costo no puede ser negativo.' }),
    taxRate: z.coerce.number().min(0, { message: 'La tasa de impuesto no puede ser negativa.' }),
    stock: z.coerce.number().int({ message: 'El stock debe ser un número entero.' }),
    minStock: z.coerce.number().int({ message: 'El stock mínimo debe ser un número entero.' }),
    category: z.string().min(3, { message: 'La categoría es obligatoria.' }),
    supplier: z.string().optional(),
    isActive: z.boolean().default(true),
});


export const userSchema = z.object({
    displayName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
    email: z.string().email({ message: 'Por favor, introduce un correo válido.' }),
    role: z.enum(['admin', 'seller', 'accountant'], { required_error: 'Por favor, selecciona un rol.' }),
    password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }).optional(),
    confirmPassword: z.string().optional(),
}).refine(data => {
    // Si la contraseña está presente, la confirmación también debe estarlo y coincidir.
    if (data.password && data.password !== data.confirmPassword) {
        return false;
    }
    return true;
}, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'], // Asignar el error al campo de confirmación
});

export const companySettingsSchema = z.object({
  name: z.string().min(3, { message: 'El nombre de la empresa es obligatorio.' }),
  taxId: z.string().min(5, { message: 'El NIT/ID fiscal es obligatorio.' }),
  address: z.string().min(5, { message: 'La dirección es obligatoria.' }),
  phone: z.string().min(7, { message: 'El teléfono es obligatorio.' }),
  email: z.string().email({ message: 'El correo electrónico es obligatorio.' }),
});

export const invoiceSettingsSchema = z.object({
  prefix: z.string().min(1, { message: 'El prefijo es obligatorio.' }).max(10),
  defaultDueDateDays: z.coerce.number().int().min(0).max(365),
});

export const paymentMethodsSchema = z.object({
  methods: z.string().min(3, { message: 'Debe haber al menos un método de pago.'}),
});
