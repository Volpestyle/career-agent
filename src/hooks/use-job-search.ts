import { useState, useEffect, useCallback } from 'react';
import { JobSearchSession, Job, JobExtractionEvent, SearchStatusEvent } from '@/types';
import { jobStorage } from '@/lib/job-storage';

export function useJobSearch(sessionId?: string) {
  const [session, setSession] = useState<JobSearchSession | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load session data
  useEffect(() => {
    if (sessionId) {
      const loadedSession = jobStorage.getSession(sessionId);
      if (loadedSession) {
        setSession(loadedSession);
        setJobs(jobStorage.getJobsBySession(sessionId));
      }
    }
  }, [sessionId]);

  // Start or resume a search
  const startSearch = useCallback(async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/search/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      });

      if (response.ok) {
        const updatedSession = await response.json();
        setSession(updatedSession);
        jobStorage.updateSession(session.id, updatedSession);
      }
    } catch (error) {
      console.error('Error starting search:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Pause search
  const pauseSearch = useCallback(async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search/${session.id}/pause`, {
        method: 'POST',
      });

      if (response.ok) {
        const updatedSession = await response.json();
        setSession(updatedSession);
        jobStorage.updateSession(session.id, updatedSession);
      }
    } catch (error) {
      console.error('Error pausing search:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Stop search
  const stopSearch = useCallback(async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search/${session.id}/stop`, {
        method: 'POST',
      });

      if (response.ok) {
        const updatedSession = await response.json();
        setSession(updatedSession);
        jobStorage.updateSession(session.id, updatedSession);
      }
    } catch (error) {
      console.error('Error stopping search:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Save a job
  const saveJob = useCallback((job: Job) => {
    const savedJob = jobStorage.saveJob(job);
    setJobs((prev) => [...prev, savedJob]);
  }, []);

  // Subscribe to real-time events
  useEffect(() => {
    if (!sessionId) return;

    const eventSource = new EventSource(`/api/search/${sessionId}/events`);

    eventSource.addEventListener('job-extracted', (event) => {
      const data: JobExtractionEvent = JSON.parse(event.data);
      setJobs((prev) => [...prev, data.job]);
    });

    eventSource.addEventListener('status-update', (event) => {
      const data: SearchStatusEvent = JSON.parse(event.data);
      setSession((prev) =>
        prev ? { ...prev, status: data.status, updatedAt: new Date() } : null
      );
    });

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId]);

  return {
    session,
    jobs,
    isLoading,
    startSearch,
    pauseSearch,
    stopSearch,
    saveJob,
  };
}

export function useAllSessions() {
  const [sessions, setSessions] = useState<JobSearchSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load sessions from storage
    setSessions(jobStorage.getAllSessions());
    setIsLoading(false);
  }, []);

  const createSession = useCallback(
    async (params: JobSearchSession['searchParams']) => {
      const newSession: JobSearchSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        searchParams: params,
        status: 'running',
        startedAt: new Date(),
        updatedAt: new Date(),
        jobsFound: 0,
        sessionId: `stagehand_${Date.now()}`,
      };

      const created = jobStorage.createSession(newSession);
      setSessions((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const deleteSession = useCallback((id: string) => {
    jobStorage.deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    sessions,
    isLoading,
    createSession,
    deleteSession,
  };
}