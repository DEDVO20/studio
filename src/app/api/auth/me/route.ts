import { NextResponse } from 'next/server';

import { getSessionUserId } from '@/lib/auth-session';
import { getUserById } from '@/lib/postgres-users';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ message: 'No active session.' }, { status: 401 });
    }

    const user = await getUserById(userId);

    if (!user || !user.isActive) {
      return NextResponse.json({ message: 'User not available.' }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error reading current auth session:', error);
    return NextResponse.json(
      { message: 'No se pudo cargar la sesión actual.' },
      { status: 500 }
    );
  }
}
