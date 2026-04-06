import { NextResponse } from 'next/server';

import { getSessionUserId } from '@/lib/auth-session';
import { userSchema } from '@/lib/schemas';
import { getUserById, updateUser, updateUserStatus } from '@/lib/postgres-users';

export const runtime = 'nodejs';

async function requireAdmin() {
  const userId = await getSessionUserId();

  if (!userId) {
    return { error: NextResponse.json({ message: 'No active session.' }, { status: 401 }) };
  }

  const user = await getUserById(userId);
  if (!user || !user.isActive) {
    return { error: NextResponse.json({ message: 'User not available.' }, { status: 401 }) };
  }

  if (user.role !== 'admin') {
    return { error: NextResponse.json({ message: 'No autorizado.' }, { status: 403 }) };
  }

  return { user };
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return auth.error;
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = userSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Datos invalidos.' }, { status: 400 });
    }

    const user = await updateUser(id, {
      displayName: parsed.data.displayName,
      role: parsed.data.role,
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No se pudo actualizar el usuario.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return auth.error;
    }

    const { id } = await context.params;
    const body = (await request.json()) as { isActive?: boolean };

    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json({ message: 'Datos invalidos.' }, { status: 400 });
    }

    const user = await updateUserStatus(id, body.isActive);
    if (!user) {
      return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'No se pudo actualizar el estado del usuario.',
      },
      { status: 500 }
    );
  }
}
