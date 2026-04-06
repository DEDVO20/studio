import { NextResponse } from 'next/server';

import { getSessionUserId } from '@/lib/auth-session';
import { userSchema } from '@/lib/schemas';
import { createUser, getUserById, listUsers } from '@/lib/postgres-users';

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

export async function GET() {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return auth.error;
    }

    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error listing users:', error);
    return NextResponse.json({ message: 'No se pudieron cargar los usuarios.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return auth.error;
    }

    const body = await request.json();
    const parsed = userSchema.safeParse(body);

    if (!parsed.success || !parsed.data.password) {
      return NextResponse.json({ message: 'Datos invalidos.' }, { status: 400 });
    }

    const user = await createUser({
      displayName: parsed.data.displayName,
      email: parsed.data.email,
      role: parsed.data.role,
      password: parsed.data.password,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No se pudo crear el usuario.' },
      { status: 500 }
    );
  }
}
