'use client';

import { useState, useEffect } from 'react';
import { CartItem, Customer } from '@/types';
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

    // Customer info state
    const [phoneNumber, setPhoneNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isLookingUpCustomer, setIsLookingUpCustomer] = useState(false);
    const [useAdvance, setUseAdvance] = useState(false);
    const [advanceAmount, setAdvanceAmount] = useState(0);

    const getTotal = () => {
        return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    };

    const getFinalAmount = () => {
        const total = getTotal();
        const advanceToUse = useAdvance ? Math.min(advanceAmount, total) : 0;
        return total - advanceToUse;
    };

    // Lookup customer by phone number
    const handlePhoneNumberChange = async (phone: string) => {
        setPhoneNumber(phone);

        // Only lookup if phone number is complete (at least 10 digits)
        if (phone.length >= 10) {
            setIsLookingUpCustomer(true);
            try {
                const response = await fetch(`/api/customers?phone=${encodeURIComponent(phone)}`);
                const data = await response.json();

                if (data.customer) {
                    setCustomer(data.customer);
                    setCustomerName(data.customer.name);
                    setAdvanceAmount(data.customer.advance_balance);
                } else {
                    setCustomer(null);
                    setCustomerName('');
                    setAdvanceAmount(0);
                }
            } catch (error) {
                console.error('Error looking up customer:', error);
                setCustomer(null);
                setCustomerName('');
                setAdvanceAmount(0);
            } finally {
                setIsLookingUpCustomer(false);
            }
        } else {
            setCustomer(null);
            setCustomerName('');
            setAdvanceAmount(0);
        }
    };

    // Create new customer if not found
    const handleCreateCustomer = async () => {
        if (!phoneNumber || !customerName.trim()) {
            alert('Please enter phone number and customer name');
            return;
        }

        setIsLookingUpCustomer(true);
        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone_number: phoneNumber,
                    name: customerName.trim()
                })
            });

            if (response.ok) {
                const data = await response.json();
                setCustomer(data.customer);
                setAdvanceAmount(0);
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to create customer');
            }
        } catch (error) {
            console.error('Error creating customer:', error);
            alert('Error creating customer. Please try again.');
        } finally {
            setIsLookingUpCustomer(false);
        }
    };

    const handleCompleteOrder = async () => {
        // Validate customer info if phone number is provided
        if (phoneNumber && phoneNumber.length >= 10) {
            if (!customer && !customerName.trim()) {
                alert('Please enter customer name');
                return;
            }

            // If customer doesn't exist, create it first
            if (!customer && customerName.trim()) {
                await handleCreateCustomer();
                // Wait a bit for customer creation
                await new Promise(resolve => setTimeout(resolve, 500));
                // Re-fetch customer
                const response = await fetch(`/api/customers?phone=${encodeURIComponent(phoneNumber)}`);
                const data = await response.json();
                if (data.customer) {
                    setCustomer(data.customer);
                    setAdvanceAmount(data.customer.advance_balance);
                }
            }
        }

        setLoading(true);

        try {
            const total = getTotal();
            const advanceToUse = useAdvance && customer ? Math.min(advanceAmount, total) : 0;

            const orderData = {
                order_type: orderType,
                payment_mode: paymentMode,
                notes: notes || undefined,
                created_by: userId,
                customer_id: customer?.id || undefined,
                advance_used: advanceToUse,
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

                // Update local customer state if advance was used
                if (customer && advanceToUse > 0) {
                    setAdvanceAmount(customer.advance_balance - advanceToUse);
                }
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to create order. Please try again.');
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
                            marginBottom: 'var(--spacing-lg)',
                            flexWrap: 'wrap'
                        }}>
                            <span className={`badge ${orderType === 'dine-in' ? 'badge-primary' : 'badge-warning'}`}>
                                {orderType === 'dine-in' ? '🍽️ Dine-in' : '📦 Takeaway'}
                            </span>
                            <span className="badge badge-success">
                                {paymentMode === 'cash' ? '💵 Cash' : '📱 UPI'}
                            </span>
                            {completedOrder.advance_used && completedOrder.advance_used > 0 && (
                                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success-dark)' }}>
                                    💰 Advance Used: {formatCurrency(completedOrder.advance_used)}
                                </span>
                            )}
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

                        {customer && (
                            <div style={{
                                background: 'white',
                                padding: 'var(--spacing-md)',
                                borderRadius: 'var(--radius-sm)',
                                marginBottom: 'var(--spacing-md)',
                                fontSize: '0.875rem'
                            }}>
                                <strong>Customer:</strong> {customer.name}<br />
                                <strong>Phone:</strong> {customer.phone_number}
                            </div>
                        )}

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
                            {completedOrder.advance_used > 0 && (
                                <>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: 'var(--spacing-sm)',
                                        fontSize: '1rem'
                                    }}>
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(completedOrder.total_amount + completedOrder.advance_used)}</span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: 'var(--spacing-sm)',
                                        fontSize: '1rem',
                                        color: 'var(--success)'
                                    }}>
                                        <span>Advance Used</span>
                                        <span>-{formatCurrency(completedOrder.advance_used)}</span>
                                    </div>
                                </>
                            )}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: completedOrder.advance_used > 0 ? 'var(--spacing-sm)' : 0
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
                        paddingTop: 'var(--spacing-md)',
                        marginTop: 'var(--spacing-md)',
                        borderTop: '2px solid var(--gray-300)'
                    }}>
                        {useAdvance && customer && customer.advance_balance > 0 && (
                            <>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: 'var(--spacing-sm)',
                                    fontSize: '0.938rem'
                                }}>
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(getTotal())}</span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: 'var(--spacing-sm)',
                                    fontSize: '0.938rem',
                                    color: 'var(--success)'
                                }}>
                                    <span>Advance Used</span>
                                    <span>-{formatCurrency(Math.min(customer.advance_balance, getTotal()))}</span>
                                </div>
                            </>
                        )}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '1.125rem',
                            fontWeight: 700
                        }}>
                            <span>Total</span>
                            <span style={{ color: 'var(--primary)' }}>{formatCurrency(getFinalAmount())}</span>
                        </div>
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

                {/* Customer Information */}
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                        Customer Phone Number <span style={{ color: 'var(--gray-500)', fontWeight: 'normal' }}>(Optional)</span>
                    </label>
                    <input
                        type="tel"
                        className="input"
                        placeholder="Enter phone number"
                        value={phoneNumber}
                        onChange={(e) => handlePhoneNumberChange(e.target.value)}
                        disabled={loading || isLookingUpCustomer}
                        style={{ marginBottom: 'var(--spacing-sm)' }}
                    />
                    {isLookingUpCustomer && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-sm)' }}>
                            Looking up customer...
                        </div>
                    )}

                    {phoneNumber.length >= 10 && (
                        <>
                            {customer ? (
                                <div style={{
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    padding: 'var(--spacing-md)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--spacing-sm)'
                                }}>
                                    <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)', color: 'var(--success-dark)' }}>
                                        Customer: {customer.name}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                                        Advance Balance: {formatCurrency(customer.advance_balance)}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                    <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                        Customer Name
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Enter customer name"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            )}

                            {customer && customer.advance_balance > 0 && (
                                <div style={{
                                    background: 'var(--gray-50)',
                                    padding: 'var(--spacing-md)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--spacing-sm)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                                        <input
                                            type="checkbox"
                                            id="useAdvance"
                                            checked={useAdvance}
                                            onChange={(e) => setUseAdvance(e.target.checked)}
                                            disabled={loading}
                                            style={{ marginRight: 'var(--spacing-sm)' }}
                                        />
                                        <label htmlFor="useAdvance" style={{ cursor: 'pointer', fontWeight: 500 }}>
                                            Use Advance Balance
                                        </label>
                                    </div>
                                    {useAdvance && (
                                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                                            Available: {formatCurrency(customer.advance_balance)}<br />
                                            Will use: {formatCurrency(Math.min(customer.advance_balance, getTotal()))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
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
                        {loading ? 'Processing...' : `Complete Order - ${formatCurrency(getFinalAmount())}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
