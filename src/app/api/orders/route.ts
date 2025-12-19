// Orders API - Create and fetch orders
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { Order, OrderWithItems, OrderItem } from '@/types';
import { generateBillNumber, getDayBounds, formatCurrency, getTodayDate } from '@/lib/utils';
import { broadcastNotification } from '@/lib/notifications';
import { OrderNotification } from '@/types';

// Also broadcast via Supabase Realtime for cross-instance communication
async function broadcastViaSupabase(notification: OrderNotification) {
    try {
        // Insert into a notifications table or use Supabase Realtime channel
        // For now, we'll use a simple approach: insert into a notifications log table
        // This will trigger Realtime subscriptions
        const { error } = await supabase
            .from('order_notifications')
            .insert({
                order_id: notification.order.id,
                bill_number: notification.order.bill_number,
                notification_data: notification,
                created_at: notification.timestamp
            });
        
        if (error) {
            console.error('[Order API] Error broadcasting via Supabase:', error);
        } else {
            console.log('[Order API] Notification broadcast via Supabase successful');
        }
    } catch (error) {
        console.error('[Order API] Error in Supabase broadcast:', error);
    }
}

// GET - Fetch orders with optional date filtering and advanced filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const orderType = searchParams.get('orderType');
        const paymentMode = searchParams.get('paymentMode');
        const minAmount = searchParams.get('minAmount');
        const maxAmount = searchParams.get('maxAmount');
        const billNumber = searchParams.get('billNumber');
        const status = searchParams.get('status');

        let query = supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        // Date filtering - use date range if provided, otherwise use single date
        if (startDate && endDate) {
            const startBounds = getDayBounds(startDate);
            const endBounds = getDayBounds(endDate);
            query = query.gte('created_at', startBounds.start).lte('created_at', endBounds.end);
        } else if (date) {
            const { start, end } = getDayBounds(date);
            query = query.gte('created_at', start).lte('created_at', end);
        }

        // Advanced filters
        if (orderType) {
            query = query.eq('order_type', orderType);
        }

        if (paymentMode) {
            query = query.eq('payment_mode', paymentMode);
        }

        if (status) {
            query = query.eq('status', status);
        }

        if (minAmount) {
            query = query.gte('total_amount', parseFloat(minAmount));
        }

        if (maxAmount) {
            query = query.lte('total_amount', parseFloat(maxAmount));
        }

        if (billNumber) {
            query = query.ilike('bill_number', `%${billNumber}%`);
        }

        const { data: orders, error } = await query;

        if (error) {
            console.error('Error fetching orders:', error);
            return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
        }

        return NextResponse.json(orders as Order[]);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

// POST - Create new order
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { order_type, payment_mode, items, notes, created_by } = body;

        if (!order_type || !payment_mode || !items || items.length === 0 || !created_by) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Calculate total
        const total = items.reduce((sum: number, item: any) => {
            return sum + (item.price * item.quantity);
        }, 0);

        // Get today's order count for bill number generation
        const today = getTodayDate();
        const { start, end } = getDayBounds(today);
        
        const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', start)
            .lte('created_at', end);

        const billNumber = generateBillNumber(count || 0);

        // Insert order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                bill_number: billNumber,
                order_type,
                payment_mode,
                total_amount: total,
                notes: notes || null,
                created_by: parseInt(created_by)
            })
            .select()
            .single();

        if (orderError || !order) {
            console.error('Error creating order:', orderError);
            return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
        }

        const orderId = order.id;

        // Insert order items
        const orderItems = items.map((item: any) => ({
            order_id: orderId,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price_at_time: item.price
        }));

        const { data: insertedItems, error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems)
            .select();

        if (itemsError) {
            console.error('Error creating order items:', itemsError);
            // Rollback order if items fail
            await supabase.from('orders').delete().eq('id', orderId);
            return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
        }

        // Update inventory: decrement stock for each product in the order
        for (const item of items) {
            const productId = item.product_id;
            const quantity = item.quantity;

            // Get current stock
            const { data: product, error: productError } = await supabase
                .from('products')
                .select('stock_quantity')
                .eq('id', productId)
                .single();

            if (productError || !product) {
                console.error(`Error fetching product ${productId} stock:`, productError);
                continue; // Skip this product but continue with others
            }

            const currentStock = product.stock_quantity ?? 0;
            const newStock = Math.max(0, currentStock - quantity); // Prevent negative stock

            // Update product stock
            const { error: updateError } = await supabase
                .from('products')
                .update({ stock_quantity: newStock })
                .eq('id', productId);

            if (updateError) {
                console.error(`Error updating stock for product ${productId}:`, updateError);
                continue;
            }

            // Create inventory history entry
            await supabase.from('inventory_history').insert({
                product_id: productId,
                change_type: 'sale',
                quantity_change: -quantity,
                previous_stock: currentStock,
                new_stock: newStock,
                reference_order_id: orderId,
                notes: `Order ${billNumber}`
            });
        }

        const orderWithItems: OrderWithItems = {
            ...order,
            items: insertedItems as OrderItem[]
        };

        // Broadcast notification to all connected clients
        const notification: OrderNotification = {
            type: 'order_completed',
            order: orderWithItems,
            timestamp: new Date().toISOString(),
            message: `New order completed: Bill #${billNumber} - ${formatCurrency(total)}`
        };
        
        console.log('[Order API] Broadcasting notification for order:', billNumber);
        
        // Broadcast via SSE (for same-instance connections)
        try {
            broadcastNotification(notification);
            console.log('[Order API] SSE notification broadcast successful');
        } catch (error) {
            console.error('[Order API] Error broadcasting SSE notification:', error);
        }
        
        // Broadcast via Supabase Realtime (for cross-instance/cross-screen communication)
        await broadcastViaSupabase(notification);

        return NextResponse.json(orderWithItems, { status: 201 });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}
