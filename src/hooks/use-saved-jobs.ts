import { useState, useEffect, useCallback } from 'react';
import { Job, ApplicationStatus } from '@/types';
import { jobStorage } from '@/lib/job-storage';

export function useSavedJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved jobs
  useEffect(() => {
    setJobs(jobStorage.getSavedJobs());
    setIsLoading(false);
  }, []);

  // Apply to a job
  const applyToJob = useCallback(
    async (jobId: string, method: 'manual' | 'automated') => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/jobs/${jobId}/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method }),
        });

        if (response.ok) {
          const updatedJob = await response.json();
          
          // Update local state
          const applicationStatus: ApplicationStatus = {
            status: 'applied',
            updatedAt: new Date(),
          };
          
          jobStorage.updateJobApplication(jobId, applicationStatus, method);
          setJobs((prev) =>
            prev.map((job) => (job.id === jobId ? updatedJob : job))
          );
        }
      } catch (error) {
        console.error('Error applying to job:', error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Update job status
  const updateJobStatus = useCallback(
    (jobId: string, status: ApplicationStatus) => {
      const updatedJob = jobStorage.updateJobApplication(
        jobId,
        status,
        'manual'
      );
      
      if (updatedJob) {
        setJobs((prev) =>
          prev.map((job) => (job.id === jobId ? updatedJob : job))
        );
      }
    },
    []
  );

  // Delete a saved job
  const deleteJob = useCallback((jobId: string) => {
    jobStorage.deleteJob(jobId);
    setJobs((prev) => prev.filter((job) => job.id !== jobId));
  }, []);

  // Filter jobs
  const filterJobs = useCallback(
    (filters: {
      platform?: string;
      applicationStatus?: ApplicationStatus['status'];
      jobType?: Job['jobType'];
    }) => {
      let filtered = jobStorage.getSavedJobs();

      if (filters.platform) {
        filtered = filtered.filter((job) => job.platform === filters.platform);
      }

      if (filters.applicationStatus) {
        filtered = filtered.filter(
          (job) => job.applicationStatus?.status === filters.applicationStatus
        );
      }

      if (filters.jobType) {
        filtered = filtered.filter((job) => job.jobType === filters.jobType);
      }

      setJobs(filtered);
    },
    []
  );

  // Search jobs
  const searchJobs = useCallback((query: string) => {
    if (!query.trim()) {
      setJobs(jobStorage.getSavedJobs());
      return;
    }
    
    const results = jobStorage.searchJobs(query);
    setJobs(results.filter((job) => job.savedAt));
  }, []);

  // Get statistics
  const getStats = useCallback(() => {
    const stats = jobStorage.getStats();
    return {
      total: jobs.length,
      applied: jobs.filter((job) => job.appliedAt).length,
      pending: jobs.filter((job) => !job.appliedAt).length,
      byPlatform: jobs.reduce((acc, job) => {
        acc[job.platform] = (acc[job.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }, [jobs]);

  return {
    jobs,
    isLoading,
    applyToJob,
    updateJobStatus,
    deleteJob,
    filterJobs,
    searchJobs,
    stats: getStats(),
  };
}