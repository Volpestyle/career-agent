import { useState, useEffect, useCallback } from "react";
import { Job, ApplicationStatus } from "@/types";
import { jobSearchStorage } from "@/lib/job-search-storage";

export function useSavedJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load all saved jobs from storage
    const loadSavedJobs = async () => {
      try {
        const savedJobs = await jobSearchStorage.getSavedJobs();
        setJobs(savedJobs);
      } catch (error) {
        console.error("Error loading saved jobs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSavedJobs();
  }, []);

  const applyToJob = useCallback(async (job: Job, method: "manual" | "automated") => {
    try {
      const status: ApplicationStatus = {
        status: "applied",
        updatedAt: new Date(),
        notes: `Applied via ${method} method`,
      };
      
      const updatedJob = await jobSearchStorage.updateJobApplication(job.id, status, method);
      if (updatedJob) {
        setJobs((prev) => 
          prev.map((j) => j.id === job.id ? updatedJob : j)
        );
      }
      
      return updatedJob;
    } catch (error) {
      console.error("Error applying to job:", error);
      throw error;
    }
  }, []);

  const updateJobStatus = useCallback(async (jobId: string, status: ApplicationStatus) => {
    try {
      const updatedJob = await jobSearchStorage.updateJob(jobId, {
        applicationStatus: status,
      });
      
      if (updatedJob) {
        setJobs((prev) => 
          prev.map((j) => j.id === jobId ? updatedJob : j)
        );
      }
      
      return updatedJob;
    } catch (error) {
      console.error("Error updating job status:", error);
      throw error;
    }
  }, []);

  const deleteJob = useCallback(async (jobId: string) => {
    try {
      const success = await jobSearchStorage.deleteJob(jobId);
      if (success) {
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
      }
      return success;
    } catch (error) {
      console.error("Error deleting job:", error);
      throw error;
    }
  }, []);

  const refreshJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const savedJobs = await jobSearchStorage.getSavedJobs();
      setJobs(savedJobs);
    } catch (error) {
      console.error("Error refreshing jobs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchJobs = useCallback(async (query: string) => {
    try {
      const searchResults = await jobSearchStorage.searchJobs(query);
      return searchResults;
    } catch (error) {
      console.error("Error searching jobs:", error);
      return [];
    }
  }, []);

  return {
    jobs,
    isLoading,
    applyToJob,
    updateJobStatus,
    deleteJob,
    refreshJobs,
    searchJobs,
  };
}