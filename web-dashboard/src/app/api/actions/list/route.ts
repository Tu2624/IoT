import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';
    const sortBy = searchParams.get('sortBy') || 'report_date';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';
    const searchTime = searchParams.get('searchTime') || '';

    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push('(CAST(report_id AS CHAR) LIKE ? OR device_name LIKE ? OR status LIKE ? OR description LIKE ?)');
      const searchLike = `%${search}%`;
      params.push(searchLike, searchLike, searchLike, searchLike);
    }

    if (searchTime) {
      conditions.push('DATE_FORMAT(report_date, "%Y-%m-%d %H:%i") = ?');
      params.push(searchTime);
    }

    // Combined filter: device or status
    if (filter !== 'all') {
      if (filter.startsWith('device_')) {
        const deviceName = filter.replace('device_', '');
        conditions.push('device_name = ?');
        params.push(deviceName);
      } else if (filter.startsWith('status_')) {
        const status = filter.replace('status_', '');
        conditions.push('status = ?');
        params.push(status);
      }
    }

    // Validate sort columns
    const allowedSortColumns: Record<string, string> = {
      'report_id': 'report_id',
      'report_date': 'report_date',
      'device_name': 'device_name',
      'status': 'status',
      'description': 'description',
    };
    const safeSortBy = allowedSortColumns[sortBy] || 'report_date';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM BAO_CAO_BAO_MAT ${whereClause}`;
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, params);
    const total = countRows[0].total;

    // Fetch paginated data
    const dataQuery = `SELECT * FROM BAO_CAO_BAO_MAT ${whereClause} ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`;
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
    return NextResponse.json({ error: 'Failed to fetch action logs' }, { status: 500 });
  }
}
