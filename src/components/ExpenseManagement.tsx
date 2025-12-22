'use client';

import { useState, useEffect } from 'react';
import { Expense } from '@/types';
import { formatCurrency, formatDate, getTodayDate } from '@/lib/utils';

interface ExpenseManagementProps {
    onViewChange?: (view: string) => void;
}

export default function ExpenseManagement({ onViewChange }: ExpenseManagementProps) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [amountInput, setAmountInput] = useState<string>(''); // String state for amount input

    // Form state
    const [formData, setFormData] = useState({
        description: '',
        amount: 0,
        category: '',
        expense_date: getTodayDate(),
        notes: ''
    });

    // Common expense categories
    const expenseCategories = [
        'Groceries',
        'Rent',
        'Utilities',
        'Staff Salary',
        'Equipment',
        'Maintenance',
        'Marketing',
        'Transport',
        'Other'
    ];

    useEffect(() => {
        loadExpenses();
    }, [selectedDate, filterCategory]);

    const loadExpenses = async () => {
        setLoading(true);
        try {
            let url = `/api/expenses?date=${selectedDate}`;
            if (filterCategory) {
                url += `&category=${filterCategory}`;
            }

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setExpenses(data);
            } else {
                console.error('Error loading expenses');
            }
        } catch (error) {
            console.error('Error loading expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingExpense(null);
        setFormData({
            description: '',
            amount: 0,
            category: '',
            expense_date: selectedDate,
            notes: ''
        });
        setAmountInput('');
        setShowModal(true);
    };

    const openEditModal = (expense: Expense) => {
        setEditingExpense(expense);
        setFormData({
            description: expense.description,
            amount: expense.amount,
            category: expense.category || '',
            expense_date: expense.expense_date,
            notes: expense.notes || ''
        });
        setAmountInput(expense.amount.toString());
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Convert amountInput string to number
        const amount = parseFloat(amountInput) || 0;
        if (amount <= 0) {
            alert('Please enter a valid amount greater than 0');
            return;
        }

        try {
            const savedUser = localStorage.getItem('musclemeal_user');
            if (!savedUser) {
                alert('User session expired. Please login again.');
                return;
            }

            const user = JSON.parse(savedUser);
            const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses';
            const method = editingExpense ? 'PUT' : 'POST';
            const body = editingExpense
                ? { ...formData, amount }
                : { ...formData, amount, created_by: user.id };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                await loadExpenses();
                setShowModal(false);
                setAmountInput('');
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to save expense');
            }
        } catch (error) {
            console.error('Error saving expense:', error);
            alert('Failed to save expense');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this expense?')) {
            return;
        }

        try {
            const response = await fetch(`/api/expenses/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadExpenses();
            } else {
                alert('Failed to delete expense');
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
            alert('Failed to delete expense');
        }
    };

    const getTotalExpenses = () => {
        return expenses.reduce((sum, expense) => sum + expense.amount, 0);
    };

    const getExpensesByCategory = () => {
        const categoryMap = new Map<string, number>();
        expenses.forEach(expense => {
            const category = expense.category || 'Uncategorized';
            categoryMap.set(category, (categoryMap.get(category) || 0) + expense.amount);
        });
        return Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1]);
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
                    <h1>💰 Expense Management</h1>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                        {onViewChange && (
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => onViewChange('profit-loss')}
                            >
                                📊 View Profit/Loss
                            </button>
                        )}
                        <button className="btn btn-primary" onClick={openAddModal}>
                            + Add Expense
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="card" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', alignItems: 'center' }}>
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
                                Category Filter
                            </label>
                            <select
                                className="input"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {expenseCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-3" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-xs)' }}>
                            Total Expenses
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--error)' }}>
                            {formatCurrency(getTotalExpenses())}
                        </div>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-xs)' }}>
                            Number of Expenses
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {expenses.length}
                        </div>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-xs)' }}>
                            Average Expense
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {expenses.length > 0 ? formatCurrency(getTotalExpenses() / expenses.length) : formatCurrency(0)}
                        </div>
                    </div>
                </div>

                {/* Expenses List */}
                <div className="card">
                    <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Expenses for {formatDate(selectedDate)}</h2>
                    
                    {expenses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--gray-600)' }}>
                            No expenses recorded for this date
                        </div>
                    ) : (
                        <>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                                            <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Description</th>
                                            <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Category</th>
                                            <th style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>Amount</th>
                                            <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Date</th>
                                            <th style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expenses.map(expense => (
                                            <tr key={expense.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                                                <td style={{ padding: 'var(--spacing-md)' }}>
                                                    <div style={{ fontWeight: 500 }}>{expense.description}</div>
                                                    {expense.notes && (
                                                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: 'var(--spacing-xs)' }}>
                                                            {expense.notes}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: 'var(--spacing-md)' }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                                                        background: 'var(--gray-100)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        fontSize: '0.875rem'
                                                    }}>
                                                        {expense.category || 'Uncategorized'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: 'var(--spacing-md)', textAlign: 'right', fontWeight: 600, color: 'var(--error)' }}>
                                                    {formatCurrency(expense.amount)}
                                                </td>
                                                <td style={{ padding: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                                                    {formatDate(expense.expense_date)}
                                                </td>
                                                <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center' }}>
                                                        <button
                                                            className="btn btn-sm btn-secondary"
                                                            onClick={() => openEditModal(expense)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleDelete(expense.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Category Breakdown */}
                            {getExpensesByCategory().length > 0 && (
                                <div style={{ marginTop: 'var(--spacing-lg)', paddingTop: 'var(--spacing-lg)', borderTop: '2px solid var(--gray-200)' }}>
                                    <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Expenses by Category</h3>
                                    <div className="grid grid-3">
                                        {getExpensesByCategory().map(([category, amount]) => (
                                            <div key={category} className="card" style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-xs)' }}>
                                                    {category}
                                                </div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--error)' }}>
                                                    {formatCurrency(amount)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <h2>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
                            <button
                                onClick={() => setShowModal(false)}
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

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                    Description *
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                    placeholder="e.g., Grocery shopping"
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                    Amount (₹) *
                                </label>
                                <input
                                    type="number"
                                    className="input"
                                    value={amountInput}
                                    onChange={(e) => {
                                        setAmountInput(e.target.value);
                                    }}
                                    required
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                    Category
                                </label>
                                <select
                                    className="input"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="">Select Category</option>
                                    {expenseCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.expense_date}
                                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                    Notes
                                </label>
                                <textarea
                                    className="input"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                    placeholder="Additional notes (optional)"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingExpense ? 'Update' : 'Add'} Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}



