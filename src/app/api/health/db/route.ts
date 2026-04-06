import { NextResponse } from 'next/server';

import { checkDatabaseConnection } from '@/lib/postgres';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const database = await checkDatabaseConnection();

    return NextResponse.json({
      ok: true,
      database,
    });
  } catch (error) {
    console.error('Database health check failed:', error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : 'No se pudo validar la conexion con Supabase.',
      },
      { status: 500 }
    );
  }
}
