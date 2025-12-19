// Analytics API - Advanced reporting and analytics
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getDayBounds, getWeekBounds, getMonthBounds, getDateRange } from '@/lib/utils';
import { AnalyticsData, SalesTrendData, BestSellingProduct, PeakHourData } from '@/types';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const period = (searchParams.get('period') || 'daily') as 'daily' | 'weekly' | 'monthly';
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

        let startTimestamp: string;
        let endTimestamp: string;
        let dateRange: string[];
        let startDate: string;
        let endDate: string;

        // Determine date range based on period
        if (period === 'daily') {
            const bounds = getDayBounds(date);
            startTimestamp = bounds.start;
            endTimestamp = bounds.end;
            startDate = date;
            endDate = date;
            dateRange = [date];
        } else if (period === 'weekly') {
            const bounds = getWeekBounds(date);
            startTimestamp = bounds.start;
            endTimestamp = bounds.end;
            // Extract local date strings from the Date objects
            const startDateObj = new Date(bounds.start);
            const endDateObj = new Date(bounds.end);
            startDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')}`;
            endDate = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`;
            dateRange = getDateRange(startDate, endDate);
        } else {
            // monthly
            const bounds = getMonthBounds(date);
            startTimestamp = bounds.start;
            endTimestamp = bounds.end;
            // Extract local date strings from the Date objects
            const startDateObj = new Date(bounds.start);
            const endDateObj = new Date(bounds.end);
            startDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')}`;
            endDate = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`;
            dateRange = getDateRange(startDate, endDate);
        }

        // Fetch all orders in the date range
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id, total_amount, created_at')
            .gte('created_at', startTimestamp)
            .lte('created_at', endTimestamp)
            .eq('status', 'completed')
            .order('created_at', { ascending: true });

        if (ordersError) {
            console.error('Error fetching orders:', ordersError);
            return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
        }

        // Fetch all order items in the date range
        let orderItems: any[] = [];
        if (orders && orders.length > 0) {
            const { data: items, error: itemsError } = await supabase
                .from('order_items')
                .select('order_id, product_id, product_name, quantity, price_at_time')
                .in('order_id', orders.map(o => o.id));

            if (itemsError) {
                console.error('Error fetching order items:', itemsError);
                return NextResponse.json({ error: 'Failed to fetch order items' }, { status: 500 });
            }
            orderItems = items || [];
        }

        // Build a map of order_id to order for quick lookup
        const orderMap = new Map(orders?.map(o => [o.id, o]) || []);

        // 1. Calculate Sales Trends
        const salesTrendsMap = new Map<string, { revenue: number; orders: number }>();

        // Initialize all dates in range with zero values
        dateRange.forEach(d => {
            salesTrendsMap.set(d, { revenue: 0, orders: 0 });
        });

        // Aggregate sales by date (convert UTC timestamp to local date)
        orders?.forEach(order => {
            // Parse the ISO timestamp and convert to local date
            const orderTimestamp = new Date(order.created_at);
            const year = orderTimestamp.getFullYear();
            const month = String(orderTimestamp.getMonth() + 1).padStart(2, '0');
            const day = String(orderTimestamp.getDate()).padStart(2, '0');
            const orderDate = `${year}-${month}-${day}`;
            
            const existing = salesTrendsMap.get(orderDate) || { revenue: 0, orders: 0 };
            salesTrendsMap.set(orderDate, {
                revenue: existing.revenue + parseFloat(order.total_amount.toString()),
                orders: existing.orders + 1
            });
        });

        const salesTrends: SalesTrendData[] = dateRange.map(date => ({
            date,
            revenue: salesTrendsMap.get(date)?.revenue || 0,
            orders: salesTrendsMap.get(date)?.orders || 0
        }));

        // 2. Calculate Best Selling Products
        const productMap = new Map<number, {
            product_id: number;
            product_name: string;
            total_quantity: number;
            total_revenue: number;
            order_count: number;
        }>();

        orderItems.forEach(item => {
            const order = orderMap.get(item.order_id);
            if (!order) return;

            const existing = productMap.get(item.product_id) || {
                product_id: item.product_id,
                product_name: item.product_name,
                total_quantity: 0,
                total_revenue: 0,
                order_count: 0
            };

            productMap.set(item.product_id, {
                product_id: item.product_id,
                product_name: item.product_name,
                total_quantity: existing.total_quantity + item.quantity,
                total_revenue: existing.total_revenue + (item.quantity * parseFloat(item.price_at_time.toString())),
                order_count: existing.order_count + 1
            });
        });

        const bestSellingProducts: BestSellingProduct[] = Array.from(productMap.values())
            .sort((a, b) => b.total_quantity - a.total_quantity)
            .slice(0, 10); // Top 10

        // 3. Calculate Peak Hours
        const hourMap = new Map<number, { revenue: number; orders: number }>();

        // Initialize all hours (0-23) with zero values
        for (let i = 0; i < 24; i++) {
            hourMap.set(i, { revenue: 0, orders: 0 });
        }

        orders?.forEach(order => {
            const orderDate = new Date(order.created_at);
            const hour = orderDate.getHours();
            const existing = hourMap.get(hour) || { revenue: 0, orders: 0 };
            hourMap.set(hour, {
                revenue: existing.revenue + parseFloat(order.total_amount.toString()),
                orders: existing.orders + 1
            });
        });

        const peakHours: PeakHourData[] = Array.from(hourMap.entries())
            .map(([hour, data]) => ({
                hour,
                revenue: data.revenue,
                orders: data.orders
            }))
            .sort((a, b) => a.hour - b.hour);

        const analyticsData: AnalyticsData = {
            sales_trends: salesTrends,
            best_selling_products: bestSellingProducts,
            peak_hours: peakHours,
            period,
            start_date: startDate,
            end_date: endDate
        };

        return NextResponse.json(analyticsData);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}

