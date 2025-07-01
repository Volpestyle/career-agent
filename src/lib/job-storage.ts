import { Job, JobSearchSession, ApplicationStatus } from '@/types';

// In-memory storage for demo (replace with database in production)
class JobStorage {
  private jobs: Map<string, Job> = new Map();
  private sessions: Map<string, JobSearchSession> = new Map();

  // Job Search Sessions
  createSession(session: JobSearchSession): JobSearchSession {
    this.sessions.set(session.id, session);
    return session;
  }

  getSession(id: string): JobSearchSession | undefined {
    return this.sessions.get(id);
  }

  updateSession(id: string, updates: Partial<JobSearchSession>): JobSearchSession | undefined {
    const session = this.sessions.get(id);
    if (session) {
      const updated = { ...session, ...updates, updatedAt: new Date() };
      this.sessions.set(id, updated);
      return updated;
    }
    return undefined;
  }

  getAllSessions(): JobSearchSession[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  getActiveSessions(): JobSearchSession[] {
    return this.getAllSessions().filter(
      (session) => session.status === 'running' || session.status === 'paused'
    );
  }

  // Jobs
  saveJob(job: Job): Job {
    job.savedAt = new Date();
    this.jobs.set(job.id, job);
    
    // Update session job count
    const session = this.sessions.get(job.searchSessionId);
    if (session) {
      this.updateSession(session.id, { jobsFound: session.jobsFound + 1 });
    }
    
    return job;
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  getSavedJobs(): Job[] {
    return Array.from(this.jobs.values())
      .filter((job) => job.savedAt)
      .sort((a, b) => (b.savedAt?.getTime() || 0) - (a.savedAt?.getTime() || 0));
  }

  getJobsBySession(sessionId: string): Job[] {
    return Array.from(this.jobs.values()).filter(
      (job) => job.searchSessionId === sessionId
    );
  }

  updateJob(id: string, updates: Partial<Job>): Job | undefined {
    const job = this.jobs.get(id);
    if (job) {
      const updated = { ...job, ...updates };
      this.jobs.set(id, updated);
      return updated;
    }
    return undefined;
  }

  updateJobApplication(
    jobId: string,
    status: ApplicationStatus,
    method: 'manual' | 'automated'
  ): Job | undefined {
    const job = this.jobs.get(jobId);
    if (job) {
      job.appliedAt = new Date();
      job.applicationStatus = status;
      job.applicationMethod = method;
      this.jobs.set(jobId, job);
      return job;
    }
    return undefined;
  }

  searchJobs(query: string): Job[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.jobs.values()).filter(
      (job) =>
        job.title.toLowerCase().includes(lowercaseQuery) ||
        job.company.toLowerCase().includes(lowercaseQuery) ||
        job.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Bulk operations
  saveMultipleJobs(jobs: Job[]): Job[] {
    return jobs.map((job) => this.saveJob(job));
  }

  deleteJob(id: string): boolean {
    return this.jobs.delete(id);
  }

  deleteSession(id: string): boolean {
    // Delete all jobs from this session
    const sessionJobs = this.getJobsBySession(id);
    sessionJobs.forEach((job) => this.jobs.delete(job.id));
    
    return this.sessions.delete(id);
  }

  // Statistics
  getStats() {
    const totalJobs = this.jobs.size;
    const savedJobs = this.getSavedJobs().length;
    const appliedJobs = Array.from(this.jobs.values()).filter(
      (job) => job.appliedAt
    ).length;
    const totalSessions = this.sessions.size;
    const activeSessions = this.getActiveSessions().length;

    return {
      totalJobs,
      savedJobs,
      appliedJobs,
      totalSessions,
      activeSessions,
    };
  }
}

// Export singleton instance
export const jobStorage = new JobStorage();