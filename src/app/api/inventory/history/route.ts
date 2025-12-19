// Inventory History API
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { InventoryHistory } from '@/types';

// GET - Get inventory history
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const limit = parseInt(searchParams.get('limit') || '100');

        let query = supabase
            .from('inventory_history')
            .select(`
                *,
                products (
                    name
                )
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (productId) {
            query = query.eq('product_id', parseInt(productId));
        }

        const { data: history, error } = await query;

        if (error) {
            console.error('Error fetching inventory history:', error);
            return NextResponse.json({ error: 'Failed to fetch inventory history' }, { status: 500 });
        }

        return NextResponse.json(history || []);
    } catch (error) {
        console.error('Error fetching inventory history:', error);
        return NextResponse.json({ error: 'Failed to fetch inventory history' }, { status: 500 });
    }
}

