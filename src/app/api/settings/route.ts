import { NextResponse } from 'next/server';

import { getSessionUserId } from '@/lib/auth-session';
import { getAppSettings, updateSettingsSection } from '@/lib/postgres-settings';
import { getUserById } from '@/lib/postgres-users';
import {
  companySettingsSchema,
  invoiceSettingsSchema,
  paymentMethodsSchema,
} from '@/lib/schemas';

export const runtime = 'nodejs';

async function requireAuthenticatedUser() {
  const userId = await getSessionUserId();

  if (!userId) {
    return { error: NextResponse.json({ message: 'No active session.' }, { status: 401 }) };
  }

  const user = await getUserById(userId);
  if (!user || !user.isActive) {
    return { error: NextResponse.json({ message: 'User not available.' }, { status: 401 }) };
  }

  return { user };
}

export async function GET() {
  try {
    const auth = await requireAuthenticatedUser();
    if ('error' in auth) {
      return auth.error;
    }

    const settings = await getAppSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error reading settings:', error);
    return NextResponse.json(
      { message: 'No se pudo cargar la configuracion.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAuthenticatedUser();
    if ('error' in auth) {
      return auth.error;
    }

    if (auth.user.role !== 'admin') {
      return NextResponse.json({ message: 'No autorizado.' }, { status: 403 });
    }

    const body = (await request.json()) as {
      section?: 'company' | 'invoice' | 'paymentMethods';
      data?: unknown;
    };

    if (!body.section) {
      return NextResponse.json({ message: 'La seccion es obligatoria.' }, { status: 400 });
    }

    if (body.section === 'company') {
      const parsed = companySettingsSchema.safeParse(body.data);
      if (!parsed.success) {
        return NextResponse.json({ message: 'Datos invalidos.' }, { status: 400 });
      }

      const settings = await updateSettingsSection('company', parsed.data);
      return NextResponse.json({ settings });
    }

    if (body.section === 'invoice') {
      const parsed = invoiceSettingsSchema.safeParse(body.data);
      if (!parsed.success) {
        return NextResponse.json({ message: 'Datos invalidos.' }, { status: 400 });
      }

      const settings = await updateSettingsSection('invoice', parsed.data);
      return NextResponse.json({ settings });
    }

    if (body.section === 'paymentMethods') {
      const parsed = paymentMethodsSchema.safeParse(body.data);
      if (!parsed.success) {
        return NextResponse.json({ message: 'Datos invalidos.' }, { status: 400 });
      }

      const methods = parsed.data.methods
        .split('\n')
        .map((method) => method.trim())
        .filter(Boolean);

      const settings = await updateSettingsSection('paymentMethods', { methods });
      return NextResponse.json({ settings });
    }

    return NextResponse.json({ message: 'Seccion no soportada.' }, { status: 400 });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { message: 'No se pudo guardar la configuracion.' },
      { status: 500 }
    );
  }
}
