'use client';

import { useState, useEffect } from 'react';
import { getTodayDate, formatCurrency } from '@/lib/utils';

interface SalesData {
    date: string;
    total_sales: number;
    total_orders: number;
    cash_sales: number;
    upi_sales: number;
    cash_orders: number;
    upi_orders: number;
}

export default function SalesDashboard() {
    const [sales, setSales] = useState<SalesData | null>(null);
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSales();
    }, [selectedDate]);

    const loadSales = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/sales?date=${selectedDate}`);
            const data = await response.json();
            setSales(data);
        } catch (error) {
            console.error('Error loading sales:', error);
        } finally {
            setLoading(false);
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

    if (!sales) return null;

    const cashPercentage = sales.total_sales > 0
        ? Math.round((sales.cash_sales / sales.total_sales) * 100)
        : 0;
    const upiPercentage = sales.total_sales > 0
        ? Math.round((sales.upi_sales / sales.total_sales) * 100)
        : 0;

    return (
        <div className="container">
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h1 style={{
                    marginBottom: 'var(--spacing-lg)',
                    background: 'var(--bg-gradient-purple)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: '2.5rem'
                }}>Sales Dashboard</h1>

                {/* Date Filter */}
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="date"
                        className="input"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{ maxWidth: '220px', fontWeight: 500 }}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={() => setSelectedDate(getTodayDate())}
                    >
                        📅 Today
                    </button>
                </div>
            </div>

            {/* Main Sales Card */}
            <div className="card" style={{
                background: 'var(--bg-gradient-purple)',
                color: 'white',
                marginBottom: 'var(--spacing-xl)',
                padding: 'var(--spacing-2xl)',
                boxShadow: 'var(--shadow-xl)',
                border: 'none'
            }}>
                <div style={{ fontSize: '1rem', opacity: 0.95, marginBottom: 'var(--spacing-md)', fontWeight: 600, letterSpacing: '0.05em' }}>
                    💰 TOTAL SALES
                </div>
                <div style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: 'var(--spacing-md)', letterSpacing: '-0.02em' }}>
                    {formatCurrency(sales.total_sales)}
                </div>
                <div style={{ fontSize: '1.25rem', opacity: 0.95, fontWeight: 500 }}>
                    📊 {sales.total_orders} {sales.total_orders === 1 ? 'order' : 'orders'} today
                </div>
            </div>

            {/* Payment Mode Breakdown */}
            <div className="grid grid-2" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="card" style={{
                    background: 'var(--bg-gradient-success)',
                    color: 'white',
                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.2)',
                    border: 'none'
                }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-md)' }}>💵</div>
                    <div style={{ fontSize: '1rem', opacity: 0.95, marginBottom: 'var(--spacing-md)', fontWeight: 600, letterSpacing: '0.05em' }}>
                        CASH PAYMENTS
                    </div>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: 'var(--spacing-md)' }}>
                        {formatCurrency(sales.cash_sales)}
                    </div>
                    <div style={{ opacity: 0.95, fontSize: '1rem', fontWeight: 500 }}>
                        {sales.cash_orders} orders • {cashPercentage}%
                    </div>
                </div>

                <div className="card" style={{
                    background: 'var(--bg-gradient-blue)',
                    color: 'white',
                    boxShadow: '0 8px 20px rgba(59, 130, 246, 0.2)',
                    border: 'none'
                }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-md)' }}>📱</div>
                    <div style={{ fontSize: '1rem', opacity: 0.95, marginBottom: 'var(--spacing-md)', fontWeight: 600, letterSpacing: '0.05em' }}>
                        UPI PAYMENTS
                    </div>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: 'var(--spacing-md)' }}>
                        {formatCurrency(sales.upi_sales)}
                    </div>
                    <div style={{ opacity: 0.95, fontSize: '1rem', fontWeight: 500 }}>
                        {sales.upi_orders} orders • {upiPercentage}%
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-3">
                <div className="card" style={{ background: 'white', borderColor: 'var(--gray-200)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-md)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Average Order
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {sales.total_orders > 0
                            ? formatCurrency(Math.round(sales.total_sales / sales.total_orders))
                            : formatCurrency(0)}
                    </div>
                </div>

                <div className="card" style={{ background: 'white', borderColor: 'var(--gray-200)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-md)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Payment Split
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {cashPercentage}% : {upiPercentage}%
                    </div>
                </div>

                <div className="card" style={{ background: 'white', borderColor: 'var(--gray-200)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-md)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Total Orders
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {sales.total_orders}
                    </div>
                </div>
            </div>

            {sales.total_orders === 0 && (
                <div className="card" style={{
                    textAlign: 'center',
                    padding: 'var(--spacing-xl)',
                    marginTop: 'var(--spacing-lg)'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📊</div>
                    <p style={{ color: 'var(--gray-700)' }}>No sales recorded for this date</p>
                </div>
            )}
        </div>
    );
}
