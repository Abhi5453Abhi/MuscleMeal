// Inventory Notifications API
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { InventoryNotification } from '@/types';
import { broadcastNotification } from '@/lib/notifications';

// GET - Get low stock notifications
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const unacknowledgedOnly = searchParams.get('unacknowledgedOnly') === 'true';

        let query = supabase
            .from('inventory_notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (unacknowledgedOnly) {
            query = query.eq('acknowledged', false);
        }

        const { data: notifications, error } = await query;

        if (error) {
            console.error('Error fetching inventory notifications:', error);
            return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
        }

        return NextResponse.json(notifications || []);
    } catch (error) {
        console.error('Error fetching inventory notifications:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

// POST - Acknowledge notification
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { notification_id, acknowledged_by } = body;

        if (!notification_id) {
            return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
        }

        const { data: notification, error } = await supabase
            .from('inventory_notifications')
            .update({
                acknowledged: true,
                acknowledged_by: acknowledged_by ? parseInt(acknowledged_by) : null,
                acknowledged_at: new Date().toISOString()
            })
            .eq('id', parseInt(notification_id))
            .select()
            .single();

        if (error) {
            console.error('Error acknowledging notification:', error);
            return NextResponse.json({ error: 'Failed to acknowledge notification' }, { status: 500 });
        }

        return NextResponse.json(notification);
    } catch (error) {
        console.error('Error acknowledging notification:', error);
        return NextResponse.json({ error: 'Failed to acknowledge notification' }, { status: 500 });
    }
}

