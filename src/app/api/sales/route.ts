// Sales analytics API
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getDayBounds, getTodayDate } from '@/lib/utils';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date') || getTodayDate();

        const { start, end } = getDayBounds(date);

        // Get all orders for the date
        const { data: orders, error } = await supabase
            .from('orders')
            .select('payment_mode, total_amount')
            .gte('created_at', start)
            .lte('created_at', end);

        if (error) {
            console.error('Error fetching sales:', error);
            return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
        }

        // Calculate summary
        const summary = {
            total_orders: orders?.length || 0,
            total_sales: orders?.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0) || 0,
            cash_sales: orders?.filter(o => o.payment_mode === 'cash')
                .reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0) || 0,
            upi_sales: orders?.filter(o => o.payment_mode === 'upi')
                .reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0) || 0,
            cash_orders: orders?.filter(o => o.payment_mode === 'cash').length || 0,
            upi_orders: orders?.filter(o => o.payment_mode === 'upi').length || 0
        };

        return NextResponse.json({
            date,
            ...summary
        });
    } catch (error) {
        console.error('Error fetching sales:', error);
        return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
    }
}
