// Orders API - Create and fetch orders
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { Order, OrderWithItems, OrderItem } from '@/types';
import { generateBillNumber, getDayBounds } from '@/lib/utils';

// GET - Fetch orders with optional date filtering
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        let query = supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (date) {
            const { start, end } = getDayBounds(date);
            query = query.gte('created_at', start).lte('created_at', end);
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
        const today = new Date().toISOString().split('T')[0];
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

        const orderWithItems: OrderWithItems = {
            ...order,
            items: insertedItems as OrderItem[]
        };

        return NextResponse.json(orderWithItems, { status: 201 });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}
