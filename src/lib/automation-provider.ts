/**
 * Career Agent Automation Provider Integration
 *
 * This module integrates the extracted wallcrawler infrastructure packages
 * with the career-agent application, providing a single point of access
 * to browser automation and session management capabilities.
 */

import {
  IBrowserAutomationProvider,
  ISessionStateManager,
} from "@wallcrawler/infra-common";

import { AwsBrowserAutomationProvider } from "@wallcrawler/infra-aws";

/**
 * Initialize the AWS Browser Automation Provider with career-agent configuration
 */
export const automationProvider: IBrowserAutomationProvider =
  new AwsBrowserAutomationProvider({
    // AWS Configuration
    region: process.env.AWS_REGION || "us-east-1",

    // Redis Configuration for Session State
    redis: {
      backend: "redis",
      connectionConfig: {
        url: process.env.REDIS_URL || "redis://localhost:6379",
      },
      redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
      sessionTtl: 4 * 60 * 60, // 4 hours (matches current implementation)
      taskTtl: 8 * 60 * 60, // 8 hours (matches current implementation)
      cleanupInterval: 60 * 60, // 1 hour cleanup interval
      keyPrefix: "career-agent",
    },

    // ECS Configuration
    ecs: {
      region: process.env.AWS_REGION || "us-east-1",
      clusterName:
        process.env.ECS_CLUSTER_NAME ||
        `career-agent-cluster-${process.env.NODE_ENV || "dev"}`,
      taskDefinition:
        process.env.ECS_TASK_DEFINITION ||
        `career-agent-automation-${process.env.NODE_ENV || "dev"}`,
      subnets: (process.env.ECS_SUBNETS || "").split(",").filter(Boolean),
      securityGroups: (process.env.ECS_SECURITY_GROUPS || "")
        .split(",")
        .filter(Boolean),
    },

    // Networking Configuration
    networking: {
      loadBalancerDns: process.env.AUTOMATION_LOAD_BALANCER_DNS,
    },

    // Container Communication Configuration
    container: {
      defaultPort: 3000,
      healthCheckPath: "/health",
      timeout: 30000, // 30 seconds
      retries: 3,
    },

    // Task monitoring configuration
    monitoring: {
      enabled: true,
      interval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
    },
  });

/**
 * Session State Manager - provides access to session and task management
 */
export const sessionStateManager: ISessionStateManager =
  automationProvider.getSessionStateManager();

/**
 * Environment-based provider factory
 * Allows switching between AWS and Local providers based on environment
 */
export function createAutomationProvider(): IBrowserAutomationProvider {
  const environment = process.env.AUTOMATION_PROVIDER || "aws";

  switch (environment) {
    case "aws":
      return automationProvider;
    case "local":
      // TODO: Add local provider for development
      throw new Error("Local provider not yet implemented");
    default:
      throw new Error(`Unknown automation provider: ${environment}`);
  }
}

/**
 * Convenience functions for common operations
 */
export const AutomationUtils = {
  /**
   * Start a new automation session with default configuration
   */
  async startSession(sessionId: string) {
    const taskInfo = await automationProvider.startAutomationTask({
      sessionId,
      environment: process.env.NODE_ENV || "development",
      region: process.env.AWS_REGION || "us-east-1",
    });

    return taskInfo;
  },

  /**
   * Stop an automation session gracefully
   */
  async stopSession(taskId: string, reason?: string) {
    await automationProvider.stopAutomationTask(taskId, reason);
  },

  /**
   * Get session health and status
   */
  async getSessionHealth(taskId: string) {
    return await automationProvider.getContainerHealth(taskId);
  },

  /**
   * Publish a real-time event to session subscribers
   */
  async publishSessionEvent(
    sessionId: string,
    eventType: string,
    data: Record<string, unknown>
  ) {
    await automationProvider.publishEvent(sessionId, eventType, data);
  },
};
