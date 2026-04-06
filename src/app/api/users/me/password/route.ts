import { NextResponse } from 'next/server';

import { getSessionUserId } from '@/lib/auth-session';
import { changeUserPassword, getUserById } from '@/lib/postgres-users';
import { passwordSettingsSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ message: 'No active session.' }, { status: 401 });
    }

    const user = await getUserById(userId);
    if (!user || !user.isActive) {
      return NextResponse.json({ message: 'User not available.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = passwordSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Datos invalidos.' }, { status: 400 });
    }

    await changeUserPassword(userId, parsed.data.currentPassword, parsed.data.newPassword);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'No se pudo actualizar la contrasena.',
      },
      { status: 500 }
    );
  }
}
