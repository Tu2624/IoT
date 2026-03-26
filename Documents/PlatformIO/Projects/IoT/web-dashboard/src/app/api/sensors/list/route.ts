import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM LICH_SU_DU_LIEU ORDER BY recorded_date DESC LIMIT 1000');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch sensor data' }, { status: 500 });
  }
}
