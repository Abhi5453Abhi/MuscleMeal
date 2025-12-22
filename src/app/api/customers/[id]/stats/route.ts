// Customer Statistics API - Get customer spending and order statistics
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const customerId = parseInt(params.id);

        if (!customerId) {
            return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
        }

        // Get all orders for this customer (include all statuses to calculate total money spent)
        // Total spent = sum of all order amounts (original order value before advance deduction)
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id, total_amount, advance_used, status')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (ordersError) {
            console.error('Error fetching customer orders:', ordersError);
            return NextResponse.json({ error: 'Failed to fetch customer orders' }, { status: 500 });
        }

        // Calculate total spent = total money spent by customer
        // When advance is used: total_amount = original_amount - advance_used
        // So original_amount = total_amount + advance_used
        // Total spent = sum of all original order amounts
        const totalSpent = orders?.reduce((sum, order) => {
            const orderTotal = parseFloat(String(order.total_amount || 0));
            const advanceUsed = parseFloat(String(order.advance_used || 0));
            // Total money spent = original order amount = total_amount + advance_used
            return sum + orderTotal + advanceUsed;
        }, 0) || 0;

        // Get order items for most ordered products
        const orderIds = orders?.map(o => o.id) || [];

        let mostOrderedItems: any[] = [];
        if (orderIds.length > 0) {
            const { data: orderItems, error: itemsError } = await supabase
                .from('order_items')
                .select('*')
                .in('order_id', orderIds);

            if (!itemsError && orderItems) {
                // Group by product_name and sum quantities
                const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();

                orderItems.forEach(item => {
                    const existing = productMap.get(item.product_name) || { name: item.product_name, quantity: 0, revenue: 0 };
                    productMap.set(item.product_name, {
                        name: item.product_name,
                        quantity: existing.quantity + item.quantity,
                        revenue: existing.revenue + (item.price_at_time * item.quantity)
                    });
                });

                mostOrderedItems = Array.from(productMap.values())
                    .sort((a, b) => b.quantity - a.quantity)
                    .slice(0, 5); // Top 5 most ordered items
            }
        }

        return NextResponse.json({
            totalSpent,
            totalOrders: orders?.length || 0,
            mostOrderedItems
        });
    } catch (error) {
        console.error('Error fetching customer stats:', error);
        return NextResponse.json({ error: 'Failed to fetch customer statistics' }, { status: 500 });
    }
}
