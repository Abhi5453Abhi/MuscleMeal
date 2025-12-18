// Orders API - Create and fetch orders
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { Order, OrderWithItems, OrderItem } from '@/types';
import { generateBillNumber, getDayBounds } from '@/lib/utils';

// GET - Fetch orders with optional date filtering
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        let query = 'SELECT * FROM orders';
        const params: any[] = [];

        if (date) {
            const { start, end } = getDayBounds(date);
            query += ' WHERE created_at BETWEEN ? AND ?';
            params.push(start, end);
        }

        query += ' ORDER BY created_at DESC';

        const orders = db.prepare(query).all(...params) as Order[];
        return NextResponse.json(orders);
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
        const orderCount = db.prepare(
            'SELECT COUNT(*) as count FROM orders WHERE created_at BETWEEN ? AND ?'
        ).get(start, end) as { count: number };

        const billNumber = generateBillNumber(orderCount.count);

        // Insert order
        const orderResult = db.prepare(`
      INSERT INTO orders (bill_number, order_type, payment_mode, total_amount, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(billNumber, order_type, payment_mode, total, notes || null, created_by);

        const orderId = orderResult.lastInsertRowid;

        // Insert order items
        const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_time)
      VALUES (?, ?, ?, ?, ?)
    `);

        for (const item of items) {
            insertItem.run(orderId, item.product_id, item.product_name, item.quantity, item.price);
        }

        // Fetch the complete order with items
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Order;
        const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) as OrderItem[];

        const orderWithItems: OrderWithItems = {
            ...order,
            items: orderItems
        };

        return NextResponse.json(orderWithItems, { status: 201 });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}
