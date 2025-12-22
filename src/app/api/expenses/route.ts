// Expenses API - CRUD operations
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { Expense } from '@/types';
import { getDayBounds, getNowISTISO } from '@/lib/utils';

// GET - Fetch expenses with optional date filtering
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const category = searchParams.get('category');

        let query = supabase
            .from('expenses')
            .select('*')
            .order('expense_date', { ascending: false })
            .order('created_at', { ascending: false });

        // Date filtering - use date range if provided, otherwise use single date
        if (startDate && endDate) {
            query = query.gte('expense_date', startDate).lte('expense_date', endDate);
        } else if (date) {
            query = query.eq('expense_date', date);
        }

        // Category filtering
        if (category) {
            query = query.eq('category', category);
        }

        const { data: expenses, error } = await query;

        if (error) {
            console.error('Error fetching expenses:', error);
            return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
        }

        return NextResponse.json(expenses as Expense[]);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }
}

// POST - Create new expense
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { description, amount, category, expense_date, notes, created_by } = body;

        if (!description || !amount || !expense_date || !created_by) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data: expense, error } = await supabase
            .from('expenses')
            .insert({
                description,
                amount: parseFloat(amount),
                category: category || null,
                expense_date,
                notes: notes || null,
                created_by: parseInt(created_by),
                created_at: getNowISTISO()
            })
            .select()
            .single();

        if (error || !expense) {
            console.error('Error creating expense:', error);
            return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
        }

        return NextResponse.json(expense as Expense, { status: 201 });
    } catch (error) {
        console.error('Error creating expense:', error);
        return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }
}



