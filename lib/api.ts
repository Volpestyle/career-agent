import {
    Session,
    Job,
    CommandLogEntry,
    CreateSessionRequest,
    SessionStats,
    ApiResponse,
    PaginatedResponse,
    PaginationParams,
    SessionFilters,
    JobFilters
} from './types';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
const API_KEY = process.env.NEXT_PUBLIC_WALLCRAWLER_API_KEY;

class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public code?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// Generic API request function
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...(API_KEY && { 'X-API-Key': API_KEY }),
        ...options.headers,
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new ApiError(
                data.message || `HTTP ${response.status}`,
                response.status,
                data.code
            );
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        // Network or parsing errors
        throw new ApiError(
            error instanceof Error ? error.message : 'Unknown error occurred',
            0
        );
    }
}

// Session API functions
export const sessionApi = {
    // Get all sessions with optional filtering and pagination
    async getSessions(
        filters?: SessionFilters,
        pagination?: PaginationParams
    ): Promise<PaginatedResponse<Session>> {
        const params = new URLSearchParams();

        if (pagination) {
            params.append('page', pagination.page.toString());
            params.append('limit', pagination.limit.toString());
            if (pagination.sortBy) params.append('sortBy', pagination.sortBy);
            if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder);
        }

        if (filters) {
            if (filters.status) {
                filters.status.forEach(status => params.append('status', status));
            }
            if (filters.search) params.append('search', filters.search);
            if (filters.dateRange) {
                params.append('startDate', filters.dateRange.start.toISOString());
                params.append('endDate', filters.dateRange.end.toISOString());
            }
        }

        const response = await apiRequest<PaginatedResponse<Session>>(
            `/sessions?${params.toString()}`
        );

        if (!response.success || !response.data) {
            throw new ApiError('Failed to fetch sessions', 500);
        }

        // Transform date strings back to Date objects
        const transformedData = {
            ...response.data,
            data: response.data.data.map(session => ({
                ...session,
                startTime: new Date(session.startTime),
                endTime: session.endTime ? new Date(session.endTime) : undefined,
            }))
        };

        return transformedData;
    },

    // Get a specific session by ID
    async getSession(sessionId: string): Promise<Session> {
        const response = await apiRequest<Session>(`/sessions/${sessionId}`);

        if (!response.success || !response.data) {
            throw new ApiError('Session not found', 404);
        }

        // Transform date strings back to Date objects
        return {
            ...response.data,
            startTime: new Date(response.data.startTime),
            endTime: response.data.endTime ? new Date(response.data.endTime) : undefined,
        };
    },

    // Create a new session
    async createSession(request: CreateSessionRequest): Promise<Session> {
        const response = await apiRequest<Session>('/sessions', {
            method: 'POST',
            body: JSON.stringify(request),
        });

        if (!response.success || !response.data) {
            throw new ApiError('Failed to create session', 500);
        }

        return {
            ...response.data,
            startTime: new Date(response.data.startTime),
            endTime: response.data.endTime ? new Date(response.data.endTime) : undefined,
        };
    },

    // Update session status
    async updateSessionStatus(
        sessionId: string,
        status: Session['status']
    ): Promise<Session> {
        const response = await apiRequest<Session>(`/sessions/${sessionId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });

        if (!response.success || !response.data) {
            throw new ApiError('Failed to update session status', 500);
        }

        return {
            ...response.data,
            startTime: new Date(response.data.startTime),
            endTime: response.data.endTime ? new Date(response.data.endTime) : undefined,
        };
    },

    // Delete a session
    async deleteSession(sessionId: string): Promise<void> {
        const response = await apiRequest<void>(`/sessions/${sessionId}`, {
            method: 'DELETE',
        });

        if (!response.success) {
            throw new ApiError('Failed to delete session', 500);
        }
    },

    // Get session statistics
    async getSessionStats(): Promise<SessionStats> {
        const response = await apiRequest<SessionStats>('/sessions/stats');

        if (!response.success || !response.data) {
            throw new ApiError('Failed to fetch session stats', 500);
        }

        return response.data;
    },
};

// Job API functions
export const jobApi = {
    // Get jobs for a specific session
    async getSessionJobs(
        sessionId: string,
        filters?: JobFilters,
        pagination?: PaginationParams
    ): Promise<PaginatedResponse<Job>> {
        const params = new URLSearchParams();

        if (pagination) {
            params.append('page', pagination.page.toString());
            params.append('limit', pagination.limit.toString());
            if (pagination.sortBy) params.append('sortBy', pagination.sortBy);
            if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder);
        }

        if (filters) {
            if (filters.status) {
                filters.status.forEach(status => params.append('status', status));
            }
            if (filters.remote !== undefined) params.append('remote', filters.remote.toString());
            if (filters.jobType) {
                filters.jobType.forEach(type => params.append('jobType', type));
            }
            if (filters.search) params.append('search', filters.search);
            if (filters.salaryRange) {
                params.append('minSalary', filters.salaryRange.min.toString());
                params.append('maxSalary', filters.salaryRange.max.toString());
            }
        }

        const response = await apiRequest<PaginatedResponse<Job>>(
            `/sessions/${sessionId}/jobs?${params.toString()}`
        );

        if (!response.success || !response.data) {
            throw new ApiError('Failed to fetch jobs', 500);
        }

        // Transform date strings back to Date objects
        const transformedData = {
            ...response.data,
            data: response.data.data.map(job => ({
                ...job,
                foundAt: new Date(job.foundAt),
                postedDate: job.postedDate ? new Date(job.postedDate) : undefined,
                applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline) : undefined,
            }))
        };

        return transformedData;
    },

    // Update job status
    async updateJobStatus(
        jobId: string,
        status: Job['status']
    ): Promise<Job> {
        const response = await apiRequest<Job>(`/jobs/${jobId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });

        if (!response.success || !response.data) {
            throw new ApiError('Failed to update job status', 500);
        }

        return {
            ...response.data,
            foundAt: new Date(response.data.foundAt),
            postedDate: response.data.postedDate ? new Date(response.data.postedDate) : undefined,
            applicationDeadline: response.data.applicationDeadline ? new Date(response.data.applicationDeadline) : undefined,
        };
    },

    // Bulk update job statuses
    async updateJobStatuses(
        jobIds: string[],
        status: Job['status']
    ): Promise<Job[]> {
        const response = await apiRequest<Job[]>('/jobs/bulk-update', {
            method: 'PATCH',
            body: JSON.stringify({ jobIds, status }),
        });

        if (!response.success || !response.data) {
            throw new ApiError('Failed to update job statuses', 500);
        }

        return response.data.map(job => ({
            ...job,
            foundAt: new Date(job.foundAt),
            postedDate: job.postedDate ? new Date(job.postedDate) : undefined,
            applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline) : undefined,
        }));
    },
};

// Command Log API functions
export const commandLogApi = {
    // Get command logs for a session
    async getSessionLogs(
        sessionId: string,
        pagination?: PaginationParams
    ): Promise<PaginatedResponse<CommandLogEntry>> {
        const params = new URLSearchParams();

        if (pagination) {
            params.append('page', pagination.page.toString());
            params.append('limit', pagination.limit.toString());
            if (pagination.sortBy) params.append('sortBy', pagination.sortBy);
            if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder);
        }

        const response = await apiRequest<PaginatedResponse<CommandLogEntry>>(
            `/sessions/${sessionId}/logs?${params.toString()}`
        );

        if (!response.success || !response.data) {
            throw new ApiError('Failed to fetch command logs', 500);
        }

        // Transform date strings back to Date objects
        const transformedData = {
            ...response.data,
            data: response.data.data.map(log => ({
                ...log,
                timestamp: new Date(log.timestamp),
            }))
        };

        return transformedData;
    },

    // Subscribe to real-time logs (WebSocket)
    subscribeToLogs(
        sessionId: string,
        onLog: (log: CommandLogEntry) => void,
        onError?: (error: Error) => void
    ): () => void {
        const wsUrl = `${process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://localhost:3000'}/ws/sessions/${sessionId}/logs`;
        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
            try {
                const log = JSON.parse(event.data);
                onLog({
                    ...log,
                    timestamp: new Date(log.timestamp),
                });
            } catch (error) {
                onError?.(new Error('Failed to parse log message'));
            }
        };

        ws.onerror = () => {
            onError?.(new Error('WebSocket connection error'));
        };

        // Return cleanup function
        return () => {
            ws.close();
        };
    },
};

// Export ApiError for error handling
export { ApiError }; 