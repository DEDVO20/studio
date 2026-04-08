import 'server-only';

import { query, withTransaction } from '@/lib/postgres';
import {
  defaultAppSettings,
  normalizeAppSettings,
  type AppSettings,
  type CompanySettings,
  type InvoiceSettings,
} from '@/lib/app-settings';

type SettingsRow = {
  id: string;
  data: unknown;
};

type SettingsSection = keyof AppSettings;

export async function getAppSettings(): Promise<AppSettings> {
  const result = await query<SettingsRow>(
    `
      SELECT id, data
      FROM settings
      WHERE id IN ('company', 'invoice', 'paymentMethods')
    `
  );

  const companyRow = result.rows.find((row) => row.id === 'company');
  const invoiceRow = result.rows.find((row) => row.id === 'invoice');
  const paymentMethodsRow = result.rows.find((row) => row.id === 'paymentMethods');

  return normalizeAppSettings({
    company: (companyRow?.data as CompanySettings | undefined) ?? defaultAppSettings.company,
    invoice: (invoiceRow?.data as InvoiceSettings | undefined) ?? defaultAppSettings.invoice,
    paymentMethods:
      ((paymentMethodsRow?.data as { methods?: string[] } | string[] | undefined) &&
      Array.isArray(paymentMethodsRow?.data)
        ? (paymentMethodsRow?.data as string[])
        : ((paymentMethodsRow?.data as { methods?: string[] } | undefined)?.methods ?? undefined)) ??
      defaultAppSettings.paymentMethods,
  });
}

export async function updateSettingsSection<T>(id: SettingsSection, data: T) {
  await withTransaction(async (client) => {
    await client.query(
      `
        INSERT INTO settings (id, data, updated_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (id)
        DO UPDATE SET
          data = EXCLUDED.data,
          updated_at = NOW()
      `,
      [id, JSON.stringify(data)]
    );
  });

  return getAppSettings();
}
