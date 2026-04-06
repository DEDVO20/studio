import { NextResponse } from 'next/server';

import { getDashboardSnapshot } from '@/lib/postgres-dashboard';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const snapshot = await getDashboardSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('Error loading dashboard snapshot from Postgres:', error);
    return NextResponse.json(
      { message: 'No se pudo cargar el dashboard.' },
      { status: 500 }
    );
  }
}
