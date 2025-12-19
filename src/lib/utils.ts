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
 * Uses local timezone for date
 */
export function generateBillNumber(orderCount: number): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    const sequence = String(orderCount + 1).padStart(4, '0');
    return `${dateStr}-${sequence}`;
}

/**
 * Get today's date in YYYY-MM-DD format (using local timezone)
 */
export function getTodayDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get start and end of day timestamps (using local timezone)
 * Returns ISO strings with timezone offset for proper database comparison
 */
export function getDayBounds(dateStr: string): { start: string; end: string } {
    // Parse the date string and create Date objects in local timezone
    const [year, month, day] = dateStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
    
    // Return ISO strings which include timezone info
    return {
        start: startDate.toISOString(),
        end: endDate.toISOString()
    };
}

/**
 * Get start and end of week timestamps (Monday to Sunday)
 * Uses local timezone
 */
export function getWeekBounds(dateStr: string): { start: string; end: string } {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(year, month - 1, diff, 0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return {
        start: monday.toISOString(),
        end: sunday.toISOString()
    };
}

/**
 * Get start and end of month timestamps
 * Uses local timezone
 */
export function getMonthBounds(dateStr: string): { start: string; end: string } {
    const [year, month] = dateStr.split('-').map(Number);
    
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    
    return {
        start: start.toISOString(),
        end: end.toISOString()
    };
}

/**
 * Get array of dates for a date range
 */
export function getDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
    }
    
    return dates;
}
