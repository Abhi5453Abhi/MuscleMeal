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

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        category_id: 0,
        price: 0
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
            price: 0
        });
        setShowModal(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            category_id: product.category_id,
            price: product.price
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

    const filteredProducts = selectedCategory
        ? products.filter(p => p.category_id === selectedCategory)
        : products;

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

            {/* Category Tabs */}
            <div className="category-tabs">
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
                                    <span className={`badge ${product.enabled ? 'badge-success' : 'badge-warning'}`}>
                                        {product.enabled ? '✓ Active' : '✗ Disabled'}
                                    </span>
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
                        No products in this category
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

                            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
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
