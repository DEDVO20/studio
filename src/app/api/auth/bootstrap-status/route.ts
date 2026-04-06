import { NextResponse } from 'next/server';

import { getUserCount } from '@/lib/postgres-users';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const userCount = await getUserCount();
    return NextResponse.json({
      hasUsers: userCount > 0,
      userCount,
    });
  } catch (error) {
    console.error('Error reading bootstrap status:', error);
    return NextResponse.json(
      { message: 'No se pudo consultar el estado inicial del sistema.' },
      { status: 500 }
    );
  }
}
