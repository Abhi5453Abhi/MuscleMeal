// Notifications API - Server-Sent Events for real-time order notifications
import { NextRequest } from 'next/server';
import { addConnection, removeConnection } from '@/lib/notifications';

// GET - SSE endpoint for listening to notifications
export async function GET(request: NextRequest) {
    console.log('[Notifications API] New SSE connection request');
    
    const stream = new ReadableStream({
        start(controller) {
            console.log('[Notifications API] Starting SSE stream');
            // Add connection to set
            addConnection(controller);

            // Send initial connection message
            const welcomeMessage = `data: ${JSON.stringify({ type: 'connected', message: 'Notification stream connected' })}\n\n`;
            try {
                controller.enqueue(new TextEncoder().encode(welcomeMessage));
                console.log('[Notifications API] Welcome message sent');
            } catch (error) {
                console.error('[Notifications API] Error sending welcome message:', error);
            }

            // Handle client disconnect
            request.signal.addEventListener('abort', () => {
                console.log('[Notifications API] Client disconnected');
                removeConnection(controller);
                try {
                    controller.close();
                } catch (error) {
                    // Already closed
                    console.log('[Notifications API] Controller already closed');
                }
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable buffering in nginx
        },
    });
}

