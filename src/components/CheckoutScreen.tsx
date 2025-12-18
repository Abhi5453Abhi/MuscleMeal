'use client';

import { useState } from 'react';
import { CartItem } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface CheckoutScreenProps {
    cart: CartItem[];
    orderType: 'dine-in' | 'takeaway';
    notes: string;
    userId: number;
    onComplete: () => void;
    onBack: () => void;
}

export default function CheckoutScreen({
    cart,
    orderType,
    notes,
    userId,
    onComplete,
    onBack
}: CheckoutScreenProps) {
    const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('cash');
    const [loading, setLoading] = useState(false);
    const [completedOrder, setCompletedOrder] = useState<any>(null);

    const getTotal = () => {
        return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    };

    const handleCompleteOrder = async () => {
        setLoading(true);

        try {
            const orderData = {
                order_type: orderType,
                payment_mode: paymentMode,
                notes: notes || undefined,
                created_by: userId,
                items: cart.map(item => ({
                    product_id: item.product.id,
                    product_name: item.product.name,
                    quantity: item.quantity,
                    price: item.product.price
                }))
            };

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const order = await response.json();
                setCompletedOrder(order);
            } else {
                alert('Failed to create order. Please try again.');
            }
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Error creating order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrintAndNew = () => {
        window.print();
        onComplete();
    };

    if (completedOrder) {
        return (
            <div style={{ 
                maxWidth: '600px', 
                margin: '0 auto',
                padding: 'var(--spacing-md)',
                paddingBottom: 'var(--spacing-xl)',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box'
            }}>
                <div className="card" style={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    marginBottom: 'var(--spacing-lg)',
                    overflow: 'visible'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>✅</div>
                        <h1 style={{ color: 'var(--success)', marginBottom: 'var(--spacing-sm)' }}>
                            Order Complete!
                        </h1>
                        <p style={{ color: 'var(--gray-700)' }}>Bill #{completedOrder.bill_number}</p>
                    </div>

                    {/* Bill Details */}
                    <div style={{
                        background: 'var(--gray-50)',
                        padding: 'var(--spacing-lg)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--spacing-lg)'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <h2 style={{ margin: 0, color: 'var(--primary)' }}>💪 MuscleMeal</h2>
                            <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', margin: '0.25rem 0' }}>
                                Madanjit Kothi Road, Near Aatta Chaki, Sangrur
                            </p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', margin: 0 }}>
                                M. 97803-02591
                            </p>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 'var(--spacing-md)',
                            paddingBottom: 'var(--spacing-md)',
                            borderBottom: '1px dashed var(--gray-300)'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>Bill #</div>
                                <div style={{ fontWeight: 600 }}>{completedOrder.bill_number}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>Date & Time</div>
                                <div style={{ fontWeight: 600 }}>{formatDateTime(completedOrder.created_at)}</div>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: 'var(--spacing-md)',
                            marginBottom: 'var(--spacing-lg)'
                        }}>
                            <span className={`badge ${orderType === 'dine-in' ? 'badge-primary' : 'badge-warning'}`}>
                                {orderType === 'dine-in' ? '🍽️ Dine-in' : '📦 Takeaway'}
                            </span>
                            <span className="badge badge-success">
                                {paymentMode === 'cash' ? '💵 Cash' : '📱 UPI'}
                            </span>
                        </div>

                        {/* Items */}
                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <table style={{ width: '100%', fontSize: '0.938rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--gray-300)' }}>
                                        <th style={{ textAlign: 'left', padding: 'var(--spacing-sm) 0' }}>Item</th>
                                        <th style={{ textAlign: 'center', padding: 'var(--spacing-sm) 0' }}>Qty</th>
                                        <th style={{ textAlign: 'right', padding: 'var(--spacing-sm) 0' }}>Price</th>
                                        <th style={{ textAlign: 'right', padding: 'var(--spacing-sm) 0' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map((item, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                                            <td style={{ padding: 'var(--spacing-sm) 0' }}>{item.product.name}</td>
                                            <td style={{ textAlign: 'center', padding: 'var(--spacing-sm) 0' }}>{item.quantity}</td>
                                            <td style={{ textAlign: 'right', padding: 'var(--spacing-sm) 0' }}>
                                                {formatCurrency(item.product.price)}
                                            </td>
                                            <td style={{ textAlign: 'right', padding: 'var(--spacing-sm) 0', fontWeight: 600 }}>
                                                {formatCurrency(item.product.price * item.quantity)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {notes && (
                            <div style={{
                                background: 'white',
                                padding: 'var(--spacing-md)',
                                borderRadius: 'var(--radius-sm)',
                                marginBottom: 'var(--spacing-lg)',
                                fontSize: '0.875rem'
                            }}>
                                <strong>Note:</strong> {notes}
                            </div>
                        )}

                        <div style={{
                            paddingTop: 'var(--spacing-lg)',
                            borderTop: '2px solid var(--gray-300)'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>Total Amount</span>
                                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                                    {formatCurrency(completedOrder.total_amount)}
                                </span>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                            Thank you for your order! 💪
                        </div>
                    </div>

                    <div style={{ 
                        display: 'flex', 
                        gap: 'var(--spacing-md)',
                        marginTop: 'auto',
                        paddingTop: 'var(--spacing-lg)',
                        flexShrink: 0
                    }}>
                        <button
                            className="btn btn-primary btn-lg"
                            style={{ flex: 1 }}
                            onClick={handlePrintAndNew}
                        >
                            🖨️ Print & New Order
                        </button>
                        <button
                            className="btn btn-secondary btn-lg"
                            style={{ flex: 1 }}
                            onClick={onComplete}
                        >
                            New Order
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '600px' }}>
            <div className="card">
                <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Checkout</h2>

                {/* Order Summary */}
                <div style={{
                    background: 'var(--gray-50)',
                    padding: 'var(--spacing-lg)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--spacing-lg)'
                }}>
                    <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Order Summary</h3>
                    {cart.map((item, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 'var(--spacing-sm)',
                            fontSize: '0.938rem'
                        }}>
                            <span>
                                {item.product.name} × {item.quantity}
                            </span>
                            <span style={{ fontWeight: 600 }}>
                                {formatCurrency(item.product.price * item.quantity)}
                            </span>
                        </div>
                    ))}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: 'var(--spacing-md)',
                        marginTop: 'var(--spacing-md)',
                        borderTop: '2px solid var(--gray-300)',
                        fontSize: '1.125rem',
                        fontWeight: 700
                    }}>
                        <span>Total</span>
                        <span style={{ color: 'var(--primary)' }}>{formatCurrency(getTotal())}</span>
                    </div>
                </div>

                {/* Order Type */}
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                        Order Type
                    </label>
                    <span className={`badge ${orderType === 'dine-in' ? 'badge-primary' : 'badge-warning'}`}>
                        {orderType === 'dine-in' ? '🍽️ Dine-in' : '📦 Takeaway'}
                    </span>
                </div>

                {/* Payment Mode */}
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                        Payment Mode
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                        <button
                            className={`btn btn-lg ${paymentMode === 'cash' ? 'btn-success' : 'btn-outline'}`}
                            onClick={() => setPaymentMode('cash')}
                            style={{ height: '80px', fontSize: '1.125rem' }}
                        >
                            💵<br />Cash
                        </button>
                        <button
                            className={`btn btn-lg ${paymentMode === 'upi' ? 'btn-success' : 'btn-outline'}`}
                            onClick={() => setPaymentMode('upi')}
                            style={{ height: '80px', fontSize: '1.125rem' }}
                        >
                            📱<br />UPI
                        </button>
                    </div>
                </div>

                {/* Notes */}
                {notes && (
                    <div style={{
                        background: 'var(--gray-50)',
                        padding: 'var(--spacing-md)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--spacing-lg)',
                        fontSize: '0.875rem'
                    }}>
                        <strong>Note:</strong> {notes}
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                    <button
                        className="btn btn-secondary btn-lg"
                        onClick={onBack}
                        disabled={loading}
                    >
                        ← Back
                    </button>
                    <button
                        className="btn btn-success btn-lg"
                        style={{ flex: 1 }}
                        onClick={handleCompleteOrder}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : `Complete Order - ${formatCurrency(getTotal())}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
