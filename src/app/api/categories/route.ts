// Categories API
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Category } from '@/types';

export async function GET() {
    try {
        const categories = db.prepare('SELECT * FROM categories ORDER BY display_order').all() as Category[];
        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}
