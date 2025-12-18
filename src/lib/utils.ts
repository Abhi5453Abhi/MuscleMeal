// Utility functions for the POS system

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount: number): string {
    return `₹${amount.toFixed(0)}`;
}

/**
 * Format date and time
 */
export function formatDateTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Format date only
 */
export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * Format time only
 */
export function formatTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Generate bill number
 * Format: YYYYMMDD-XXXX where XXXX is sequential number for the day
 */
export function generateBillNumber(orderCount: number): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const sequence = String(orderCount + 1).padStart(4, '0');
    return `${dateStr}-${sequence}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get start and end of day timestamps
 */
export function getDayBounds(dateStr: string): { start: string; end: string } {
    const start = `${dateStr} 00:00:00`;
    const end = `${dateStr} 23:59:59`;
    return { start, end };
}
