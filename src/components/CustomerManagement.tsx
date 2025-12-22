'use client';

import { useState, useEffect } from 'react';
import { Customer, Order, OrderWithItems } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface CustomerStats {
    totalSpent: number;
    totalOrders: number;
    mostOrderedItems: Array<{
        name: string;
        quantity: number;
        revenue: number;
    }>;
}

export default function CustomerManagement() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customerStats, setCustomerStats] = useState<Map<number, CustomerStats>>(new Map());
    const [showAdvanceModal, setShowAdvanceModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showOrderHistory, setShowOrderHistory] = useState(false);
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingStats, setLoadingStats] = useState(false);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [amountInput, setAmountInput] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [addingCustomer, setAddingCustomer] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, []);

    useEffect(() => {
        if (customers.length > 0) {
            loadAllCustomerStats();
        }
    }, [customers]);

    // Refresh stats when component becomes visible (user might have created new orders)
    useEffect(() => {
        const handleFocus = () => {
            if (customers.length > 0) {
                loadAllCustomerStats();
            }
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [customers]);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/customers');
            if (response.ok) {
                const data = await response.json();
                setCustomers(data.customers || []);
            } else {
                console.error('Error loading customers');
            }
        } catch (error) {
            console.error('Error loading customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAllCustomerStats = async () => {
        setLoadingStats(true);
        const statsMap = new Map<number, CustomerStats>();
        
        try {
            await Promise.all(
                customers.map(async (customer) => {
                    try {
                        const response = await fetch(`/api/customers/${customer.id}/stats`);
                        if (response.ok) {
                            const stats = await response.json();
                            statsMap.set(customer.id, stats);
                        }
                    } catch (error) {
                        console.error(`Error loading stats for customer ${customer.id}:`, error);
                        statsMap.set(customer.id, { totalSpent: 0, totalOrders: 0, mostOrderedItems: [] });
                    }
                })
            );
            setCustomerStats(statsMap);
        } catch (error) {
            console.error('Error loading customer stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    const loadCustomerOrders = async (customerId: number) => {
        setLoadingOrders(true);
        try {
            const response = await fetch(`/api/orders?customerId=${customerId}`);
            if (response.ok) {
                const orders = await response.json();
                setCustomerOrders(orders || []);
                // Refresh stats after loading orders
                if (selectedCustomer) {
                    await refreshCustomerStats(selectedCustomer.id);
                }
            } else {
                console.error('Error loading customer orders');
            }
        } catch (error) {
            console.error('Error loading customer orders:', error);
        } finally {
            setLoadingOrders(false);
        }
    };

    const refreshCustomerStats = async (customerId: number) => {
        try {
            const response = await fetch(`/api/customers/${customerId}/stats`);
            if (response.ok) {
                const stats = await response.json();
                setCustomerStats(prev => {
                    const newMap = new Map(prev);
                    newMap.set(customerId, stats);
                    return newMap;
                });
            }
        } catch (error) {
            console.error(`Error refreshing stats for customer ${customerId}:`, error);
        }
    };

    const openCustomerDetail = async (customer: Customer) => {
        setSelectedCustomer(customer);
        setShowDetailModal(true);
        setShowOrderHistory(false);
        await loadCustomerOrders(customer.id);
    };

    const openAddAdvanceModal = (customer: Customer, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        setSelectedCustomer(customer);
        setAmountInput('');
        setNotes('');
        setShowAdvanceModal(true);
    };

    const handleAddAdvance = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCustomer) return;

        const amount = parseFloat(amountInput) || 0;
        if (amount <= 0) {
            alert('Please enter a valid amount greater than 0');
            return;
        }

        try {
            const newBalance = selectedCustomer.advance_balance + amount;
            const response = await fetch('/api/customers', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedCustomer.id,
                    advance_balance: newBalance
                })
            });

            if (response.ok) {
                await loadCustomers();
                setShowAdvanceModal(false);
                setAmountInput('');
                setNotes('');
                alert(`Successfully added ${formatCurrency(amount)} to ${selectedCustomer.name}'s advance balance`);
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to add advance payment');
            }
        } catch (error) {
            console.error('Error adding advance payment:', error);
            alert('Failed to add advance payment');
        }
    };

    const handleShowOrderHistory = async () => {
        if (selectedCustomer) {
            setShowOrderHistory(true);
            await loadCustomerOrders(selectedCustomer.id);
        }
    };

    const handleAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
            alert('Please enter both name and phone number');
            return;
        }

        // Basic phone number validation
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(newCustomerPhone.trim())) {
            alert('Please enter a valid 10-digit phone number');
            return;
        }

        setAddingCustomer(true);
        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newCustomerName.trim(),
                    phone_number: newCustomerPhone.trim()
                })
            });

            if (response.ok) {
                await loadCustomers();
                setShowAddCustomerModal(false);
                setNewCustomerName('');
                setNewCustomerPhone('');
                alert(`Successfully added customer: ${newCustomerName.trim()}`);
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to add customer');
            }
        } catch (error) {
            console.error('Error adding customer:', error);
            alert('Failed to add customer');
        } finally {
            setAddingCustomer(false);
        }
    };

    const filteredCustomers = customers.filter(customer => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            customer.name.toLowerCase().includes(query) ||
            customer.phone_number.includes(query)
        );
    });

    const getTotalAdvance = () => {
        return customers.reduce((sum, customer) => sum + customer.advance_balance, 0);
    };

    const getCustomerStats = (customerId: number): CustomerStats => {
        return customerStats.get(customerId) || { totalSpent: 0, totalOrders: 0, mostOrderedItems: [] };
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="container">
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                    <h1>👥 Customer Management</h1>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setShowAddCustomerModal(true);
                            setNewCustomerName('');
                            setNewCustomerPhone('');
                        }}
                    >
                        + Add Customer
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-3" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-xs)' }}>
                            Total Customers
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {customers.length}
                        </div>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-xs)' }}>
                            Total Advance Balance
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>
                            {formatCurrency(getTotalAdvance())}
                        </div>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-xs)' }}>
                            Customers with Advance
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {customers.filter(c => c.advance_balance > 0).length}
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="card" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
                    <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                        Search Customers (by name or phone number)
                    </label>
                    <input
                        type="text"
                        className="input"
                        placeholder="Search by name or phone number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Customers List */}
                <div className="card">
                    <h2 style={{ marginBottom: 'var(--spacing-md)' }}>All Customers</h2>
                    
                    {filteredCustomers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--gray-600)' }}>
                            {searchQuery ? 'No customers found matching your search' : 'No customers registered yet'}
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                                        <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Name</th>
                                        <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Phone Number</th>
                                        <th style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>Advance Balance</th>
                                        <th style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>Total Spent</th>
                                        <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Registered</th>
                                        <th style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCustomers.map(customer => {
                                        const stats = getCustomerStats(customer.id);
                                        return (
                                            <tr 
                                                key={customer.id} 
                                                style={{ 
                                                    borderBottom: '1px solid var(--gray-200)',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onClick={() => openCustomerDetail(customer)}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                            >
                                                <td style={{ padding: 'var(--spacing-md)' }}>
                                                    <div style={{ fontWeight: 500 }}>{customer.name}</div>
                                                </td>
                                                <td style={{ padding: 'var(--spacing-md)' }}>
                                                    <div style={{ fontSize: '0.938rem' }}>{customer.phone_number}</div>
                                                </td>
                                                <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                                                    <div style={{ 
                                                        fontWeight: 600, 
                                                        color: customer.advance_balance > 0 ? 'var(--success)' : 'var(--gray-600)',
                                                        fontSize: '1.125rem'
                                                    }}>
                                                        {formatCurrency(customer.advance_balance)}
                                                    </div>
                                                </td>
                                                <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                                                    {loadingStats ? (
                                                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>Loading...</div>
                                                    ) : (
                                                        <div style={{ 
                                                            fontWeight: 600, 
                                                            color: 'var(--primary)',
                                                            fontSize: '1.125rem'
                                                        }}>
                                                            {formatCurrency(stats.totalSpent)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                                                    {formatDateTime(customer.created_at)}
                                                </td>
                                                <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={(e) => openAddAdvanceModal(customer, e)}
                                                    >
                                                        + Add Advance
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Customer Detail Modal */}
            {showDetailModal && selectedCustomer && (
                <div className="modal-overlay" onClick={() => { setShowDetailModal(false); setShowOrderHistory(false); }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <h2>Customer Details: {selectedCustomer.name}</h2>
                            <button
                                onClick={() => { setShowDetailModal(false); setShowOrderHistory(false); }}
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

                        {!showOrderHistory ? (
                            <>
                                {/* Customer Info */}
                                <div style={{ 
                                    background: 'var(--gray-50)', 
                                    padding: 'var(--spacing-lg)', 
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--spacing-lg)'
                                }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                                        <div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-xs)' }}>
                                                Phone Number
                                            </div>
                                            <div style={{ fontWeight: 600 }}>{selectedCustomer.phone_number}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-xs)' }}>
                                                Advance Balance
                                            </div>
                                            <div style={{ fontWeight: 600, color: 'var(--success)', fontSize: '1.125rem' }}>
                                                {formatCurrency(selectedCustomer.advance_balance)}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-xs)' }}>
                                                Total Spent
                                            </div>
                                            <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '1.125rem' }}>
                                                {formatCurrency(getCustomerStats(selectedCustomer.id).totalSpent)}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-xs)' }}>
                                                Total Orders
                                            </div>
                                            <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                                                {getCustomerStats(selectedCustomer.id).totalOrders}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Most Ordered Items Card */}
                                {getCustomerStats(selectedCustomer.id).mostOrderedItems.length > 0 && (
                                    <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                                        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Most Ordered Items</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                            {getCustomerStats(selectedCustomer.id).mostOrderedItems.map((item, index) => (
                                                <div 
                                                    key={index}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: 'var(--spacing-md)',
                                                        background: 'var(--gray-50)',
                                                        borderRadius: 'var(--radius-md)'
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                                                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                                                            Ordered {item.quantity} time{item.quantity !== 1 ? 's' : ''}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                                            {formatCurrency(item.revenue)}
                                                        </div>
                                                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                                                            Total Revenue
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Order History Button */}
                                <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => { setShowDetailModal(false); setShowOrderHistory(false); }}
                                    >
                                        Close
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleShowOrderHistory}
                                    >
                                        📋 View Order History
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Order History View */}
                                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setShowOrderHistory(false)}
                                        style={{ marginBottom: 'var(--spacing-md)' }}
                                    >
                                        ← Back to Details
                                    </button>
                                    <h3>Order History</h3>
                                </div>

                                {loadingOrders ? (
                                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                                        <div className="loader"></div>
                                    </div>
                                ) : customerOrders.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--gray-600)' }}>
                                        No orders found for this customer
                                    </div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Bill #</th>
                                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Date & Time</th>
                                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Type</th>
                                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Payment</th>
                                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>Amount</th>
                                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>Advance Used</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {customerOrders.map(order => (
                                                    <tr key={order.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                                                        <td style={{ padding: 'var(--spacing-md)', fontWeight: 600 }}>
                                                            {order.bill_number}
                                                        </td>
                                                        <td style={{ padding: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                                                            {formatDateTime(order.created_at)}
                                                        </td>
                                                        <td style={{ padding: 'var(--spacing-md)' }}>
                                                            <span className={`badge ${order.order_type === 'dine-in' ? 'badge-primary' : 'badge-warning'}`}>
                                                                {order.order_type === 'dine-in' ? '🍽️ Dine-in' : '📦 Takeaway'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: 'var(--spacing-md)' }}>
                                                            <span className="badge badge-success">
                                                                {order.payment_mode === 'cash' ? '💵 Cash' : '📱 UPI'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                                                            {order.advance_used && order.advance_used > 0 ? (
                                                                <div>
                                                                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-xs)' }}>
                                                                        Original: {formatCurrency(order.total_amount + order.advance_used)}
                                                                    </div>
                                                                    <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                                                        {formatCurrency(order.total_amount)}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                                                    {formatCurrency(order.total_amount)}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                                                            {order.advance_used && order.advance_used > 0 ? (
                                                                <div style={{ color: 'var(--success)', fontWeight: 600 }}>
                                                                    {formatCurrency(order.advance_used)}
                                                                </div>
                                                            ) : (
                                                                <div style={{ color: 'var(--gray-500)' }}>₹0</div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Add Advance Modal */}
            {showAdvanceModal && selectedCustomer && (
                <div className="modal-overlay" onClick={() => setShowAdvanceModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <h2>Add Advance Payment</h2>
                            <button
                                onClick={() => setShowAdvanceModal(false)}
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
                            padding: 'var(--spacing-md)', 
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--spacing-lg)'
                        }}>
                            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                <strong>Customer:</strong> {selectedCustomer.name}
                            </div>
                            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                <strong>Phone:</strong> {selectedCustomer.phone_number}
                            </div>
                            <div>
                                <strong>Current Advance Balance:</strong>{' '}
                                <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                                    {formatCurrency(selectedCustomer.advance_balance)}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleAddAdvance}>
                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                    Amount to Add (₹) *
                                </label>
                                <input
                                    type="number"
                                    className="input"
                                    value={amountInput}
                                    onChange={(e) => setAmountInput(e.target.value)}
                                    required
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                    Notes (Optional)
                                </label>
                                <textarea
                                    className="input"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Payment method, reference number, etc."
                                />
                            </div>

                            {amountInput && parseFloat(amountInput) > 0 && (
                                <div style={{ 
                                    background: 'rgba(16, 185, 129, 0.1)', 
                                    padding: 'var(--spacing-md)', 
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--spacing-md)'
                                }}>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)', marginBottom: 'var(--spacing-xs)' }}>
                                        New Balance After Payment:
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>
                                        {formatCurrency(selectedCustomer.advance_balance + parseFloat(amountInput) || 0)}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowAdvanceModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Add Advance Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Customer Modal */}
            {showAddCustomerModal && (
                <div className="modal-overlay" onClick={() => setShowAddCustomerModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <h2>Add New Customer</h2>
                            <button
                                onClick={() => setShowAddCustomerModal(false)}
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

                        <form onSubmit={handleAddCustomer}>
                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                    Customer Name *
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    value={newCustomerName}
                                    onChange={(e) => setNewCustomerName(e.target.value)}
                                    required
                                    placeholder="Enter customer name"
                                    autoFocus
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    className="input"
                                    value={newCustomerPhone}
                                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                                    required
                                    placeholder="Enter 10-digit phone number"
                                    maxLength={10}
                                    pattern="[0-9]{10}"
                                />
                                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: 'var(--spacing-xs)' }}>
                                    10-digit phone number (e.g., 9876543210)
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowAddCustomerModal(false)}
                                    disabled={addingCustomer}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={addingCustomer}
                                >
                                    {addingCustomer ? 'Adding...' : 'Add Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


