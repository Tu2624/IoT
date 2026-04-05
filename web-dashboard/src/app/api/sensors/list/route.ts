import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const search = searchParams.get('search') || '';
    const sensorType = searchParams.get('sensorType') || 'all';
    const sortBy = searchParams.get('sortBy') || 'recorded_date';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';
    const searchTime = searchParams.get('searchTime') || '';

    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push('(CAST(temp AS CHAR) LIKE ? OR CAST(humi AS CHAR) LIKE ? OR CAST(lux AS CHAR) LIKE ?)');
      const searchLike = `%${search}%`;
      params.push(searchLike, searchLike, searchLike);
    }

    if (searchTime) {
      conditions.push('DATE_FORMAT(recorded_date, "%Y-%m-%d %H:%i") = ?');
      params.push(searchTime);
    }

    // Validate sort columns
    const allowedSortColumns: Record<string, string> = {
      'history_id': 'history_id',
      'recorded_date': 'recorded_date',
      'temp': 'temp',
      'humi': 'humi',
      'lux': 'lux',
    };
    const safeSortBy = allowedSortColumns[sortBy] || 'recorded_date';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM LICH_SU_DU_LIEU ${whereClause}`;
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, params);
    const total = countRows[0].total;

    // Fetch paginated data
    const dataQuery = `SELECT * FROM LICH_SU_DU_LIEU ${whereClause} ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`;
    const [rows] = await pool.query<RowDataPacket[]>(dataQuery, [...params, limit, offset]);

    return NextResponse.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch sensor data' }, { status: 500 });
  }
}
