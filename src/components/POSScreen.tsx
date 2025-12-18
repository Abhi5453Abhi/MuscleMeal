'use client';

import { useState, useEffect } from 'react';
import { Category, Product, CartItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import CheckoutScreen from './CheckoutScreen';

interface POSScreenProps {
    userId: number;
}

export default function POSScreen({ userId }: POSScreenProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in');
    const [notes, setNotes] = useState('');
    const [showCheckout, setShowCheckout] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [cartRestored, setCartRestored] = useState(false);

    useEffect(() => {
        loadData();
        // Restore cart from localStorage
        restoreCartFromStorage();
    }, []);

    // Restore cart, orderType, and notes from localStorage
    const restoreCartFromStorage = () => {
        try {
            const savedCart = localStorage.getItem('musclemeal_cart');
            const savedOrderType = localStorage.getItem('musclemeal_orderType');
            const savedNotes = localStorage.getItem('musclemeal_notes');

            if (savedOrderType) {
                setOrderType(savedOrderType as 'dine-in' | 'takeaway');
            }
            if (savedNotes) {
                setNotes(savedNotes);
            }
            // Cart will be restored after products are loaded
        } catch (error) {
            console.error('Error restoring cart from storage:', error);
        }
    };

    // Restore cart after products are loaded (only once)
    useEffect(() => {
        if (products.length > 0 && !cartRestored) {
            try {
                const savedCart = localStorage.getItem('musclemeal_cart');
                if (savedCart) {
                    const parsedCart = JSON.parse(savedCart);
                    // Filter out products that no longer exist or are disabled
                    const validCartItems = parsedCart.filter((item: CartItem) => {
                        const product = products.find(p => p.id === item.product.id);
                        return product && product.enabled;
                    });
                    if (validCartItems.length > 0) {
                        setCart(validCartItems);
                    } else {
                        // Clear invalid cart
                        localStorage.removeItem('musclemeal_cart');
                    }
                }
                setCartRestored(true);
            } catch (error) {
                console.error('Error restoring cart items:', error);
                localStorage.removeItem('musclemeal_cart');
                setCartRestored(true);
            }
        }
    }, [products, cartRestored]);

    const loadData = async () => {
        try {
            const [categoriesRes, productsRes] = await Promise.all([
                fetch('/api/categories'),
                fetch('/api/products?enabledOnly=true')
            ]);

            if (!categoriesRes.ok) {
                const errorText = await categoriesRes.text();
                console.error('Categories API error:', categoriesRes.status, errorText);
                setCategories([]);
            } else {
                const categoriesData = await categoriesRes.json();
                console.log('Categories loaded:', categoriesData?.length || 0, 'categories');
                if (Array.isArray(categoriesData)) {
                    setCategories(categoriesData);
                    if (categoriesData.length > 0) {
                        setSelectedCategory(categoriesData[0].id);
                    } else {
                        // If no categories, set selectedCategory to null to show all products
                        setSelectedCategory(null);
                    }
                } else {
                    console.error('Categories data is not an array:', categoriesData);
                    setCategories([]);
                    setSelectedCategory(null);
                }
            }

            if (!productsRes.ok) {
                console.error('Products API error:', productsRes.status, await productsRes.text());
                setProducts([]);
            } else {
                const productsData = await productsRes.json();
                if (Array.isArray(productsData)) {
                    setProducts(productsData);
                } else {
                    console.error('Products data is not an array:', productsData);
                    setProducts([]);
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
            setCategories([]);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        // Only save if cart has been restored (to avoid saving empty cart on initial mount)
        if (!cartRestored) return;
        
        if (cart.length > 0) {
            localStorage.setItem('musclemeal_cart', JSON.stringify(cart));
        } else {
            localStorage.removeItem('musclemeal_cart');
        }
    }, [cart, cartRestored]);

    // Save orderType to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('musclemeal_orderType', orderType);
    }, [orderType]);

    // Save notes to localStorage whenever it changes
    useEffect(() => {
        if (notes) {
            localStorage.setItem('musclemeal_notes', notes);
        } else {
            localStorage.removeItem('musclemeal_notes');
        }
    }, [notes]);

    const addToCart = (product: Product) => {
        const existingItem = cart.find(item => item.product.id === product.id);

        if (existingItem) {
            setCart(cart.map(item =>
                item.product.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { product, quantity: 1 }]);
        }
    };

    const updateQuantity = (productId: number, newQuantity: number) => {
        if (newQuantity === 0) {
            setCart(cart.filter(item => item.product.id !== productId));
        } else {
            setCart(cart.map(item =>
                item.product.id === productId
                    ? { ...item, quantity: newQuantity }
                    : item
            ));
        }
    };

    const removeFromCart = (productId: number) => {
        setCart(cart.filter(item => item.product.id !== productId));
    };

    const getTotal = () => {
        return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    };

    const getCartItemCount = () => {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    };

    const handleCheckoutComplete = () => {
        setCart([]);
        setNotes('');
        setShowCheckout(false);
        setCartRestored(false); // Reset flag so cart can be restored again if needed
        // Clear localStorage after successful checkout
        localStorage.removeItem('musclemeal_cart');
        localStorage.removeItem('musclemeal_notes');
        localStorage.removeItem('musclemeal_orderType');
    };

    const filteredProducts = selectedCategory
        ? products.filter(p => p.category_id === selectedCategory && p.enabled)
        : products.filter(p => p.enabled);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <div className="loader"></div>
            </div>
        );
    }

    if (showCheckout) {
        return (
            <CheckoutScreen
                cart={cart}
                orderType={orderType}
                notes={notes}
                userId={userId}
                onComplete={handleCheckoutComplete}
                onBack={() => setShowCheckout(false)}
            />
        );
    }

    // Render Current Order Content (reusable for both desktop and modal)
    const renderCurrentOrder = () => (
        <div className="card" style={{
            height: '100%',
            maxHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: 'var(--spacing-md)',
            minHeight: 0
        }}>
            {/* Header - Fixed */}
            <div style={{ flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <h2 style={{ margin: 0 }}>Current Order</h2>
                    {/* Close button for mobile modal */}
                    <button
                        onClick={() => setShowOrderModal(false)}
                        className="mobile-only"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: 'var(--gray-700)',
                            padding: 'var(--spacing-xs)',
                            display: 'none'
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Order Type Selection */}
                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                        Order Type
                    </label>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <button
                            className={`btn ${orderType === 'dine-in' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setOrderType('dine-in')}
                            style={{ flex: 1 }}
                        >
                            🍽️ Dine-in
                        </button>
                        <button
                            className={`btn ${orderType === 'takeaway' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setOrderType('takeaway')}
                            style={{ flex: 1 }}
                        >
                            📦 Takeaway
                        </button>
                    </div>
                </div>
            </div>

            {/* Cart Items - Scrollable */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                minHeight: 0,
                marginBottom: 'var(--spacing-sm)',
                paddingRight: 'var(--spacing-xs)'
            }}>
                {cart.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: 'var(--spacing-xl)',
                        color: 'var(--gray-700)',
                        background: 'var(--gray-50)',
                        borderRadius: 'var(--radius-md)'
                    }}>
                        Cart is empty<br />
                        <small>Click on items to add</small>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item.product.id} className="cart-item">
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ 
                                    fontWeight: 500, 
                                    marginBottom: 'var(--spacing-xs)',
                                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                                }}>
                                    {item.product.name}
                                </div>
                                <div style={{ 
                                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', 
                                    color: 'var(--gray-700)' 
                                }}>
                                    {formatCurrency(item.product.price)} × {item.quantity}
                                </div>
                            </div>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 'var(--spacing-md)',
                                flexShrink: 0
                            }}>
                                <div className="quantity-controls">
                                    <button
                                        className="quantity-btn"
                                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                    >
                                        −
                                    </button>
                                    <span style={{ 
                                        fontWeight: 600, 
                                        minWidth: '20px', 
                                        textAlign: 'center',
                                        fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                                    }}>
                                        {item.quantity}
                                    </span>
                                    <button
                                        className="quantity-btn"
                                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                    >
                                        +
                                    </button>
                                </div>
                                <div style={{ 
                                    fontWeight: 700, 
                                    minWidth: '60px', 
                                    textAlign: 'right',
                                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                                }}>
                                    {formatCurrency(item.product.price * item.quantity)}
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.product.id)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--error)',
                                        cursor: 'pointer',
                                        fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
                                        padding: 'var(--spacing-xs)',
                                        minWidth: '32px',
                                        minHeight: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Bottom Section - Fixed */}
            <div style={{ 
                flexShrink: 0, 
                overflow: 'visible',
                marginTop: 'auto',
                paddingTop: 'var(--spacing-sm)'
            }}>
                {/* Notes */}
                <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                    <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                        Order Notes (Optional)
                    </label>
                    <textarea
                        className="input"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g., less oil, no onion"
                        rows={1}
                        style={{ resize: 'none', padding: 'var(--spacing-sm)' }}
                    />
                </div>

                {/* Total & Checkout */}
                <div style={{
                    paddingTop: 'var(--spacing-sm)',
                    borderTop: '2px solid var(--gray-200)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 'var(--spacing-sm)'
                    }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>Total</span>
                        <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {formatCurrency(getTotal())}
                        </span>
                    </div>
                    <button
                        className="btn btn-success btn-lg"
                        style={{ width: '100%' }}
                        disabled={cart.length === 0}
                        onClick={() => {
                            setShowOrderModal(false);
                            setShowCheckout(true);
                        }}
                    >
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container">
            <div className="pos-layout">
                {/* Left Side - Products */}
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%', 
                    maxHeight: '100%',
                    overflow: 'hidden',
                    minHeight: 0,
                    width: '100%'
                }}>
                    {/* Category Tabs */}
                    {categories.length > 0 && (
                        <div className="category-tabs" style={{ flexShrink: 0 }}>
                            {categories.map(category => (
                                <button
                                    key={category.id}
                                    className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(category.id)}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    )}
                    {categories.length === 0 && !loading && (
                        <div style={{ 
                            padding: 'var(--spacing-md)', 
                            background: 'var(--warning)', 
                            color: 'white', 
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--spacing-md)',
                            textAlign: 'center'
                        }}>
                            No categories found. Please seed the database or check your Supabase connection.
                        </div>
                    )}

                    {/* Products Grid - Scrollable */}
                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: 'var(--spacing-sm)' }}>
                        <div className="grid grid-3">
                            {filteredProducts.map(product => (
                                <div
                                    key={product.id}
                                    className="product-card"
                                    onClick={() => addToCart(product)}
                                >
                                    <h3 style={{ marginBottom: 'var(--spacing-sm)', fontSize: '1rem' }}>
                                        {product.name}
                                    </h3>
                                    <div style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 700,
                                        color: 'var(--primary)'
                                    }}>
                                        {formatCurrency(product.price)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredProducts.length === 0 && (
                            <div style={{
                                textAlign: 'center',
                                padding: 'var(--spacing-xl)',
                                color: 'var(--gray-700)'
                            }}>
                                No products available in this category
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side - Cart (Desktop Only) */}
                <div className="desktop-only" style={{ 
                    height: '100%', 
                    maxHeight: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    overflow: 'hidden',
                    minHeight: 0
                }}>
                    {renderCurrentOrder()}
                </div>
            </div>

            {/* Floating Action Button (Mobile Only) */}
            <button
                className="mobile-only cart-fab"
                onClick={() => setShowOrderModal(true)}
                style={{
                    position: 'fixed',
                    bottom: 'var(--spacing-lg)',
                    right: 'var(--spacing-lg)',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--bg-gradient-purple)',
                    border: 'none',
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-xl)',
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 999,
                    transition: 'var(--transition)'
                }}
            >
                <div style={{ position: 'relative' }}>
                    🛒
                    {getCartItemCount() > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            background: 'var(--error)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700
                        }}>
                            {getCartItemCount()}
                        </span>
                    )}
                </div>
                {getTotal() > 0 && (
                    <div style={{
                        position: 'absolute',
                        bottom: '-8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'white',
                        color: 'var(--primary)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        {formatCurrency(getTotal())}
                    </div>
                )}
            </button>

            {/* Full Screen Order Modal (Mobile Only) */}
            {showOrderModal && (
                <div 
                    className="mobile-only order-modal-overlay"
                    onClick={() => setShowOrderModal(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 1000,
                        display: 'none',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'var(--spacing-md)'
                    }}
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            height: '100%',
                            maxWidth: '100%',
                            maxHeight: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                    >
                        {renderCurrentOrder()}
                    </div>
                </div>
            )}
        </div>
    );
}
