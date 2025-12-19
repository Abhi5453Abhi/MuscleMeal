'use client';

import { useState, useEffect } from 'react';
import { Product, Category } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function ProductManagement() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        category_id: 0,
        price: 0,
        stock_quantity: 0,
        low_stock_threshold: 10
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [categoriesRes, productsRes] = await Promise.all([
                fetch('/api/categories'),
                fetch('/api/products')
            ]);

            const categoriesData = await categoriesRes.json();
            const productsData = await productsRes.json();

            setCategories(categoriesData);
            setProducts(productsData);

            if (categoriesData.length > 0) {
                setSelectedCategory(categoriesData[0].id);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            category_id: categories[0]?.id || 0,
            price: 0,
            stock_quantity: 0,
            low_stock_threshold: 10
        });
        setShowModal(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            category_id: product.category_id,
            price: product.price,
            stock_quantity: product.stock_quantity ?? 0,
            low_stock_threshold: product.low_stock_threshold ?? 10
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = '/api/products';
            const method = editingProduct ? 'PUT' : 'POST';
            const body = editingProduct
                ? { id: editingProduct.id, ...formData }
                : formData;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                await loadData();
                setShowModal(false);
            } else {
                alert('Failed to save product');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error saving product');
        }
    };

    const toggleEnabled = async (product: Product) => {
        try {
            const response = await fetch('/api/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: product.id,
                    enabled: !product.enabled
                })
            });

            if (response.ok) {
                await loadData();
            }
        } catch (error) {
            console.error('Error toggling product:', error);
        }
    };

    const deleteProduct = async (product: Product) => {
        if (!confirm(`Delete "${product.name}"?`)) return;

        try {
            const response = await fetch(`/api/products?id=${product.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadData();
            } else {
                alert('Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error deleting product');
        }
    };

    const filteredProducts = products.filter(p => {
        if (selectedCategory && p.category_id !== selectedCategory) return false;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return p.name.toLowerCase().includes(query) || 
                   (p.category_name && p.category_name.toLowerCase().includes(query));
        }
        return true;
    });

    if (loading) {
        return (
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                    <div className="loader"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-lg)'
            }}>
                <h1>Product Management</h1>
                <button className="btn btn-primary" onClick={openAddModal}>
                    + Add Product
                </button>
            </div>

            {/* Search Bar */}
            <div style={{ 
                marginBottom: 'var(--spacing-lg)',
                position: 'relative'
            }}>
                <input
                    type="text"
                    className="input"
                    placeholder="🔍 Search products by name or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        paddingLeft: '2.5rem',
                        fontSize: '0.938rem'
                    }}
                />
                <div style={{
                    position: 'absolute',
                    left: 'var(--spacing-md)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--gray-500)',
                    pointerEvents: 'none'
                }}>
                    🔍
                </div>
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        style={{
                            position: 'absolute',
                            right: 'var(--spacing-md)',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--gray-500)',
                            fontSize: '1.25rem',
                            padding: 'var(--spacing-xs)'
                        }}
                    >
                        ×
                    </button>
                )}
            </div>

            {/* Category Tabs */}
            <div className="category-tabs">
                <button
                    className={`category-tab ${selectedCategory === null ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(null)}
                >
                    All
                </button>
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

            {/* Products Table */}
            <div className="card">
                <table style={{ width: '100%' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--gray-200)', textAlign: 'left' }}>
                            <th style={{ padding: 'var(--spacing-md)' }}>Product Name</th>
                            <th style={{ padding: 'var(--spacing-md)' }}>Category</th>
                            <th style={{ padding: 'var(--spacing-md)' }}>Price</th>
                            <th style={{ padding: 'var(--spacing-md)' }}>Stock</th>
                            <th style={{ padding: 'var(--spacing-md)' }}>Status</th>
                            <th style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => (
                            <tr key={product.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                                <td style={{ padding: 'var(--spacing-md)', fontWeight: 500 }}>
                                    {product.name}
                                </td>
                                <td style={{ padding: 'var(--spacing-md)', color: 'var(--gray-700)' }}>
                                    {product.category_name}
                                </td>
                                <td style={{ padding: 'var(--spacing-md)', fontWeight: 600 }}>
                                    {formatCurrency(product.price)}
                                </td>
                                <td style={{ padding: 'var(--spacing-md)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontWeight: 600 }}>
                                            {product.stock_quantity ?? 0}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                                            Threshold: {product.low_stock_threshold ?? 10}
                                        </span>
                                    </div>
                                </td>
                                <td style={{ padding: 'var(--spacing-md)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span className={`badge ${product.enabled ? 'badge-success' : 'badge-warning'}`}>
                                            {product.enabled ? '✓ Active' : '✗ Disabled'}
                                        </span>
                                        {(product.stock_quantity ?? 0) <= (product.low_stock_threshold ?? 10) && (
                                            <span className={`badge ${
                                                (product.stock_quantity ?? 0) === 0 ? 'badge-error' : 'badge-warning'
                                            }`} style={{ fontSize: '0.75rem' }}>
                                                {(product.stock_quantity ?? 0) === 0 ? 'Out of Stock' : 'Low Stock'}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => toggleEnabled(product)}
                                        >
                                            {product.enabled ? 'Disable' : 'Enable'}
                                        </button>
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => openEditModal(product)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => deleteProduct(product)}
                                            style={{ color: 'var(--error)' }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredProducts.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: 'var(--spacing-xl)',
                        color: 'var(--gray-700)'
                    }}>
                        {searchQuery ? `No products found matching "${searchQuery}"` : 'No products in this category'}
                    </div>
                )}
            </div>

            {/* Add/Edit Product Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>
                            {editingProduct ? 'Edit Product' : 'Add New Product'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                    Product Name
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Enter product name"
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                    Category
                                </label>
                                <select
                                    className="input"
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                                    required
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                    Price (₹)
                                </label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                    required
                                    min="0"
                                    step="1"
                                    placeholder="Enter price"
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                    Initial Stock Quantity
                                </label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.stock_quantity}
                                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    placeholder="Enter initial stock"
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                    Low Stock Threshold
                                </label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.low_stock_threshold}
                                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 10 })}
                                    min="0"
                                    placeholder="Alert when stock falls below this"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    {editingProduct ? 'Update Product' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
