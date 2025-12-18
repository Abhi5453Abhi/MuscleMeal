'use client';

import { useState, useEffect } from 'react';
import LoginScreen from '@/components/LoginScreen';
import Navigation from '@/components/Navigation';
import POSScreen from '@/components/POSScreen';
import OrderHistory from '@/components/OrderHistory';
import ProductManagement from '@/components/ProductManagement';
import SalesDashboard from '@/components/SalesDashboard';

interface User {
    id: number;
    username: string;
    role: 'admin' | 'cashier';
}

export default function Home() {
    const [user, setUser] = useState<User | null>(null);
    const [currentView, setCurrentView] = useState('pos');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Initialize database on first load
        const initDB = async () => {
            try {
                await fetch('/api/categories'); // This will trigger DB initialization
                // Check if we need to seed
                const response = await fetch('/api/products');
                const products = await response.json();

                if (products.length === 0) {
                    // Seed the database
                    await fetch('/api/seed', { method: 'POST' });
                }

                setIsReady(true);
            } catch (error) {
                console.error('Error initializing database:', error);
                setIsReady(true); // Continue anyway
            }
        };

        initDB();

        // Check for saved session
        const savedUser = localStorage.getItem('musclemeal_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const handleLogin = (userData: User) => {
        setUser(userData);
        localStorage.setItem('musclemeal_user', JSON.stringify(userData));
        setCurrentView('pos');
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('musclemeal_user');
    };

    if (!isReady) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <div className="loader"></div>
            </div>
        );
    }

    if (!user) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    return (
        <div>
            <Navigation
                currentView={currentView}
                onViewChange={setCurrentView}
                userRole={user.role}
                onLogout={handleLogout}
            />

            {currentView === 'pos' && <POSScreen userId={user.id} />}
            {currentView === 'history' && <OrderHistory />}
            {currentView === 'products' && user.role === 'admin' && <ProductManagement />}
            {currentView === 'sales' && user.role === 'admin' && <SalesDashboard />}
        </div>
    );
}
