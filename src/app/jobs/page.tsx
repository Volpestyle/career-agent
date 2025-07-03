'use client';

import { useState } from 'react';
import { useSavedJobs } from '@/hooks/use-saved-jobs';
import { SavedJobsTable } from '@/components/jobs/saved-jobs-table';
import { JobDetailsModal } from '@/components/jobs/job-details-modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftIcon, BriefcaseIcon, RocketIcon } from 'lucide-react';
import Link from 'next/link';
import { Job } from '@/types';

export default function SavedJobsPage() {
  const {
    jobs,
    applyToJob,
    updateJobStatus,
    deleteJob,
    stats,
  } = useSavedJobs();

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);

  const handleViewJobDetails = (job: Job) => {
    setSelectedJob(job);
    setIsJobModalOpen(true);
  };

  const handleApply = async (job: Job, method: 'manual' | 'automated') => {
    setIsApplying(true);
    try {
      await applyToJob(job.id, method);
      if (method === 'manual') {
        // Open the job URL for manual application
        window.open(job.url, '_blank');
      }
      // Close modal after applying
      setIsJobModalOpen(false);
    } catch (error) {
      console.error('Error applying to job:', error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BriefcaseIcon className="h-8 w-8" />
              Saved Jobs
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and apply to your saved job opportunities
            </p>
          </div>
          <Button className="mt-4 sm:mt-0" disabled>
            <RocketIcon className="mr-2 h-4 w-4" />
            Bulk Apply (Coming Soon)
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Applied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.applied}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {Object.entries(stats.byPlatform).map(([platform, count]) => (
                <Badge key={platform} variant="secondary" className="text-xs">
                  {platform}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Saved Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <SavedJobsTable
            jobs={jobs}
            onApply={handleApply}
            onUpdateStatus={updateJobStatus}
            onDelete={deleteJob}
            onViewDetails={handleViewJobDetails}
          />
        </CardContent>
      </Card>

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        onApply={handleApply}
      />
    </div>
  );
}