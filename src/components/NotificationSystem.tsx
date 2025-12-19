'use client';

import { useEffect, useState, useRef } from 'react';
import { OrderNotification } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { supabase } from '@/lib/db';

interface NotificationSystemProps {
    onNewOrder?: (order: OrderNotification) => void;
}

interface NotificationWithId extends OrderNotification {
    uniqueId: string;
}

export default function NotificationSystem({ onNewOrder }: NotificationSystemProps) {
    const [notifications, setNotifications] = useState<NotificationWithId[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);
    const supabaseChannelRef = useRef<any>(null);
    const notificationIdsRef = useRef<Set<string>>(new Set());

    // Helper function to handle new notification
    const handleNewNotification = (notification: OrderNotification) => {
        // Create a unique identifier for this notification
        const notificationKey = `${notification.order.id}-${notification.timestamp}`;
        
        // Prevent duplicate notifications (same order ID + timestamp)
        if (notificationIdsRef.current.has(notificationKey)) {
            console.log('[NotificationSystem] Duplicate notification ignored:', notification.order.bill_number);
            return;
        }

        console.log('[NotificationSystem] Processing new notification:', notification.order.bill_number);
        
        // Generate a unique ID for React key (includes timestamp and random component)
        const uniqueId = `${notificationKey}-${Date.now()}-${Math.random()}`;
        const notificationWithId: NotificationWithId = {
            ...notification,
            uniqueId
        };
        
        notificationIdsRef.current.add(notificationKey);
        setNotifications((prev) => {
            const updated = [notificationWithId, ...prev].slice(0, 10); // Keep last 10
            // Clean up old notification IDs to prevent memory leak
            if (updated.length < prev.length) {
                const currentKeys = new Set(updated.map(n => `${n.order.id}-${n.timestamp}`));
                notificationIdsRef.current = currentKeys;
            }
            return updated;
        });
        
        // Call callback if provided
        if (onNewOrder) {
            onNewOrder(notification);
        }

        // Show browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Order Completed', {
                body: notification.message,
                icon: '/favicon.ico',
                tag: `order-${notification.order.id}`,
            });
        }
    };

    useEffect(() => {
        // Create SSE connection (for same-instance notifications)
        const eventSource = new EventSource('/api/notifications');
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            setIsConnected(true);
            console.log('[NotificationSystem] SSE connection opened');
        };

        eventSource.onmessage = (event) => {
            try {
                console.log('[NotificationSystem] Received message:', event.data);
                const data = JSON.parse(event.data);
                
                if (data.type === 'connected') {
                    console.log('[NotificationSystem] Connected to notification stream');
                    return;
                }

                if (data.type === 'order_completed') {
                    console.log('[NotificationSystem] Order completed notification received via SSE:', data.order.bill_number);
                    handleNewNotification(data);
                }
            } catch (error) {
                console.error('[NotificationSystem] Error parsing notification:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('[NotificationSystem] SSE connection error:', error);
            console.error('[NotificationSystem] EventSource readyState:', eventSource.readyState);
            setIsConnected(false);
            
            // EventSource will automatically attempt to reconnect
            // But we can also manually handle it if needed
            if (eventSource.readyState === EventSource.CLOSED) {
                console.log('[NotificationSystem] Connection closed, will attempt reconnect');
            }
        };

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Set up Supabase Realtime subscription (for cross-instance notifications)
        const channel = supabase
            .channel('order-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'order_notifications'
                },
                (payload) => {
                    console.log('[NotificationSystem] New notification via Supabase Realtime:', payload.new);
                    const notificationData = (payload.new as any).notification_data;
                    if (notificationData && notificationData.type === 'order_completed') {
                        handleNewNotification(notificationData as OrderNotification);
                    }
                }
            )
            .subscribe((status) => {
                console.log('[NotificationSystem] Supabase Realtime status:', status);
                setIsSupabaseConnected(status === 'SUBSCRIBED');
            });

        supabaseChannelRef.current = channel;

        return () => {
            eventSource.close();
            eventSourceRef.current = null;
            if (supabaseChannelRef.current) {
                supabase.removeChannel(supabaseChannelRef.current);
                supabaseChannelRef.current = null;
            }
        };
    }, [onNewOrder]);

    const dismissNotification = (index: number) => {
        setNotifications((prev) => prev.filter((_, i) => i !== index));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    if (notifications.length === 0) {
        return (
            <div style={{
                position: 'fixed',
                top: 'var(--spacing-md)',
                right: 'var(--spacing-md)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                background: (isConnected || isSupabaseConnected) ? 'var(--success)' : 'var(--gray-500)',
                color: 'white',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                boxShadow: 'var(--shadow-md)'
            }}>
                <span>{(isConnected || isSupabaseConnected) ? '🟢' : '🔴'}</span>
                <span>
                    {(isConnected || isSupabaseConnected) ? 'Connected' : 'Disconnected'}
                    {isConnected && isSupabaseConnected && ' (Both)'}
                    {isConnected && !isSupabaseConnected && ' (SSE)'}
                    {!isConnected && isSupabaseConnected && ' (Realtime)'}
                </span>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            top: 'var(--spacing-md)',
            right: 'var(--spacing-md)',
            zIndex: 1000,
            maxWidth: '400px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-sm)'
        }}>
            {/* Connection Status */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                background: (isConnected || isSupabaseConnected) ? 'var(--success)' : 'var(--gray-500)',
                color: 'white',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                boxShadow: 'var(--shadow-md)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <span>{(isConnected || isSupabaseConnected) ? '🟢' : '🔴'}</span>
                    <span>
                        {(isConnected || isSupabaseConnected) ? 'Connected' : 'Disconnected'}
                        {isConnected && isSupabaseConnected && ' (Both)'}
                        {isConnected && !isSupabaseConnected && ' (SSE)'}
                        {!isConnected && isSupabaseConnected && ' (Realtime)'}
                    </span>
                </div>
                {notifications.length > 0 && (
                    <button
                        onClick={clearAll}
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                        }}
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Notifications */}
            {notifications.map((notification, index) => (
                <div
                    key={notification.uniqueId}
                    style={{
                        background: 'white',
                        border: '2px solid var(--primary)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--spacing-md)',
                        boxShadow: 'var(--shadow-lg)',
                        animation: 'slideIn 0.3s ease-out',
                        position: 'relative'
                    }}
                >
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 'var(--spacing-sm)'
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                                marginBottom: 'var(--spacing-xs)'
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>🔔</span>
                                <strong style={{ color: 'var(--primary)' }}>
                                    New Order Completed
                                </strong>
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)', marginLeft: '2rem' }}>
                                {formatDateTime(notification.timestamp)}
                            </div>
                        </div>
                        <button
                            onClick={() => dismissNotification(index)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                fontSize: '1.25rem',
                                cursor: 'pointer',
                                color: 'var(--gray-500)',
                                padding: 'var(--spacing-xs)',
                                lineHeight: 1
                            }}
                        >
                            ×
                        </button>
                    </div>

                    <div style={{
                        background: 'var(--gray-50)',
                        padding: 'var(--spacing-md)',
                        borderRadius: 'var(--radius-sm)',
                        marginTop: 'var(--spacing-sm)'
                    }}>
                        <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                            <strong>Bill #:</strong> {notification.order.bill_number}
                        </div>
                        <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                            <strong>Type:</strong> {notification.order.order_type === 'dine-in' ? '🍽️ Dine-in' : '📦 Takeaway'}
                        </div>
                        <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                            <strong>Payment:</strong> {notification.order.payment_mode === 'cash' ? '💵 Cash' : '📱 UPI'}
                        </div>
                        <div style={{
                            marginTop: 'var(--spacing-sm)',
                            paddingTop: 'var(--spacing-sm)',
                            borderTop: '1px solid var(--gray-300)',
                            fontSize: '1.125rem',
                            fontWeight: 700,
                            color: 'var(--primary)'
                        }}>
                            Total: {formatCurrency(notification.order.total_amount)}
                        </div>
                        {notification.order.items && notification.order.items.length > 0 && (
                            <div style={{
                                marginTop: 'var(--spacing-sm)',
                                paddingTop: 'var(--spacing-sm)',
                                borderTop: '1px solid var(--gray-300)',
                                fontSize: '0.875rem'
                            }}>
                                <strong>Items:</strong>
                                <ul style={{ margin: 'var(--spacing-xs) 0 0 0', paddingLeft: 'var(--spacing-md)' }}>
                                    {notification.order.items.slice(0, 3).map((item, idx) => (
                                        <li key={idx}>
                                            {item.product_name} × {item.quantity}
                                        </li>
                                    ))}
                                    {notification.order.items.length > 3 && (
                                        <li style={{ color: 'var(--gray-600)' }}>
                                            +{notification.order.items.length - 3} more items
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

