// Authentication API - Login endpoint
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { LoginRequest, LoginResponse } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body: LoginRequest = await request.json();
        const { username, pin } = body;

        if (!username || !pin) {
            return NextResponse.json(
                { success: false, message: 'Username and PIN are required' } as LoginResponse,
                { status: 400 }
            );
        }

        // Find user
        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, role')
            .eq('username', username)
            .eq('pin', pin)
            .single();

        if (error || !user) {
            return NextResponse.json(
                { success: false, message: 'Invalid credentials' } as LoginResponse,
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            user: user as { id: number; username: string; role: 'admin' | 'cashier' }
        } as LoginResponse);
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' } as LoginResponse,
            { status: 500 }
        );
    }
}
