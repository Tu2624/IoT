import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM BAO_CAO_BAO_MAT ORDER BY report_date DESC LIMIT 1000');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch action logs' }, { status: 500 });
  }
}
