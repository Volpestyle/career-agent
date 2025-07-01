import { NextRequest, NextResponse } from 'next/server';
import { jobStorage } from '@/lib/job-storage';
import { getRedisClient, RedisConnectionManager } from '@/lib/redis-client';
import { randomUUID } from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;
  const connectionId = randomUUID();
  
  // Verify session exists
  const session = jobStorage.getSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  const encoder = new TextEncoder();
  let subscriber: any;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Set up Redis subscriber
        const redis = await getRedisClient();
        subscriber = redis.duplicate();
        await subscriber.connect();

        // Register this connection
        await RedisConnectionManager.addConnection(sessionId, connectionId);

        // Subscribe to events for this session
        await subscriber.subscribe(`sse:session:${sessionId}`, (message: string) => {
          try {
            controller.enqueue(encoder.encode(`data: ${message}\n\n`));
          } catch (error) {
            console.error('Error sending event to client:', error);
          }
        });

        // Send initial connection event
        const data = JSON.stringify({
          type: 'connected',
          sessionId,
          connectionId,
          timestamp: new Date().toISOString(),
        });
        
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));

        // Send periodic heartbeat
        const heartbeat = setInterval(() => {
          try {
            const heartbeatData = JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString(),
            });
            controller.enqueue(encoder.encode(`data: ${heartbeatData}\n\n`));
          } catch (error) {
            clearInterval(heartbeat);
          }
        }, 30000); // Every 30 seconds

        // Clean up on close
        request.signal.addEventListener('abort', async () => {
          clearInterval(heartbeat);
          
          try {
            await RedisConnectionManager.removeConnection(sessionId, connectionId);
            if (subscriber) {
              await subscriber.unsubscribe(`sse:session:${sessionId}`);
              await subscriber.quit();
            }
            controller.close();
          } catch (error) {
            console.error('Error cleaning up SSE connection:', error);
          }
        });

      } catch (error) {
        console.error('Error setting up SSE connection:', error);
        controller.error(error);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Helper function to send events to all connected clients via Redis
export async function sendEventToSession(
  sessionId: string,
  eventType: string,
  data: any
) {
  try {
    await RedisConnectionManager.publishEvent(sessionId, eventType, data);
  } catch (error) {
    console.error('Error publishing event to session:', error);
  }
}