'use client';

import { useState, useEffect } from 'react';
import { InventoryReport, InventoryHistory, InventoryNotification } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function InventoryManagement() {
    const [reports, setReports] = useState<InventoryReport[]>([]);
    const [notifications, setNotifications] = useState<InventoryNotification[]>([]);
    const [history, setHistory] = useState<InventoryHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'low_stock' | 'history' | 'notifications'>('overview');
    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<InventoryReport | null>(null);
    const [addStockQuantity, setAddStockQuantity] = useState('');
    const [addStockNotes, setAddStockNotes] = useState('');

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'overview' || activeTab === 'low_stock') {
                const reportType = activeTab === 'low_stock' ? 'low_stock' : 'all';
                const response = await fetch(`/api/inventory?type=${reportType}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch inventory: ${response.statusText}`);
                }
                const data = await response.json();
                setReports(Array.isArray(data) ? data : []);
            } else if (activeTab === 'history') {
                const response = await fetch('/api/inventory/history?limit=50');
                if (!response.ok) {
                    throw new Error(`Failed to fetch history: ${response.statusText}`);
                }
                const data = await response.json();
                setHistory(Array.isArray(data) ? data : []);
            } else if (activeTab === 'notifications') {
                const response = await fetch('/api/inventory/notifications?unacknowledgedOnly=true');
                if (!response.ok) {
                    throw new Error(`Failed to fetch notifications: ${response.statusText}`);
                }
                const data = await response.json();
                setNotifications(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            // Set empty arrays on error to prevent map errors
            if (activeTab === 'overview' || activeTab === 'low_stock') {
                setReports([]);
            } else if (activeTab === 'history') {
                setHistory([]);
            } else if (activeTab === 'notifications') {
                setNotifications([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const openAddStockModal = (product: InventoryReport) => {
        setSelectedProduct(product);
        setAddStockQuantity('');
        setAddStockNotes('');
        setShowAddStockModal(true);
    };

    const handleAddStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct || !addStockQuantity) return;

        try {
            const response = await fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: selectedProduct.product_id,
                    quantity: parseInt(addStockQuantity),
                    notes: addStockNotes || 'Manual stock addition'
                })
            });

            if (response.ok) {
                await loadData();
                setShowAddStockModal(false);
                setSelectedProduct(null);
            } else {
                alert('Failed to add stock');
            }
        } catch (error) {
            console.error('Error adding stock:', error);
            alert('Error adding stock');
        }
    };

    const acknowledgeNotification = async (notificationId: number) => {
        try {
            const response = await fetch('/api/inventory/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification_id: notificationId })
            });

            if (response.ok) {
                await loadData();
            }
        } catch (error) {
            console.error('Error acknowledging notification:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { className: string; label: string }> = {
            in_stock: { className: 'badge-success', label: 'In Stock' },
            low_stock: { className: 'badge-warning', label: 'Low Stock' },
            out_of_stock: { className: 'badge-error', label: 'Out of Stock' }
        };
        const badge = badges[status] || badges.in_stock;
        return <span className={`badge ${badge.className}`}>{badge.label}</span>;
    };

    if (loading && activeTab === 'overview') {
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
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-lg)'
            }}>
                <h1>Inventory Management</h1>
            </div>

            {/* Tabs */}
            <div className="category-tabs" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <button
                    className={`category-tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    All Products
                </button>
                <button
                    className={`category-tab ${activeTab === 'low_stock' ? 'active' : ''}`}
                    onClick={() => setActiveTab('low_stock')}
                >
                    Low Stock
                    {notifications.length > 0 && (
                        <span style={{
                            marginLeft: 'var(--spacing-sm)',
                            background: 'var(--error)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem'
                        }}>
                            {notifications.length}
                        </span>
                    )}
                </button>
                <button
                    className={`category-tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    History
                </button>
                <button
                    className={`category-tab ${activeTab === 'notifications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notifications')}
                >
                    Alerts
                    {notifications.length > 0 && (
                        <span style={{
                            marginLeft: 'var(--spacing-sm)',
                            background: 'var(--error)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem'
                        }}>
                            {notifications.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Overview / Low Stock Tab */}
            {(activeTab === 'overview' || activeTab === 'low_stock') && (
                <div className="card">
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--gray-200)', textAlign: 'left' }}>
                                <th style={{ padding: 'var(--spacing-md)' }}>Product</th>
                                <th style={{ padding: 'var(--spacing-md)' }}>Category</th>
                                <th style={{ padding: 'var(--spacing-md)' }}>Current Stock</th>
                                <th style={{ padding: 'var(--spacing-md)' }}>Threshold</th>
                                <th style={{ padding: 'var(--spacing-md)' }}>Status</th>
                                <th style={{ padding: 'var(--spacing-md)' }}>Total Sold</th>
                                <th style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(Array.isArray(reports) ? reports : []).map(report => (
                                <tr key={report.product_id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                                    <td style={{ padding: 'var(--spacing-md)', fontWeight: 500 }}>
                                        {report.product_name}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)', color: 'var(--gray-700)' }}>
                                        {report.category_name || 'N/A'}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)', fontWeight: 600 }}>
                                        {report.current_stock}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)', color: 'var(--gray-700)' }}>
                                        {report.low_stock_threshold}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)' }}>
                                        {getStatusBadge(report.status)}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)', color: 'var(--gray-700)' }}>
                                        {report.total_sold}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => openAddStockModal(report)}
                                        >
                                            Add Stock
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {(!Array.isArray(reports) || reports.length === 0) && (
                        <div style={{
                            textAlign: 'center',
                            padding: 'var(--spacing-xl)',
                            color: 'var(--gray-700)'
                        }}>
                            {activeTab === 'low_stock' 
                                ? 'No products with low stock' 
                                : 'No products found'}
                        </div>
                    )}
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div className="card">
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--gray-200)', textAlign: 'left' }}>
                                <th style={{ padding: 'var(--spacing-md)' }}>Date</th>
                                <th style={{ padding: 'var(--spacing-md)' }}>Product</th>
                                <th style={{ padding: 'var(--spacing-md)' }}>Type</th>
                                <th style={{ padding: 'var(--spacing-md)' }}>Change</th>
                                <th style={{ padding: 'var(--spacing-md)' }}>Previous</th>
                                <th style={{ padding: 'var(--spacing-md)' }}>New Stock</th>
                                <th style={{ padding: 'var(--spacing-md)' }}>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(Array.isArray(history) ? history : []).map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                                    <td style={{ padding: 'var(--spacing-md)', color: 'var(--gray-700)' }}>
                                        {new Date(item.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)', fontWeight: 500 }}>
                                        {(item as any).products?.name || `Product #${item.product_id}`}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)' }}>
                                        <span className={`badge ${
                                            item.change_type === 'purchase' ? 'badge-success' :
                                            item.change_type === 'sale' ? 'badge-error' :
                                            'badge-secondary'
                                        }`}>
                                            {item.change_type}
                                        </span>
                                    </td>
                                    <td style={{ 
                                        padding: 'var(--spacing-md)', 
                                        fontWeight: 600,
                                        color: item.quantity_change > 0 ? 'var(--success)' : 'var(--error)'
                                    }}>
                                        {item.quantity_change > 0 ? '+' : ''}{item.quantity_change}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)', color: 'var(--gray-700)' }}>
                                        {item.previous_stock}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)', fontWeight: 600 }}>
                                        {item.new_stock}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)', color: 'var(--gray-700)' }}>
                                        {item.notes || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {(!Array.isArray(history) || history.length === 0) && (
                        <div style={{
                            textAlign: 'center',
                            padding: 'var(--spacing-xl)',
                            color: 'var(--gray-700)'
                        }}>
                            No inventory history found
                        </div>
                    )}
                </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <div className="card">
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--gray-200)', textAlign: 'left' }}>
                                <th style={{ padding: 'var(--spacing-md)' }}>Date</th>
                                <th style={{ padding: 'var(--spacing-md)' }}>Product</th>
                                <th style={{ padding: 'var(--spacing-md)' }}>Current Stock</th>
                                <th style={{ padding: 'var(--spacing-md)' }}>Threshold</th>
                                <th style={{ padding: 'var(--spacing-md)' }}>Type</th>
                                <th style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(Array.isArray(notifications) ? notifications : []).map(notification => (
                                <tr key={notification.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                                    <td style={{ padding: 'var(--spacing-md)', color: 'var(--gray-700)' }}>
                                        {new Date(notification.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)', fontWeight: 500 }}>
                                        {notification.product_name}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)', fontWeight: 600 }}>
                                        {notification.current_stock}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)', color: 'var(--gray-700)' }}>
                                        {notification.threshold}
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)' }}>
                                        <span className={`badge ${
                                            notification.notification_type === 'out_of_stock' 
                                                ? 'badge-error' 
                                                : 'badge-warning'
                                        }`}>
                                            {notification.notification_type === 'out_of_stock' 
                                                ? 'Out of Stock' 
                                                : 'Low Stock'}
                                        </span>
                                    </td>
                                    <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                                        {!notification.acknowledged && (
                                            <button
                                                className="btn btn-sm btn-secondary"
                                                onClick={() => acknowledgeNotification(notification.id)}
                                            >
                                                Acknowledge
                                            </button>
                                        )}
                                        {notification.acknowledged && (
                                            <span style={{ color: 'var(--success)', fontSize: '0.875rem' }}>
                                                ✓ Acknowledged
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {(!Array.isArray(notifications) || notifications.length === 0) && (
                        <div style={{
                            textAlign: 'center',
                            padding: 'var(--spacing-xl)',
                            color: 'var(--gray-700)'
                        }}>
                            No unacknowledged notifications
                        </div>
                    )}
                </div>
            )}

            {/* Add Stock Modal */}
            {showAddStockModal && selectedProduct && (
                <div className="modal-overlay" onClick={() => setShowAddStockModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>
                            Add Stock - {selectedProduct.product_name}
                        </h2>

                        <form onSubmit={handleAddStock}>
                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                    Current Stock
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    value={selectedProduct.current_stock}
                                    disabled
                                    style={{ background: 'var(--gray-100)' }}
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                    Quantity to Add
                                </label>
                                <input
                                    type="number"
                                    className="input"
                                    value={addStockQuantity}
                                    onChange={(e) => setAddStockQuantity(e.target.value)}
                                    required
                                    min="1"
                                    placeholder="Enter quantity"
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                    Notes (Optional)
                                </label>
                                <textarea
                                    className="input"
                                    value={addStockNotes}
                                    onChange={(e) => setAddStockNotes(e.target.value)}
                                    placeholder="Add notes about this stock addition"
                                    rows={3}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowAddStockModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    Add Stock
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

