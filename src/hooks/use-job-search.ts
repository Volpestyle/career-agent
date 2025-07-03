import { useState, useEffect, useCallback } from "react";
import { JobSearchParams, Job } from "@/types";
import { jobSearchStorage } from "@/lib/job-search-storage";

export function useJobSearch(sessionId?: string) {
  const [jobSearchParams, setJobSearchParams] =
    useState<JobSearchParams | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Load job search data
  useEffect(() => {
    if (sessionId) {
      const loadJobSearchParams = async () => {
        const loadedJobSearchParams = await jobSearchStorage.getJobSearchParams(
          sessionId
        );
        if (loadedJobSearchParams) {
          setJobSearchParams(loadedJobSearchParams);
          const searchJobs = await jobSearchStorage.getJobsBySearch(sessionId);
          setJobs(searchJobs);
        }
      };
      loadJobSearchParams();
    }
  }, [sessionId]);

  // Start or resume a search
  const startSearch = useCallback(async () => {
    if (!jobSearchParams) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/search/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: jobSearchParams.id }),
      });

      if (response.ok) {
        const result = await response.json();
        setActiveSessionId(result.sessionId);
        // Update local jobSearchParams status
        setJobSearchParams((prev) =>
          prev ? { ...prev, status: "running" } : null
        );
      }
    } catch (error) {
      console.error("Error starting search:", error);
    } finally {
      setIsLoading(false);
    }
  }, [jobSearchParams]);

  // Pause search
  const pauseSearch = useCallback(async () => {
    if (!activeSessionId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search/${activeSessionId}/pause`, {
        method: "POST",
      });

      if (response.ok) {
        setJobSearchParams((prev) =>
          prev ? { ...prev, status: "paused" } : null
        );
      }
    } catch (error) {
      console.error("Error pausing search:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeSessionId]);

  // Stop search
  const stopSearch = useCallback(async () => {
    if (!activeSessionId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search/${activeSessionId}/stop`, {
        method: "POST",
      });

      if (response.ok) {
        setJobSearchParams((prev) =>
          prev ? { ...prev, status: "stopped" } : null
        );
        setActiveSessionId(null);
      }
    } catch (error) {
      console.error("Error stopping search:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeSessionId]);

  // Save a job
  const saveJob = useCallback(async (job: Job) => {
    const savedJob = await jobSearchStorage.saveJob(job);
    setJobs((prev) => [...prev, savedJob]);
  }, []);

  // Subscribe to real-time events
  useEffect(() => {
    if (!activeSessionId) return;

    const eventSource = new EventSource(
      `/api/search/${activeSessionId}/events`
    );

    eventSource.addEventListener("jobs_extracted", (event) => {
      const data = JSON.parse(event.data);
      if (data.jobs) {
        setJobs((prev) => [...prev, ...data.jobs]);
      }
    });

    eventSource.addEventListener("session_updated", (event) => {
      const data = JSON.parse(event.data);
      if (data.session) {
        // Update job count in local jobSearchParams state
        setJobSearchParams((prev) =>
          prev ? { ...prev, jobsFound: data.session.jobsFound } : null
        );
      }
    });

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [activeSessionId]);

  return {
    jobSearchParams,
    jobs,
    isLoading,
    activeSessionId,
    startSearch,
    pauseSearch,
    stopSearch,
    saveJob,
  };
}

export function useAllJobSearchParams() {
  const [jobSearchParams, setJobSearchParams] = useState<JobSearchParams[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load job search params from storage
    const loadJobSearchParams = async () => {
      const allJobSearchParams = await jobSearchStorage.getAllJobSearchParams();
      setJobSearchParams(allJobSearchParams);
      setIsLoading(false);
    };
    loadJobSearchParams();
  }, []);

  const createJobSearchParams = useCallback(
    async (
      searchParams: Omit<
        JobSearchParams,
        "id" | "status" | "createdAt" | "updatedAt" | "jobsFound"
      >
    ) => {
      const newJobSearchParams: JobSearchParams = {
        id: `search_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        ...searchParams,
        status: "idle",
        createdAt: new Date(),
        updatedAt: new Date(),
        jobsFound: 0,
      };

      const created = await jobSearchStorage.createJobSearchParams(
        newJobSearchParams
      );
      setJobSearchParams((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const deleteJobSearchParams = useCallback(async (id: string) => {
    await jobSearchStorage.deleteJobSearchParams(id);
    setJobSearchParams((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    jobSearchParams,
    isLoading,
    createJobSearchParams,
    deleteJobSearchParams,
  };
}
