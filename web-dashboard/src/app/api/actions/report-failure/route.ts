import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { device_key, status, description } = await request.json();

    // Mapping key -> name
    const DEVICE_MAP: Record<string, string> = {
      'led_temp': 'LED_NHIET_DO',
      'led_humi': 'LED_DO_AM',
      'led_bh': 'LED_ANH_SANG',
      'all': 'TAT_CA_LED'
    };

    const deviceName = DEVICE_MAP[device_key] || 'ESP32';

    // Chèn bản ghi lỗi vào bảng BAO_CAO_BAO_MAT
    await pool.execute(
      'INSERT INTO BAO_CAO_BAO_MAT (device_name, status, description) VALUES (?, ?, ?)',
      [deviceName, status || 'error', description || 'Command timed out']
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failure reporting error:', error);
    return NextResponse.json({ error: 'Failed to report failure' }, { status: 500 });
  }
}
