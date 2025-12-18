// Get specific order details
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { Order, OrderWithItems, OrderItem } from '@/types';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const orderId = parseInt(params.id);

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId);

        if (itemsError) {
            console.error('Error fetching order items:', itemsError);
            return NextResponse.json({ error: 'Failed to fetch order items' }, { status: 500 });
        }

        const orderWithItems: OrderWithItems = {
            ...order,
            items: (items || []) as OrderItem[]
        };

        return NextResponse.json(orderWithItems);
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
}
