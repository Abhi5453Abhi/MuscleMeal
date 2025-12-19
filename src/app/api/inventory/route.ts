// Inventory API - Reports and stock management
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { InventoryReport, InventoryHistory, InventoryNotification } from '@/types';

// GET - Get inventory reports
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const reportType = searchParams.get('type') || 'all';

        if (reportType === 'low_stock') {
            // Get all products and filter for low stock
            const { data: products, error } = await supabase
                .from('products')
                .select(`
                    id,
                    name,
                    stock_quantity,
                    low_stock_threshold,
                    categories (
                        name
                    )
                `)
                .order('stock_quantity', { ascending: true });

            if (error) {
                console.error('Error fetching low stock products:', error);
                return NextResponse.json({ error: 'Failed to fetch low stock products' }, { status: 500 });
            }

            // Filter products where stock is at or below threshold
            const lowStockProducts = (products || []).filter((p: any) => {
                const stock = p.stock_quantity ?? 0;
                const threshold = p.low_stock_threshold ?? 10;
                return stock <= threshold;
            });

            const reports: InventoryReport[] = lowStockProducts.map((p: any) => ({
                product_id: p.id,
                product_name: p.name,
                category_name: p.categories?.name,
                current_stock: p.stock_quantity ?? 0,
                low_stock_threshold: p.low_stock_threshold ?? 10,
                status: p.stock_quantity === 0 ? 'out_of_stock' : 'low_stock',
                total_sold: 0, // Will be calculated if needed
                last_updated: new Date().toISOString()
            }));

            return NextResponse.json(reports);
        } else if (reportType === 'all') {
            // Get all products with inventory status
            const { data: products, error } = await supabase
                .from('products')
                .select(`
                    id,
                    name,
                    stock_quantity,
                    low_stock_threshold,
                    categories (
                        name
                    )
                `)
                .order('name', { ascending: true });

            if (error) {
                console.error('Error fetching products:', error);
                return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
            }

            // Get total sold quantities from order_items
            const { data: orderItems } = await supabase
                .from('order_items')
                .select('product_id, quantity');

            const soldQuantities: Record<number, number> = {};
            (orderItems || []).forEach((item: any) => {
                soldQuantities[item.product_id] = (soldQuantities[item.product_id] || 0) + item.quantity;
            });

            const reports: InventoryReport[] = (products || []).map((p: any) => {
                const stock = p.stock_quantity ?? 0;
                const threshold = p.low_stock_threshold ?? 10;
                let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
                
                if (stock === 0) {
                    status = 'out_of_stock';
                } else if (stock <= threshold) {
                    status = 'low_stock';
                }

                return {
                    product_id: p.id,
                    product_name: p.name,
                    category_name: p.categories?.name,
                    current_stock: stock,
                    low_stock_threshold: threshold,
                    status,
                    total_sold: soldQuantities[p.id] || 0,
                    last_updated: new Date().toISOString()
                };
            });

            return NextResponse.json(reports);
        } else {
            return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error fetching inventory report:', error);
        return NextResponse.json({ error: 'Failed to fetch inventory report' }, { status: 500 });
    }
}

// POST - Add stock (purchase/restock)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { product_id, quantity, notes, created_by } = body;

        if (!product_id || quantity === undefined) {
            return NextResponse.json({ error: 'Product ID and quantity required' }, { status: 400 });
        }

        // Get current stock
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', parseInt(product_id))
            .single();

        if (productError || !product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const currentStock = product.stock_quantity ?? 0;
        const newStock = currentStock + parseInt(quantity);

        // Update product stock
        const { error: updateError } = await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', parseInt(product_id));

        if (updateError) {
            console.error('Error updating stock:', updateError);
            return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });
        }

        // Create inventory history entry
        const { data: history, error: historyError } = await supabase
            .from('inventory_history')
            .insert({
                product_id: parseInt(product_id),
                change_type: 'purchase',
                quantity_change: parseInt(quantity),
                previous_stock: currentStock,
                new_stock: newStock,
                notes: notes || 'Stock purchase',
                created_by: created_by ? parseInt(created_by) : null
            })
            .select()
            .single();

        if (historyError) {
            console.error('Error creating inventory history:', historyError);
        }

        return NextResponse.json({ 
            success: true, 
            new_stock: newStock,
            history: history 
        });
    } catch (error) {
        console.error('Error adding stock:', error);
        return NextResponse.json({ error: 'Failed to add stock' }, { status: 500 });
    }
}

