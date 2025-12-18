// Products API - CRUD operations
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { Product } from '@/types';

// GET - Fetch all products or filter by category
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('categoryId');
        const enabledOnly = searchParams.get('enabledOnly') === 'true';

        let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
        const params: any[] = [];

        if (categoryId) {
            query += ' AND p.category_id = ?';
            params.push(parseInt(categoryId));
        }

        if (enabledOnly) {
            query += ' AND p.enabled = 1';
        }

        query += ' ORDER BY c.display_order, p.name';

        const products = db.prepare(query).all(...params) as Product[];
        return NextResponse.json(products);
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

        const result = db.prepare(
            'INSERT INTO products (name, category_id, price, enabled) VALUES (?, ?, ?, 1)'
        ).run(name, category_id, price);

        const product = db.prepare(
            'SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?'
        ).get(result.lastInsertRowid) as Product;

        return NextResponse.json(product, { status: 201 });
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

        const updates: string[] = [];
        const params: any[] = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (category_id !== undefined) {
            updates.push('category_id = ?');
            params.push(category_id);
        }
        if (price !== undefined) {
            updates.push('price = ?');
            params.push(price);
        }
        if (enabled !== undefined) {
            updates.push('enabled = ?');
            params.push(enabled ? 1 : 0);
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        params.push(id);
        db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...params);

        const product = db.prepare(
            'SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?'
        ).get(id) as Product;

        return NextResponse.json(product);
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

        db.prepare('DELETE FROM products WHERE id = ?').run(parseInt(id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
