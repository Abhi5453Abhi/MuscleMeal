// Profit & Loss API - Calculate revenue, expenses, and profit
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getDayBounds, getWeekBounds, getMonthBounds } from '@/lib/utils';
import { ProfitLossData } from '@/types';

// GET - Calculate profit and loss for a given period
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const period = searchParams.get('period') || 'daily'; // daily, weekly, monthly

        let dateStart: string;
        let dateEnd: string;
        let orderStartTime: string;
        let orderEndTime: string;

        if (startDate && endDate) {
            dateStart = startDate;
            dateEnd = endDate;
            const startBounds = getDayBounds(startDate);
            const endBounds = getDayBounds(endDate);
            orderStartTime = startBounds.start;
            orderEndTime = endBounds.end;
        } else if (date) {
            if (period === 'weekly') {
                const bounds = getWeekBounds(date);
                dateStart = bounds.start.split('T')[0];
                dateEnd = bounds.end.split('T')[0];
                orderStartTime = bounds.start;
                orderEndTime = bounds.end;
            } else if (period === 'monthly') {
                const bounds = getMonthBounds(date);
                dateStart = bounds.start.split('T')[0];
                dateEnd = bounds.end.split('T')[0];
                orderStartTime = bounds.start;
                orderEndTime = bounds.end;
            } else {
                dateStart = date;
                dateEnd = date;
                const bounds = getDayBounds(date);
                orderStartTime = bounds.start;
                orderEndTime = bounds.end;
            }
        } else {
            // Default to today
            const today = new Date().toISOString().split('T')[0];
            dateStart = today;
            dateEnd = today;
            const bounds = getDayBounds(today);
            orderStartTime = bounds.start;
            orderEndTime = bounds.end;
        }

        // Calculate revenue from orders
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('total_amount')
            .gte('created_at', orderStartTime)
            .lte('created_at', orderEndTime)
            .eq('status', 'completed');

        if (ordersError) {
            console.error('Error fetching orders:', ordersError);
            return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
        }

        const revenue = orders?.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0) || 0;

        // Calculate expenses
        const { data: expenses, error: expensesError } = await supabase
            .from('expenses')
            .select('amount')
            .gte('expense_date', dateStart)
            .lte('expense_date', dateEnd);

        if (expensesError) {
            console.error('Error fetching expenses:', expensesError);
            return NextResponse.json({ error: 'Failed to fetch expenses data' }, { status: 500 });
        }

        const totalExpenses = expenses?.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0) || 0;

        // Calculate profit
        const profit = revenue - totalExpenses;
        const profitPercentage = revenue > 0 ? (profit / revenue) * 100 : 0;

        const profitLossData: ProfitLossData = {
            period: `${dateStart} to ${dateEnd}`,
            revenue,
            expenses: totalExpenses,
            profit,
            profit_percentage: profitPercentage
        };

        return NextResponse.json(profitLossData);
    } catch (error) {
        console.error('Error calculating profit and loss:', error);
        return NextResponse.json({ error: 'Failed to calculate profit and loss' }, { status: 500 });
    }
}



