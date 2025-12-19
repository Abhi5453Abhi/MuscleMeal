// Notification service for broadcasting order notifications
// Store active SSE connections
// Using a global variable that persists across requests in the same Node.js process
declare global {
    var __notificationConnections: Set<ReadableStreamDefaultController> | undefined;
}

// Initialize connections set (persists across hot reloads in development)
if (!global.__notificationConnections) {
    global.__notificationConnections = new Set<ReadableStreamDefaultController>();
}

const connections = global.__notificationConnections;

// Broadcast notification to all connected clients
export function broadcastNotification(data: any) {
    console.log(`[Notification] Broadcasting to ${connections.size} connected clients`);
    
    if (connections.size === 0) {
        console.log('[Notification] No active connections, skipping broadcast');
        return; // No active connections
    }

    const message = `data: ${JSON.stringify(data)}\n\n`;
    const deadConnections: ReadableStreamDefaultController[] = [];

    connections.forEach((controller) => {
        try {
            controller.enqueue(new TextEncoder().encode(message));
            console.log('[Notification] Message sent to client');
        } catch (error) {
            console.error('[Notification] Error sending message:', error);
            // Connection closed, mark for removal
            deadConnections.push(controller);
        }
    });

    // Remove dead connections
    deadConnections.forEach((controller) => {
        connections.delete(controller);
        console.log('[Notification] Removed dead connection');
    });
    
    console.log(`[Notification] Broadcast complete. Active connections: ${connections.size}`);
}

// Add a connection to the set
export function addConnection(controller: ReadableStreamDefaultController) {
    connections.add(controller);
    console.log(`[Notification] Connection added. Total connections: ${connections.size}`);
}

// Remove a connection from the set
export function removeConnection(controller: ReadableStreamDefaultController) {
    connections.delete(controller);
    console.log(`[Notification] Connection removed. Total connections: ${connections.size}`);
}

// Get count of active connections
export function getConnectionCount(): number {
    return connections.size;
}

