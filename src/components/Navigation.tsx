'use client';

interface NavigationProps {
    currentView: string;
    onViewChange: (view: string) => void;
    userRole: 'admin' | 'cashier';
    onLogout: () => void;
}

export default function Navigation({ currentView, onViewChange, userRole, onLogout }: NavigationProps) {
    const menuItems = [
        { id: 'pos', label: '🛒 POS', roles: ['admin', 'cashier'] },
        { id: 'history', label: '📋 Orders', roles: ['admin', 'cashier'] },
        { id: 'products', label: '📦 Products', roles: ['admin'] },
        { id: 'sales', label: '📊 Sales', roles: ['admin'] },
    ];

    const visibleItems = menuItems.filter(item => item.roles.includes(userRole));

    return (
        <nav style={{
            background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.15)',
            padding: 'var(--spacing-lg) var(--spacing-xl)',
            marginBottom: 'var(--spacing-xl)',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
                    <h2 style={{
                        margin: 0,
                        color: 'white',
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        textShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
                    }}>💪 MuscleMeal POS</h2>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                        {visibleItems.map(item => (
                            <button
                                key={item.id}
                                className={`btn ${currentView === item.id ? 'btn-secondary' : 'btn-outline'}`}
                                onClick={() => onViewChange(item.id)}
                                style={currentView === item.id ? {} : {
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    backdropFilter: 'blur(10px)',
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                    color: 'white'
                                }}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    className="btn"
                    onClick={onLogout}
                    style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                        color: 'white',
                        border: '2px solid rgba(255, 255, 255, 0.4)',
                        fontWeight: 600
                    }}
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}
