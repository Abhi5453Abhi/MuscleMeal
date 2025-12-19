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
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="Enter PIN"
                            required
                        />
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
                        disabled={loading || !username || !pin}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
