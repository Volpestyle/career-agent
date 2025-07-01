export interface JobSearchSession {
  id: string;
  searchParams: JobSearchParams;
  status: 'running' | 'paused' | 'stopped' | 'completed';
  startedAt: Date;
  updatedAt: Date;
  jobsFound: number;
  sessionId: string; // Stagehand session ID
  viewportUrl?: string; // For streaming the browser view
}

export interface JobSearchParams {
  keywords: string[];
  location: string;
  jobType: 'remote' | 'onsite' | 'hybrid' | 'any';
  experienceLevel: ('entry' | 'mid' | 'senior' | 'executive')[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  platforms: JobPlatform[];
}

export interface JobPlatform {
  name: 'linkedin' | 'indeed' | 'glassdoor' | 'angellist' | 'dice' | 'monster';
  enabled: boolean;
  searchUrl?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: 'remote' | 'onsite' | 'hybrid';
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
  applicationMethod?: 'manual' | 'automated';
  searchSessionId: string;
}

export interface ApplicationStatus {
  status: 'pending' | 'applied' | 'rejected' | 'interview' | 'offer';
  notes?: string;
  updatedAt: Date;
}

export interface ViewportControl {
  action: 'play' | 'pause' | 'stop';
  timestamp: Date;
}

export interface JobExtractionEvent {
  sessionId: string;
  job: Job;
  timestamp: Date;
}

export interface SearchStatusEvent {
  sessionId: string;
  status: JobSearchSession['status'];
  message?: string;
  timestamp: Date;
}

export interface StagehandConfig {
  provider: 'local' | 'aws';
  apiKey?: string;
  model?: string;
  headless?: boolean;
}