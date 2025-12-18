// Sales analytics API
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getDayBounds, getTodayDate } from '@/lib/utils';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date') || getTodayDate();

        const { start, end } = getDayBounds(date);

        // Get daily sales summary
        const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(SUM(CASE WHEN payment_mode = 'cash' THEN total_amount ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN payment_mode = 'upi' THEN total_amount ELSE 0 END), 0) as upi_sales,
        SUM(CASE WHEN payment_mode = 'cash' THEN 1 ELSE 0 END) as cash_orders,
        SUM(CASE WHEN payment_mode = 'upi' THEN 1 ELSE 0 END) as upi_orders
      FROM orders 
      WHERE created_at BETWEEN ? AND ?
    `).get(start, end);

        return NextResponse.json({
            date,
            ...summary
        });
    } catch (error) {
        console.error('Error fetching sales:', error);
        return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
    }
}
