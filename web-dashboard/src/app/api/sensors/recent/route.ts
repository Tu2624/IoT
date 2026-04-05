import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    // Lấy 5 bản ghi cảm biến mới nhất (cho biểu đồ Dashboard)
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT history_id, temp, humi, lux, recorded_date FROM LICH_SU_DU_LIEU ORDER BY recorded_date DESC LIMIT 5'
    );

    // Đảo ngược để hiển thị theo thứ tự thời gian (cũ -> mới)
    const reversed = (rows as any[]).reverse();

    return NextResponse.json(reversed);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json([]);
  }
}
