'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useJobSearch } from '@/hooks/use-job-search';
import { ViewportContainer } from '@/components/search/viewport-container';
import { PlaybackControls } from '@/components/search/playback-controls';
import { JobsExtractedList } from '@/components/search/jobs-extracted-list';
import { JobDetailsModal } from '@/components/jobs/job-details-modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeftIcon, MapPinIcon, BriefcaseIcon } from 'lucide-react';
import { Job } from '@/types';

export default function SearchDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { session, jobs, isLoading, startSearch, pauseSearch, stopSearch, saveJob } = 
    useJobSearch(params.id);
  
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);

  const handleRestart = async () => {
    if (session?.status === 'stopped' || session?.status === 'completed') {
      await startSearch();
    }
  };

  const handleSaveJob = (job: Job) => {
    saveJob(job);
    // Optionally close the modal after saving
    if (selectedJob?.id === job.id) {
      setIsJobModalOpen(false);
    }
  };

  const handleViewJobDetails = (job: Job) => {
    setSelectedJob(job);
    setIsJobModalOpen(true);
  };

  if (!session && !isLoading) {
    router.push('/');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        
        {session ? (
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BriefcaseIcon className="h-8 w-8" />
              {session.searchParams.keywords.join(', ')}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPinIcon className="h-4 w-4" />
                {session.searchParams.location}
              </div>
              <Badge variant="outline" className="capitalize">
                {session.searchParams.jobType === 'any' ? 'All Types' : session.searchParams.jobType}
              </Badge>
              {session.searchParams.experienceLevel.map((level) => (
                <Badge key={level} variant="outline" className="capitalize">
                  {level}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-10 w-96" />
            <Skeleton className="h-6 w-64" />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Viewport and Controls */}
        <div className="space-y-4">
          <ViewportContainer
            viewportUrl={session?.viewportUrl}
            sessionId={params.id}
            isConnected={session?.status === 'running' || session?.status === 'paused'}
          />
          
          {session && (
            <PlaybackControls
              session={session}
              onPlay={startSearch}
              onPause={pauseSearch}
              onStop={stopSearch}
              onRestart={handleRestart}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Jobs Section */}
        <Card>
          <CardHeader>
            <CardTitle>Extracted Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">
                  All ({jobs.length})
                </TabsTrigger>
                <TabsTrigger value="saved">
                  Saved ({jobs.filter(j => j.savedAt).length})
                </TabsTrigger>
                <TabsTrigger value="applied">
                  Applied ({jobs.filter(j => j.appliedAt).length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                <JobsExtractedList
                  jobs={jobs}
                  isLoading={isLoading && jobs.length === 0}
                  onSaveJob={handleSaveJob}
                  onViewDetails={handleViewJobDetails}
                />
              </TabsContent>
              
              <TabsContent value="saved" className="mt-4">
                <JobsExtractedList
                  jobs={jobs.filter(j => j.savedAt)}
                  isLoading={false}
                  onSaveJob={handleSaveJob}
                  onViewDetails={handleViewJobDetails}
                />
              </TabsContent>
              
              <TabsContent value="applied" className="mt-4">
                <JobsExtractedList
                  jobs={jobs.filter(j => j.appliedAt)}
                  isLoading={false}
                  onSaveJob={handleSaveJob}
                  onViewDetails={handleViewJobDetails}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        onSave={handleSaveJob}
      />
    </div>
  );
}