// Products API - CRUD operations
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { Product } from '@/types';

// GET - Fetch all products or filter by category
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('categoryId');
        const enabledOnly = searchParams.get('enabledOnly') === 'true';

        let query = supabase
            .from('products')
            .select(`
                *,
                categories (
                    name,
                    display_order
                )
            `);

        if (categoryId) {
            query = query.eq('category_id', parseInt(categoryId));
        }

        if (enabledOnly) {
            query = query.eq('enabled', true);
        }

        const { data: products, error } = await query;

        if (error) {
            console.error('Error fetching products:', error);
            return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
        }

        // Transform the data to match the expected format
        let formattedProducts: Product[] = products?.map((p: any) => ({
            id: p.id,
            name: p.name,
            category_id: p.category_id,
            category_name: p.categories?.name,
            price: parseFloat(p.price),
            enabled: p.enabled,
            created_at: p.created_at
        })) || [];

        // Sort by category display_order, then by product name
        formattedProducts.sort((a, b) => {
            const aOrder = (products?.find((p: any) => p.id === a.id)?.categories?.display_order || 0);
            const bOrder = (products?.find((p: any) => p.id === b.id)?.categories?.display_order || 0);
            if (aOrder !== bOrder) {
                return aOrder - bOrder;
            }
            return a.name.localeCompare(b.name);
        });

        return NextResponse.json(formattedProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

// POST - Create new product (admin only)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, category_id, price } = body;

        if (!name || !category_id || price === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data: product, error } = await supabase
            .from('products')
            .insert({
                name,
                category_id: parseInt(category_id),
                price: parseFloat(price),
                enabled: true
            })
            .select(`
                *,
                categories (
                    name
                )
            `)
            .single();

        if (error) {
            console.error('Error creating product:', error);
            return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
        }

        const formattedProduct: Product = {
            id: product.id,
            name: product.name,
            category_id: product.category_id,
            category_name: product.categories?.name,
            price: parseFloat(product.price),
            enabled: product.enabled,
            created_at: product.created_at
        };

        return NextResponse.json(formattedProduct, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}

// PUT - Update product (admin only)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, category_id, price, enabled } = body;

        if (!id) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (category_id !== undefined) updates.category_id = parseInt(category_id);
        if (price !== undefined) updates.price = parseFloat(price);
        if (enabled !== undefined) updates.enabled = enabled;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const { data: product, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', parseInt(id))
            .select(`
                *,
                categories (
                    name
                )
            `)
            .single();

        if (error) {
            console.error('Error updating product:', error);
            return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
        }

        const formattedProduct: Product = {
            id: product.id,
            name: product.name,
            category_id: product.category_id,
            category_name: product.categories?.name,
            price: parseFloat(product.price),
            enabled: product.enabled,
            created_at: product.created_at
        };

        return NextResponse.json(formattedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
}

// DELETE - Remove product (admin only)
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', parseInt(id));

        if (error) {
            console.error('Error deleting product:', error);
            return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
