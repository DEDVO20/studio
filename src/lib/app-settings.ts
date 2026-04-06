import { defaultLogoBase64 } from '@/lib/logo';

export type CompanySettings = {
  name: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
};

export type InvoiceSettings = {
  prefix: string;
  defaultDueDateDays: number;
};

export type AppSettings = {
  company: CompanySettings;
  invoice: InvoiceSettings;
  paymentMethods: string[];
};

export const defaultCompanySettings: CompanySettings = {
  name: 'NexusStore Inc.',
  taxId: '900.123.456-7',
  address: '123 Innovation Drive, Tech City',
  phone: '(555) 123-4567',
  email: 'contact@nexusstore.com',
  logoUrl: defaultLogoBase64,
};

export const defaultInvoiceSettings: InvoiceSettings = {
  prefix: 'FAC-',
  defaultDueDateDays: 30,
};

export const defaultPaymentMethods = [
  'Efectivo',
  'Tarjeta de Credito/Debito',
  'Transferencia Bancaria',
  'Nequi',
  'Daviplata',
];

export const defaultAppSettings: AppSettings = {
  company: defaultCompanySettings,
  invoice: defaultInvoiceSettings,
  paymentMethods: defaultPaymentMethods,
};

export function normalizeAppSettings(input: Partial<AppSettings> | null | undefined): AppSettings {
  return {
    company: {
      ...defaultCompanySettings,
      ...(input?.company ?? {}),
    },
    invoice: {
      ...defaultInvoiceSettings,
      ...(input?.invoice ?? {}),
    },
    paymentMethods:
      input?.paymentMethods?.filter((method) => method.trim().length > 0) ?? defaultPaymentMethods,
  };
}
