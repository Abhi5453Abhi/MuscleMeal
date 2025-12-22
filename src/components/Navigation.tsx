import { useState } from 'react';

interface NavigationProps {
    currentView: string;
    onViewChange: (view: string) => void;
    userRole: 'admin' | 'cashier';
    onLogout: () => void;
}

export default function Navigation({ currentView, onViewChange, userRole, onLogout }: NavigationProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const menuItems = [
        { id: 'pos', label: '🛒 POS', roles: ['admin', 'cashier'] },
        { id: 'history', label: '📋 Orders', roles: ['admin', 'cashier'] },
        { id: 'customers', label: '👥 Customers', roles: ['admin', 'cashier'] },
        { id: 'products', label: '📦 Products', roles: ['admin'] },
        { id: 'inventory', label: '📊 Inventory', roles: ['admin'] },
        { id: 'sales', label: '💰 Sales', roles: ['admin'] },
        { id: 'expenses', label: '💸 Expenses', roles: ['admin'] },
    ];

    const visibleItems = menuItems.filter(item => item.roles.includes(userRole));

    return (
        <nav className="nav-container" style={{
            background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.15)',
            padding: 'var(--spacing-md) var(--spacing-xl)',
            marginBottom: 'var(--spacing-lg)',
            width: '100%',
            boxSizing: 'border-box',
            position: 'relative',
            zIndex: 100
        }}>
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xl)', width: '100%', justifyContent: 'space-between' }}>
                    <h2 style={{
                        margin: 0,
                        color: 'white',
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        textShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                        whiteSpace: 'nowrap'
                    }}>💪 MuscleMeal</h2>

                    {/* Mobile Toggle Button */}
                    <button
                        className="mobile-only btn"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        style={{
                            padding: 'var(--spacing-sm)',
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            fontSize: '1.25rem',
                            border: '1px solid rgba(255, 255, 255, 0.3)'
                        }}
                    >
                        {isMenuOpen ? '✕' : '☰'}
                    </button>

                    {/* Navigation Items - Collapsible on Mobile */}
                    <div className={`nav-menu ${isMenuOpen ? 'is-open' : ''}`} style={{
                        display: 'flex',
                        gap: 'var(--spacing-sm)',
                        alignItems: 'center',
                        marginLeft: 'var(--spacing-xl)'
                    }}>
                        {visibleItems.map(item => (
                            <button
                                key={item.id}
                                className={`btn ${currentView === item.id ? 'btn-secondary' : 'btn-outline'}`}
                                onClick={() => {
                                    onViewChange(item.id);
                                    setIsMenuOpen(false);
                                }}
                                style={currentView === item.id ? { padding: 'var(--spacing-sm) var(--spacing-md)' } : {
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    backdropFilter: 'blur(10px)',
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                    color: 'white',
                                    padding: 'var(--spacing-sm) var(--spacing-md)'
                                }}
                            >
                                {item.label}
                            </button>
                        ))}

                        <button
                            className="btn logout-btn"
                            onClick={onLogout}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(10px)',
                                borderColor: 'rgba(255, 255, 255, 0.4)',
                                color: 'white',
                                border: '2px solid rgba(255, 255, 255, 0.4)',
                                fontWeight: 600,
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                marginLeft: 'var(--spacing-md)'
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
