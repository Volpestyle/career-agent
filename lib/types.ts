export interface Session {
    id: string;
    name: string;
    status: 'active' | 'paused' | 'completed' | 'failed' | 'starting';
    startTime: Date;
    endTime?: Date;
    progress: number; // 0-100
    thumbnailUrl?: string;
    streamUrl?: string;
    jobsFound: number;
    jobsApplied: number;
    description?: string;
    userId: string;
    environment: 'dev' | 'staging' | 'production';
    region: string;
}

export interface CommandLogEntry {
    id: string;
    timestamp: Date;
    command: string;
    response?: string;
    type: 'sent' | 'received' | 'error' | 'info';
    duration?: number; // in milliseconds
    sessionId: string;
}

export interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    salary?: string;
    status: 'found' | 'applied' | 'saved' | 'rejected';
    description?: string;
    url: string;
    postedDate?: Date;
    foundAt: Date;
    sessionId: string;
    applicationDeadline?: Date;
    remote: boolean;
    jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
}

export interface SessionFilters {
    status?: Session['status'][];
    dateRange?: {
        start: Date;
        end: Date;
    };
    search?: string;
}

export interface JobFilters {
    status?: Job['status'][];
    remote?: boolean;
    jobType?: Job['jobType'][];
    salaryRange?: {
        min: number;
        max: number;
    };
    search?: string;
}

export interface CreateSessionRequest {
    name: string;
    description?: string;
    jobSearchCriteria: {
        jobTitle: string;
        location: string;
        remote: boolean;
        keywords?: string[];
        excludeKeywords?: string[];
    };
}

export interface SessionStats {
    totalSessions: number;
    activeSessions: number;
    totalJobsFound: number;
    totalJobsApplied: number;
    averageSessionDuration: number; // in minutes
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
} 