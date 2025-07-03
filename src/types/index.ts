import { BrowserSession } from "@wallcrawler/infra-common";

// Persistent job search configuration (stored in DynamoDB)
export interface JobSearchParams {
  id: string;
  status: "idle" | "running" | "paused" | "stopped" | "completed";
  createdAt: Date;
  updatedAt: Date;
  jobsFound: number;
  // Search parameters
  keywords: string[];
  location: string;
  jobType: "remote" | "onsite" | "hybrid" | "any";
  experienceLevel: ("entry" | "mid" | "senior" | "executive")[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  platforms: JobPlatform[];
}

export interface JobPlatform {
  name: string;
  enabled: boolean;
  searchUrl?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: "remote" | "onsite" | "hybrid";
  salary?: string;
  description: string;
  requirements?: string[];
  url: string;
  platform: string;
  postedDate: string;
  extractedAt: Date;
  savedAt?: Date;
  appliedAt?: Date;
  applicationStatus?: ApplicationStatus;
  applicationMethod?: "manual" | "automated";
  sessionId: string;
}

export interface ApplicationStatus {
  status: "pending" | "applied" | "rejected" | "interview" | "offer";
  notes?: string;
  updatedAt: Date;
}

export interface ViewportControl {
  action: "play" | "pause" | "stop";
  timestamp: Date;
}

export interface JobExtractionEvent {
  sessionId: string;
  job: Job;
  timestamp: Date;
}

export interface SearchStatusEvent {
  sessionId: string;
  status: JobSearchParams["status"];
  message?: string;
  timestamp: Date;
}

// AutomationTask is now part of BrowserSession - no separate interface needed

export interface StagehandConfig {
  provider: "local" | "aws";
  apiKey?: string;
  model?: string;
  headless?: boolean;
}

// Redis Event System
export interface BaseEvent {
  type: string;
  timestamp: string;
  sessionId?: string;
}

export interface JobsExtractedEvent extends BaseEvent {
  type: "jobs_extracted";
  data: {
    jobs: Job[];
    totalJobsFound: number;
  };
}

export interface SessionUpdatedEvent extends BaseEvent {
  type: "session_updated";
  data: {
    session: BrowserSession;
  };
}

export interface JobSearchUpdatedEvent extends BaseEvent {
  type: "job_search_updated";
  data: {
    jobSearchParams: JobSearchParams;
  };
}

export interface AutomationStatusEvent extends BaseEvent {
  type: "automation_status";
  data: {
    status: "starting" | "running" | "stopping" | "stopped" | "failed";
    message?: string;
    taskArn?: string;
  };
}

export interface VncConnectionEvent extends BaseEvent {
  type: "vnc_connection";
  data: {
    status: "connected" | "disconnected" | "error";
    connectionId?: string;
    vncUrl?: string;
  };
}

export interface ErrorEvent extends BaseEvent {
  type: "error";
  data: {
    error: string;
    details?: string;
    component?: string;
  };
}

// Union type for all possible events
export type RedisEvent =
  | JobsExtractedEvent
  | SessionUpdatedEvent
  | JobSearchUpdatedEvent
  | AutomationStatusEvent
  | VncConnectionEvent
  | ErrorEvent;
