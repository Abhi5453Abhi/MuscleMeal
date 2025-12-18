// Get specific order details
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { Order, OrderWithItems, OrderItem } from '@/types';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const orderId = parseInt(params.id);

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Order;

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) as OrderItem[];

        const orderWithItems: OrderWithItems = {
            ...order,
            items
        };

        return NextResponse.json(orderWithItems);
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
}
