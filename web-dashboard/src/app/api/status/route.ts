import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Lấy trạng thái hiện tại của tất cả thiết bị
    const [devices] = await pool.query<RowDataPacket[]>(
      'SELECT device_key, device_name, is_on, updated_at FROM TRANG_THAI_THIET_BI'
    );

    // Chuyển thành object { led_temp: true, led_humi: false, led_bh: true }
    const status: Record<string, boolean> = {};
    for (const device of devices) {
      status[device.device_key] = device.is_on === 1;
    }

    return NextResponse.json({ status });
  } catch (error) {
    console.error('API Error:', error);
    // Trả về lỗi 500 để người dùng thấy lỗi kết nối thực sự thay vì dữ liệu giả
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}
