import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    redisClient.on('disconnect', () => {
      console.log('Redis Client Disconnected');
    });

    await redisClient.connect();
  }

  return redisClient;
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// Connection management utilities
export class RedisConnectionManager {
  private static connections = new Map<string, Set<string>>();

  static async addConnection(sessionId: string, connectionId: string): Promise<void> {
    const redis = await getRedisClient();
    
    // Store connection in Redis set
    await redis.sAdd(`sse:sessions:${sessionId}`, connectionId);
    
    // Also track in memory for cleanup
    if (!this.connections.has(sessionId)) {
      this.connections.set(sessionId, new Set());
    }
    this.connections.get(sessionId)!.add(connectionId);
  }

  static async removeConnection(sessionId: string, connectionId: string): Promise<void> {
    const redis = await getRedisClient();
    
    // Remove from Redis set
    await redis.sRem(`sse:sessions:${sessionId}`, connectionId);
    
    // Remove from memory tracking
    const sessionConnections = this.connections.get(sessionId);
    if (sessionConnections) {
      sessionConnections.delete(connectionId);
      if (sessionConnections.size === 0) {
        this.connections.delete(sessionId);
      }
    }
  }

  static async getConnections(sessionId: string): Promise<string[]> {
    const redis = await getRedisClient();
    return redis.sMembers(`sse:sessions:${sessionId}`);
  }

  static async cleanupSession(sessionId: string): Promise<void> {
    const redis = await getRedisClient();
    
    // Remove all connections for this session
    await redis.del(`sse:sessions:${sessionId}`);
    
    // Clean up memory tracking
    this.connections.delete(sessionId);
  }

  static async publishEvent(sessionId: string, eventType: string, data: any): Promise<void> {
    const redis = await getRedisClient();
    
    const eventData = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
    };

    // Publish to Redis channel for this session
    await redis.publish(`sse:session:${sessionId}`, JSON.stringify(eventData));
  }
}