import { NextResponse } from 'next/server';

import { setSessionCookie } from '@/lib/auth-session';
import { authenticateUser, getUserCount } from '@/lib/postgres-users';

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

    const authResult = await authenticateUser(email, password);

    if (!authResult.user) {
      const userCount = await getUserCount();
      const status =
        authResult.reason === 'inactive'
          ? { status: 403, message: 'Tu cuenta no está activa o no tienes permisos.' }
          : userCount === 0
            ? { status: 404, message: 'No hay usuarios configurados en el sistema.', requiresSetup: true }
            : { status: 401, message: 'El correo o la contraseña no son correctos.' };

      return NextResponse.json(status, { status: status.status });
    }

    await setSessionCookie(authResult.user.id);
    return NextResponse.json({ user: authResult.user });
  } catch (error) {
    console.error('Error during Postgres login:', error);
    return NextResponse.json(
      { message: 'No se pudo iniciar sesión.' },
      { status: 500 }
    );
  }
}
