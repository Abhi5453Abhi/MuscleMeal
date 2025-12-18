// Categories API
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { Category } from '@/types';

export async function GET() {
    try {
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*')
            .order('display_order');

        if (error) {
            console.error('Error fetching categories:', error);
            return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
        }

        return NextResponse.json(categories as Category[]);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}
