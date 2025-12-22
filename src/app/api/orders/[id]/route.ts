// Get specific order details
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { Order, OrderWithItems, OrderItem, Customer } from '@/types';

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

        // Fetch customer information if customer_id exists
        let customer: Customer | null = null;
        if (order.customer_id) {
            const { data: customerData, error: customerError } = await supabase
                .from('customers')
                .select('*')
                .eq('id', order.customer_id)
                .single();
            
            if (!customerError && customerData) {
                customer = customerData as Customer;
            }
        }

        const orderWithItems: OrderWithItems & { customer?: Customer | null } = {
            ...order,
            items: (items || []) as OrderItem[],
            customer: customer
        };

        return NextResponse.json(orderWithItems);
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
}
