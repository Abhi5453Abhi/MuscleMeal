// Utility functions for the POS system

// IST timezone constant (UTC+5:30)
const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Get current date/time in IST
 * Returns a Date object that represents the current IST moment
 */
export function getNowIST(): Date {
    const now = new Date();
    // Get IST time as a formatted string
    const istString = now.toLocaleString('en-US', { 
        timeZone: IST_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    // Parse the IST string (format: "MM/DD/YYYY, HH:MM:SS")
    const [datePart, timePart] = istString.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hour, minute, second] = timePart.split(':');
    
    // Create a date string in ISO format with IST offset
    // Format: YYYY-MM-DDTHH:MM:SS+05:30
    const istISOString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}+05:30`;
    
    // Create Date object from IST string (JavaScript will convert to UTC internally)
    return new Date(istISOString);
}

/**
 * Convert a date to IST
 */
export function toIST(date: string | Date): Date {
    const d = typeof date === 'string' ? new Date(date) : date;
    // Get IST time components
    const istString = d.toLocaleString('en-US', { 
        timeZone: IST_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    const [datePart, timePart] = istString.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hour, minute, second] = timePart.split(':');
    
    const istISOString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}+05:30`;
    
    return new Date(istISOString);
}

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount: number): string {
    return `₹${amount.toFixed(0)}`;
}

/**
 * Format date and time in IST
 */
export function formatDateTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-IN', {
        timeZone: IST_TIMEZONE,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Format date only in IST
 */
export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-IN', {
        timeZone: IST_TIMEZONE,
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * Format time only in IST
 */
export function formatTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-IN', {
        timeZone: IST_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Generate bill number
 * Format: YYYYMMDD-XXXX where XXXX is sequential number for the day
 * Uses IST timezone for date
 */
export function generateBillNumber(orderCount: number): string {
    const now = getNowIST();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    const sequence = String(orderCount + 1).padStart(4, '0');
    return `${dateStr}-${sequence}`;
}

/**
 * Get today's date in YYYY-MM-DD format (using IST timezone)
 */
export function getTodayDate(): string {
    const now = getNowIST();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get start and end of day timestamps in IST
 * Returns ISO strings for proper database comparison
 */
export function getDayBounds(dateStr: string): { start: string; end: string } {
    // Parse the date string
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Create date strings in IST timezone (UTC+5:30)
    const startDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00+05:30`;
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T23:59:59.999+05:30`;
    
    // Convert to Date objects and then to ISO strings
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    return {
        start: startDate.toISOString(),
        end: endDate.toISOString()
    };
}

/**
 * Get start and end of week timestamps (Monday to Sunday) in IST
 */
export function getWeekBounds(dateStr: string): { start: string; end: string } {
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Create date in IST
    const dateStrIST = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00+05:30`;
    const date = new Date(dateStrIST);
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    
    const mondayDate = new Date(date);
    mondayDate.setDate(diff);
    mondayDate.setHours(0, 0, 0, 0);
    
    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(mondayDate.getDate() + 6);
    sundayDate.setHours(23, 59, 59, 999);
    
    return {
        start: mondayDate.toISOString(),
        end: sundayDate.toISOString()
    };
}

/**
 * Get start and end of month timestamps in IST
 */
export function getMonthBounds(dateStr: string): { start: string; end: string } {
    const [year, month] = dateStr.split('-').map(Number);
    
    // Create dates in IST
    const startStr = `${year}-${String(month).padStart(2, '0')}-01T00:00:00+05:30`;
    const start = new Date(startStr);
    
    // Get last day of month
    const lastDay = new Date(year, month, 0).getDate();
    const endStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59+05:30`;
    const end = new Date(endStr);
    
    return {
        start: start.toISOString(),
        end: end.toISOString()
    };
}

/**
 * Get array of dates for a date range in IST
 */
export function getDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(`${startDate}T00:00:00+05:30`);
    const end = new Date(`${endDate}T23:59:59+05:30`);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        // Format date in IST
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
    }
    
    return dates;
}

/**
 * Get current timestamp in IST as ISO string
 */
export function getNowISTISO(): string {
    return getNowIST().toISOString();
}
