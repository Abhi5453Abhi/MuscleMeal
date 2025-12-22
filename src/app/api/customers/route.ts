// Customers API - Lookup, create and manage customers
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { Customer } from '@/types';

// GET - Lookup customer by phone number or get all customers
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');

        if (phone) {
            // Lookup customer by phone number
            const { data: customer, error } = await supabase
                .from('customers')
                .select('*')
                .eq('phone_number', phone)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No customer found
                    return NextResponse.json({ customer: null }, { status: 200 });
                }
                console.error('Error fetching customer:', error);
                return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
            }

            return NextResponse.json({ customer: customer as Customer });
        } else {
            // Get all customers (for admin purposes)
            const { data: customers, error } = await supabase
                .from('customers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching customers:', error);
                return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
            }

            return NextResponse.json({ customers: customers as Customer[] });
        }
    } catch (error) {
        console.error('Error in GET customers:', error);
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
}

// POST - Create new customer
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone_number, name } = body;

        if (!phone_number || !name) {
            return NextResponse.json({ error: 'Phone number and name are required' }, { status: 400 });
        }

        // Check if customer already exists
        const { data: existingCustomer } = await supabase
            .from('customers')
            .select('*')
            .eq('phone_number', phone_number)
            .single();

        if (existingCustomer) {
            return NextResponse.json({ error: 'Customer with this phone number already exists' }, { status: 400 });
        }

        // Create new customer
        const { data: customer, error } = await supabase
            .from('customers')
            .insert({
                phone_number,
                name,
                advance_balance: 0
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating customer:', error);
            return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
        }

        return NextResponse.json({ customer: customer as Customer }, { status: 201 });
    } catch (error) {
        console.error('Error in POST customers:', error);
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }
}

// PATCH - Update customer (mainly for advance balance)
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, advance_balance } = body;

        if (!id) {
            return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
        }

        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        if (name !== undefined) {
            updateData.name = name;
        }

        if (advance_balance !== undefined) {
            updateData.advance_balance = advance_balance;
        }

        const { data: customer, error } = await supabase
            .from('customers')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating customer:', error);
            return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
        }

        return NextResponse.json({ customer: customer as Customer });
    } catch (error) {
        console.error('Error in PATCH customers:', error);
        return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }
}



