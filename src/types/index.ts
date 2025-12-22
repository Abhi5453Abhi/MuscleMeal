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
    stock_quantity?: number;
    low_stock_threshold?: number;
    created_at: string;
}

export interface Customer {
    id: number;
    phone_number: string;
    name: string;
    advance_balance: number;
    created_at: string;
    updated_at: string;
}

export interface Order {
    id: number;
    bill_number: string;
    order_type: 'dine-in' | 'takeaway';
    payment_mode: 'cash' | 'upi';
    total_amount: number;
    notes?: string;
    status: 'pending' | 'completed';
    customer_id?: number;
    advance_used?: number;
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

export interface OrderNotification {
    type: 'order_completed';
    order: OrderWithItems;
    timestamp: string;
    message: string;
}

export interface SalesTrendData {
    date: string;
    revenue: number;
    orders: number;
}

export interface BestSellingProduct {
    product_id: number;
    product_name: string;
    total_quantity: number;
    total_revenue: number;
    order_count: number;
}

export interface PeakHourData {
    hour: number;
    revenue: number;
    orders: number;
}

export interface AnalyticsData {
    sales_trends: SalesTrendData[];
    best_selling_products: BestSellingProduct[];
    peak_hours: PeakHourData[];
    period: 'daily' | 'weekly' | 'monthly';
    start_date: string;
    end_date: string;
}

export interface InventoryHistory {
    id: number;
    product_id: number;
    change_type: 'purchase' | 'sale' | 'adjustment' | 'initial';
    quantity_change: number;
    previous_stock: number;
    new_stock: number;
    reference_order_id?: number;
    notes?: string;
    created_by?: number;
    created_at: string;
}

export interface InventoryNotification {
    id: number;
    product_id: number;
    product_name: string;
    current_stock: number;
    threshold: number;
    notification_type: 'low_stock' | 'out_of_stock';
    acknowledged: boolean;
    acknowledged_by?: number;
    acknowledged_at?: string;
    created_at: string;
}

export interface InventoryReport {
    product_id: number;
    product_name: string;
    category_name?: string;
    current_stock: number;
    low_stock_threshold: number;
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
    total_sold: number;
    last_updated: string;
}

export interface Expense {
    id: number;
    description: string;
    amount: number;
    category?: string;
    expense_date: string;
    notes?: string;
    created_by: number;
    created_at: string;
}

export interface ProfitLossData {
    period: string;
    revenue: number;
    expenses: number;
    profit: number;
    profit_percentage: number;
}
