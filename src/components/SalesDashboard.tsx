'use client';

import { useState, useEffect } from 'react';
import { getTodayDate, formatCurrency, formatDate } from '@/lib/utils';
import { AnalyticsData, SalesTrendData, BestSellingProduct, PeakHourData } from '@/types';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

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
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    useEffect(() => {
        loadSales();
        loadAnalytics();
    }, [selectedDate, period]);

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

    const loadAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
            const response = await fetch(`/api/analytics?period=${period}&date=${selectedDate}`);
            if (!response.ok) {
                throw new Error(`Analytics API returned ${response.status}`);
            }
            const data = await response.json();
            // Validate that data has the expected structure
            if (data && typeof data === 'object') {
                console.log('Analytics data loaded:', {
                    sales_trends: data.sales_trends?.length || 0,
                    best_selling_products: data.best_selling_products?.length || 0,
                    peak_hours: data.peak_hours?.length || 0,
                    period: data.period,
                    start_date: data.start_date,
                    end_date: data.end_date
                });
                console.log('Best selling products:', data.best_selling_products);
                console.log('Peak hours:', data.peak_hours);
                setAnalytics(data);
            } else {
                console.error('Invalid analytics data structure:', data);
                setAnalytics(null);
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            setAnalytics(null);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const formatChartDate = (dateStr: string) => {
        const date = new Date(dateStr);
        if (period === 'daily') {
            return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        } else if (period === 'weekly') {
            return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        } else {
            return date.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' });
        }
    };

    const formatHour = (hour: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:00 ${period}`;
    };

    if (loading || analyticsLoading) {
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

    // Prepare chart data with safe defaults
    const salesTrendChartData = (analytics?.sales_trends || []).map(trend => ({
        date: formatChartDate(trend.date),
        revenue: Math.round(trend.revenue || 0),
        orders: trend.orders || 0
    }));

    const peakHoursChartData = (analytics?.peak_hours || []).map(hour => ({
        hour: formatHour(hour.hour),
        revenue: Math.round(hour.revenue || 0),
        orders: hour.orders || 0
    }));

    // Debug: Log chart data
    console.log('Peak hours chart data:', peakHoursChartData.length, 'items');
    console.log('Best selling products:', (analytics?.best_selling_products || []).length, 'items');

    const totalRevenue = (analytics?.sales_trends || []).reduce((sum, trend) => sum + (trend.revenue || 0), 0);
    const totalOrders = (analytics?.sales_trends || []).reduce((sum, trend) => sum + (trend.orders || 0), 0);

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
                }}>Sales Dashboard & Analytics</h1>

                {/* Filters */}
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--spacing-md)' }}>
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
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginLeft: 'auto' }}>
                        <button
                            className={`btn ${period === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setPeriod('daily')}
                            style={{ minWidth: '80px' }}
                        >
                            Daily
                        </button>
                        <button
                            className={`btn ${period === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setPeriod('weekly')}
                            style={{ minWidth: '80px' }}
                        >
                            Weekly
                        </button>
                        <button
                            className={`btn ${period === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setPeriod('monthly')}
                            style={{ minWidth: '80px' }}
                        >
                            Monthly
                        </button>
                    </div>
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
                    💰 TOTAL SALES ({period.toUpperCase()})
                </div>
                <div style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: 'var(--spacing-md)', letterSpacing: '-0.02em' }}>
                    {formatCurrency(totalRevenue)}
                </div>
                <div style={{ fontSize: '1.25rem', opacity: 0.95, fontWeight: 500 }}>
                    📊 {totalOrders} {totalOrders === 1 ? 'order' : 'orders'} • {analytics ? `${formatDate(analytics.start_date)} to ${formatDate(analytics.end_date)}` : 'N/A'}
                </div>
            </div>

            {/* Sales Trends Chart - Line Chart */}
            <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                    marginBottom: 'var(--spacing-lg)',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--gray-900)'
                }}>
                    📈 Sales Trends
                </h2>
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={salesTrendChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="date"
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                            tickFormatter={(value) => `₹${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            dot={{ fill: '#8b5cf6', r: 4 }}
                            name="Revenue"
                        />
                        <Line
                            type="monotone"
                            dataKey="orders"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ fill: '#10b981', r: 3 }}
                            name="Orders"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Revenue Chart - Bar Chart */}
            <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                    marginBottom: 'var(--spacing-lg)',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--gray-900)'
                }}>
                    💵 Revenue Breakdown
                </h2>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={salesTrendChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="date"
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                            tickFormatter={(value) => `₹${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                        <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Peak Hours Analysis */}
            <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                    marginBottom: 'var(--spacing-lg)',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--gray-900)'
                }}>
                    ⏰ Peak Hours Analysis
                </h2>
                {analyticsLoading ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--gray-600)' }}>
                        Loading...
                    </div>
                ) : peakHoursChartData && peakHoursChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={peakHoursChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="hour"
                                stroke="#6b7280"
                                style={{ fontSize: '11px' }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                                tickFormatter={(value) => `₹${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                }}
                                formatter={(value: number, name: string) => {
                                    if (name === 'revenue') return formatCurrency(value);
                                    return value;
                                }}
                            />
                            <Legend />
                            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="orders" fill="#10b981" name="Orders" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--gray-600)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }}>⏰</div>
                        <p>No peak hours data available for this period</p>
                    </div>
                )}
            </div>

            {/* Best Selling Products */}
            <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{
                    marginBottom: 'var(--spacing-lg)',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--gray-900)'
                }}>
                    🏆 Best Selling Products
                </h2>
                {analyticsLoading ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--gray-600)' }}>
                        Loading...
                    </div>
                ) : (analytics?.best_selling_products && analytics.best_selling_products.length > 0) ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)' }}>Rank</th>
                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'left', fontWeight: 600, color: 'var(--gray-700)' }}>Product</th>
                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'right', fontWeight: 600, color: 'var(--gray-700)' }}>Quantity</th>
                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'right', fontWeight: 600, color: 'var(--gray-700)' }}>Revenue</th>
                                    <th style={{ padding: 'var(--spacing-md)', textAlign: 'right', fontWeight: 600, color: 'var(--gray-700)' }}>Orders</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.best_selling_products.map((product, index) => (
                                    <tr key={product.product_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: 'var(--spacing-md)', color: 'var(--gray-900)' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                background: index < 3 ? 'var(--bg-gradient-purple)' : '#e5e7eb',
                                                color: index < 3 ? 'white' : 'var(--gray-700)',
                                                textAlign: 'center',
                                                lineHeight: '28px',
                                                fontWeight: 700,
                                                fontSize: '0.875rem'
                                            }}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td style={{ padding: 'var(--spacing-md)', fontWeight: 600, color: 'var(--gray-900)' }}>
                                            {product.product_name}
                                        </td>
                                        <td style={{ padding: 'var(--spacing-md)', textAlign: 'right', color: 'var(--gray-700)' }}>
                                            {product.total_quantity}
                                        </td>
                                        <td style={{ padding: 'var(--spacing-md)', textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>
                                            {formatCurrency(product.total_revenue)}
                                        </td>
                                        <td style={{ padding: 'var(--spacing-md)', textAlign: 'right', color: 'var(--gray-700)' }}>
                                            {product.order_count}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--gray-600)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }}>📦</div>
                        <p>No product sales data available for this period</p>
                        <p style={{ fontSize: '0.875rem', marginTop: 'var(--spacing-sm)', opacity: 0.7 }}>
                            {analytics ? 'Try selecting a different date or period' : 'Analytics data not loaded'}
                        </p>
                    </div>
                )}
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
            <div className="grid grid-3" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="card" style={{ background: 'white', borderColor: 'var(--gray-200)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-md)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Average Order
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {totalOrders > 0
                            ? formatCurrency(Math.round(totalRevenue / totalOrders))
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
                        {totalOrders}
                    </div>
                </div>
            </div>

            {totalOrders === 0 && (
                <div className="card" style={{
                    textAlign: 'center',
                    padding: 'var(--spacing-xl)',
                    marginTop: 'var(--spacing-lg)'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📊</div>
                    <p style={{ color: 'var(--gray-700)' }}>No sales recorded for this period</p>
                </div>
            )}
        </div>
    );
}
