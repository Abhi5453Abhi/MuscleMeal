'use client';

import { useState, useEffect } from 'react';
import { ProfitLossData } from '@/types';
import { formatCurrency, getTodayDate } from '@/lib/utils';

interface ProfitLossDashboardProps {
    onViewChange?: (view: string) => void;
}

export default function ProfitLossDashboard({ onViewChange }: ProfitLossDashboardProps) {
    const [profitLossData, setProfitLossData] = useState<ProfitLossData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [useDateRange, setUseDateRange] = useState(false);

    useEffect(() => {
        loadProfitLoss();
    }, [selectedDate, period, startDate, endDate, useDateRange]);

    const loadProfitLoss = async () => {
        setLoading(true);
        try {
            let url = '/api/profit-loss?';
            if (useDateRange && startDate && endDate) {
                url += `startDate=${startDate}&endDate=${endDate}`;
            } else {
                url += `date=${selectedDate}&period=${period}`;
            }

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setProfitLossData(data);
            } else {
                console.error('Error loading profit/loss data');
            }
        } catch (error) {
            console.error('Error loading profit/loss data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <div className="loader"></div>
            </div>
        );
    }

    const profit = profitLossData?.profit || 0;
    const isProfit = profit >= 0;
    const profitColor = isProfit ? 'var(--success)' : 'var(--error)';

    return (
        <div className="container">
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                    <h1 style={{ margin: 0 }}>📊 Profit & Loss Dashboard</h1>
                    {onViewChange && (
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => onViewChange('expenses')}
                        >
                            ← Back to Expenses
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="card" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                            <input
                                type="checkbox"
                                id="useDateRange"
                                checked={useDateRange}
                                onChange={(e) => setUseDateRange(e.target.checked)}
                            />
                            <label htmlFor="useDateRange" style={{ fontWeight: 500 }}>
                                Use Date Range
                            </label>
                        </div>

                        {useDateRange ? (
                            <>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                        Period
                                    </label>
                                    <select
                                        className="input"
                                        value={period}
                                        onChange={(e) => setPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Main Profit/Loss Card */}
                {profitLossData && (
                    <>
                        <div className="card" style={{
                            background: `linear-gradient(135deg, ${profitColor}15 0%, ${profitColor}05 100%)`,
                            border: `2px solid ${profitColor}40`,
                            marginBottom: 'var(--spacing-lg)',
                            textAlign: 'center',
                            padding: 'var(--spacing-xl)'
                        }}>
                            <div style={{ fontSize: '1rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-sm)' }}>
                                {useDateRange ? `${startDate} to ${endDate}` : period.charAt(0).toUpperCase() + period.slice(1)} Profit/Loss
                            </div>
                            <div style={{
                                fontSize: '3rem',
                                fontWeight: 800,
                                color: profitColor,
                                marginBottom: 'var(--spacing-sm)'
                            }}>
                                {isProfit ? '+' : ''}{formatCurrency(profit)}
                            </div>
                            <div style={{ fontSize: '1.25rem', color: 'var(--gray-600)' }}>
                                {profitLossData.profit_percentage.toFixed(2)}% {isProfit ? 'profit' : 'loss'} margin
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-3" style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <div className="card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-xs)' }}>
                                    Total Revenue
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>
                                    {formatCurrency(profitLossData.revenue)}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 'var(--spacing-xs)' }}>
                                    From completed orders
                                </div>
                            </div>

                            <div className="card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-xs)' }}>
                                    Total Expenses
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--error)' }}>
                                    {formatCurrency(profitLossData.expenses)}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 'var(--spacing-xs)' }}>
                                    All recorded expenses
                                </div>
                            </div>

                            <div className="card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-xs)' }}>
                                    Net {isProfit ? 'Profit' : 'Loss'}
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: profitColor }}>
                                    {isProfit ? '+' : ''}{formatCurrency(profit)}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 'var(--spacing-xs)' }}>
                                    Revenue - Expenses
                                </div>
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="card">
                            <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Financial Breakdown</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: 'var(--spacing-md)',
                                    background: 'var(--gray-50)',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>Revenue</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                                            Total sales from completed orders
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                                        {formatCurrency(profitLossData.revenue)}
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: 'var(--spacing-md)',
                                    background: 'var(--gray-50)',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>Expenses</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                                            All recorded expenses
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error)' }}>
                                        -{formatCurrency(profitLossData.expenses)}
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: 'var(--spacing-md)',
                                    background: isProfit ? 'var(--success)15' : 'var(--error)15',
                                    borderRadius: 'var(--radius-md)',
                                    border: `2px solid ${profitColor}40`
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 700, marginBottom: 'var(--spacing-xs)' }}>
                                            Net {isProfit ? 'Profit' : 'Loss'}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                                            {profitLossData.profit_percentage.toFixed(2)}% margin
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: profitColor }}>
                                        {isProfit ? '+' : ''}{formatCurrency(profit)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Insights */}
                        <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                            <h2 style={{ marginBottom: 'var(--spacing-md)' }}>💡 Insights</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                {profitLossData.revenue === 0 && profitLossData.expenses === 0 ? (
                                    <div style={{ padding: 'var(--spacing-md)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                                        No data available for the selected period. Start recording sales and expenses to see your profit/loss.
                                    </div>
                                ) : (
                                    <>
                                        {isProfit ? (
                                            <div style={{ padding: 'var(--spacing-md)', background: 'var(--success)15', borderRadius: 'var(--radius-md)', color: 'var(--success)' }}>
                                                ✅ You're making a profit! Your revenue exceeds expenses by {formatCurrency(profit)}.
                                            </div>
                                        ) : (
                                            <div style={{ padding: 'var(--spacing-md)', background: 'var(--error)15', borderRadius: 'var(--radius-md)', color: 'var(--error)' }}>
                                                ⚠️ You're operating at a loss. Expenses exceed revenue by {formatCurrency(Math.abs(profit))}. Consider reviewing your expenses or increasing sales.
                                            </div>
                                        )}
                                        {profitLossData.revenue > 0 && (
                                            <div style={{ padding: 'var(--spacing-md)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                                                <strong>Expense Ratio:</strong> {((profitLossData.expenses / profitLossData.revenue) * 100).toFixed(2)}% of revenue is spent on expenses.
                                            </div>
                                        )}
                                        {profitLossData.expenses > 0 && (
                                            <div style={{ padding: 'var(--spacing-md)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                                                <strong>Revenue Ratio:</strong> Revenue is {((profitLossData.revenue / profitLossData.expenses) * 100).toFixed(2)}% of total expenses.
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}



