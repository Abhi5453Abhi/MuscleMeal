// Expense API - Update and Delete operations
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { Expense } from '@/types';
import { getNowISTISO } from '@/lib/utils';

// PUT - Update expense
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        const body = await request.json();
        const { description, amount, category, expense_date, notes } = body;

        if (!description || !amount || !expense_date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data: expense, error } = await supabase
            .from('expenses')
            .update({
                description,
                amount: parseFloat(amount),
                category: category || null,
                expense_date,
                notes: notes || null
            })
            .eq('id', id)
            .select()
            .single();

        if (error || !expense) {
            console.error('Error updating expense:', error);
            return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
        }

        return NextResponse.json(expense as Expense);
    } catch (error) {
        console.error('Error updating expense:', error);
        return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
    }
}

// DELETE - Delete expense
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting expense:', error);
            return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting expense:', error);
        return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
    }
}



