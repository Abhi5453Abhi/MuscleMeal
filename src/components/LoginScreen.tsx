'use client';

import { useState } from 'react';
import { LoginResponse } from '@/types';

interface LoginScreenProps {
    onLogin: (user: { id: number; username: string; role: 'admin' | 'cashier' }) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, pin })
            });

            const data: LoginResponse = await response.json();

            if (data.success && data.user) {
                onLogin(data.user);
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePinInput = (digit: string) => {
        if (pin.length < 4) {
            setPin(pin + digit);
        }
    };

    const handleClear = () => {
        setPin('');
        setError('');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-gradient-purple)',
            padding: 'var(--spacing-lg)'
        }}>
            <div className="card" style={{
                maxWidth: '450px',
                width: '100%',
                boxShadow: 'var(--shadow-2xl)',
                padding: 'var(--spacing-2xl)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
                    <h1 style={{
                        background: 'var(--bg-gradient-purple)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: 'var(--spacing-md)',
                        fontSize: '2.5rem',
                        fontWeight: 800
                    }}>💪 MuscleMeal</h1>
                    <p style={{ color: 'var(--gray-600)', fontSize: '1.125rem', fontWeight: 500 }}>Point of Sale System</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-md)', fontWeight: 600, color: 'var(--gray-700)' }}>
                            Username
                        </label>
                        <input
                            type="text"
                            className="input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-md)', fontWeight: 600, color: 'var(--gray-700)' }}>
                            PIN
                        </label>
                        <input
                            type="password"
                            className="input"
                            value={pin}
                            readOnly
                            placeholder="Use keypad below"
                            style={{
                                fontSize: '1.75rem',
                                textAlign: 'center',
                                letterSpacing: '0.75rem',
                                background: 'var(--gray-50)',
                                fontWeight: 700
                            }}
                        />
                    </div>

                    {/* PIN Keypad */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 'var(--spacing-sm)',
                        marginBottom: 'var(--spacing-lg)'
                    }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button
                                key={num}
                                type="button"
                                className="btn btn-secondary btn-lg"
                                onClick={() => handlePinInput(String(num))}
                                style={{ fontSize: '1.25rem', padding: 'var(--spacing-lg)' }}
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            type="button"
                            className="btn btn-secondary btn-lg"
                            onClick={handleClear}
                            style={{ fontSize: '0.875rem' }}
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary btn-lg"
                            onClick={() => handlePinInput('0')}
                            style={{ fontSize: '1.25rem', padding: 'var(--spacing-lg)' }}
                        >
                            0
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary btn-lg"
                            onClick={() => setPin(pin.slice(0, -1))}
                            style={{ fontSize: '0.875rem' }}
                        >
                            ←
                        </button>
                    </div>

                    {error && (
                        <div style={{
                            padding: 'var(--spacing-md)',
                            background: '#fee2e2',
                            color: '#991b1b',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--spacing-lg)',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                        disabled={loading || !username || pin.length !== 4}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div style={{
                    marginTop: 'var(--spacing-xl)',
                    padding: 'var(--spacing-md)',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.813rem',
                    color: 'var(--gray-700)'
                }}>
                    <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                        <strong>Admin:</strong> admin / 1234
                    </div>
                    <div>
                        <strong>Cashier:</strong> cashier / 5678
                    </div>
                </div>
            </div>
        </div>
    );
}
