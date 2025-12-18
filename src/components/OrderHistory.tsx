'use client';

import { useState, useEffect } from 'react';
import { Order, OrderWithItems } from '@/types';
import { formatCurrency, formatDateTime, getTodayDate } from '@/lib/utils';

export default function OrderHistory() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
    const [filterDate, setFilterDate] = useState(getTodayDate());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrders();
    }, [filterDate]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/orders?date=${filterDate}`);
            const data = await response.json();
            setOrders(data);
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadOrderDetails = async (orderId: number) => {
        try {
            const response = await fetch(`/api/orders/${orderId}`);
            const data = await response.json();
            setSelectedOrder(data);
        } catch (error) {
            console.error('Error loading order details:', error);
        }
    };

    if (loading) {
        return (
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                    <div className="loader"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h1 style={{ marginBottom: 'var(--spacing-md)' }}>Order History</h1>

                {/* Date Filter */}
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                    <input
                        type="date"
                        className="input"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        style={{ maxWidth: '200px' }}
                    />
                    <button
                        className="btn btn-secondary"
                        onClick={() => setFilterDate(getTodayDate())}
                    >
                        Today
                    </button>
                    <div style={{ marginLeft: 'auto', color: 'var(--gray-700)' }}>
                        <strong>{orders.length}</strong> orders found
                    </div>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📋</div>
                    <p style={{ color: 'var(--gray-700)' }}>No orders found for this date</p>
                </div>
            ) : (
                <div className="grid grid-2">
                    {orders.map(order => (
                        <div
                            key={order.id}
                            className="card"
                            style={{ cursor: 'pointer' }}
                            onClick={() => loadOrderDetails(order.id)}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'start',
                                marginBottom: 'var(--spacing-md)'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)', marginBottom: 'var(--spacing-xs)' }}>
                                        Bill #
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                                        {order.bill_number}
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                                    {formatCurrency(order.total_amount)}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                                <span className={`badge ${order.order_type === 'dine-in' ? 'badge-primary' : 'badge-warning'}`}>
                                    {order.order_type === 'dine-in' ? '🍽️ Dine-in' : '📦 Takeaway'}
                                </span>
                                <span className="badge badge-success">
                                    {order.payment_mode === 'cash' ? '💵 Cash' : '📱 UPI'}
                                </span>
                            </div>

                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                                {formatDateTime(order.created_at)}
                            </div>

                            {order.notes && (
                                <div style={{
                                    marginTop: 'var(--spacing-md)',
                                    padding: 'var(--spacing-sm)',
                                    background: 'var(--gray-100)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.813rem',
                                    fontStyle: 'italic'
                                }}>
                                    {order.notes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-lg)' }}>
                            <div>
                                <h2 style={{ marginBottom: 'var(--spacing-xs)' }}>Order Details</h2>
                                <p style={{ color: 'var(--gray-700)', margin: 0 }}>Bill #{selectedOrder.bill_number}</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: 'var(--gray-700)'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{
                            background: 'var(--gray-50)',
                            padding: 'var(--spacing-lg)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--spacing-lg)'
                        }}>
                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                                <span className={`badge ${selectedOrder.order_type === 'dine-in' ? 'badge-primary' : 'badge-warning'}`}>
                                    {selectedOrder.order_type === 'dine-in' ? '🍽️ Dine-in' : '📦 Takeaway'}
                                </span>
                                <span className="badge badge-success">
                                    {selectedOrder.payment_mode === 'cash' ? '💵 Cash' : '📱 UPI'}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                                {formatDateTime(selectedOrder.created_at)}
                            </div>
                        </div>

                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Items</h3>
                            {selectedOrder.items.map((item, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: 'var(--spacing-md)',
                                        background: 'var(--gray-50)',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: 'var(--spacing-sm)'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                                            {formatCurrency(item.price_at_time)} × {item.quantity}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 600 }}>
                                        {formatCurrency(item.price_at_time * item.quantity)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {selectedOrder.notes && (
                            <div style={{
                                background: 'var(--gray-50)',
                                padding: 'var(--spacing-md)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--spacing-lg)',
                                fontSize: '0.875rem'
                            }}>
                                <strong>Note:</strong> {selectedOrder.notes}
                            </div>
                        )}

                        <div style={{
                            paddingTop: 'var(--spacing-lg)',
                            borderTop: '2px solid var(--gray-200)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>Total</span>
                            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                                {formatCurrency(selectedOrder.total_amount)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
