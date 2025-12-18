// TypeScript types for the POS system

export interface User {
    id: number;
    username: string;
    pin: string;
    role: 'admin' | 'cashier';
    created_at: string;
}

export interface Category {
    id: number;
    name: string;
    display_order: number;
}

export interface Product {
    id: number;
    name: string;
    category_id: number;
    category_name?: string;
    price: number;
    enabled: boolean;
    created_at: string;
}

export interface Order {
    id: number;
    bill_number: string;
    order_type: 'dine-in' | 'takeaway';
    payment_mode: 'cash' | 'upi';
    total_amount: number;
    notes?: string;
    status: 'pending' | 'completed';
    created_by: number;
    created_at: string;
}

export interface OrderItem {
    id: number;
    order_id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    price_at_time: number;
}

export interface OrderWithItems extends Order {
    items: OrderItem[];
}

export interface DailySales {
    date: string;
    total_sales: number;
    total_orders: number;
    cash_sales: number;
    upi_sales: number;
    cash_orders: number;
    upi_orders: number;
}

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface LoginRequest {
    username: string;
    pin: string;
}

export interface LoginResponse {
    success: boolean;
    user?: {
        id: number;
        username: string;
        role: 'admin' | 'cashier';
    };
    message?: string;
}
