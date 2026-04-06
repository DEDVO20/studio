import { NextResponse } from 'next/server';

import { setSessionCookie } from '@/lib/auth-session';
import { createInitialAdmin } from '@/lib/postgres-users';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim() ?? '';
    const password = body.password ?? '';

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Correo y contraseña son obligatorios.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const user = await createInitialAdmin(email, password);
    await setSessionCookie(user.id);

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error creating initial admin:', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'No se pudo crear la cuenta inicial.',
      },
      { status: 400 }
    );
  }
}
