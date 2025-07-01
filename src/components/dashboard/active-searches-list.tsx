'use client';

import { JobSearchSession } from '@/types';
import { JobSearchCard } from './job-search-card';
import { Skeleton } from '@/components/ui/skeleton';

interface ActiveSearchesListProps {
  sessions: JobSearchSession[];
  isLoading: boolean;
  onPlay?: (sessionId: string) => void;
  onPause?: (sessionId: string) => void;
  onStop?: (sessionId: string) => void;
}

export function ActiveSearchesList({
  sessions,
  isLoading,
  onPlay,
  onPause,
  onStop,
}: ActiveSearchesListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No active job searches</p>
        <p className="text-sm text-muted-foreground mt-1">
          Start a new search to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session) => (
        <JobSearchCard
          key={session.id}
          session={session}
          onPlay={() => onPlay?.(session.id)}
          onPause={() => onPause?.(session.id)}
          onStop={() => onStop?.(session.id)}
        />
      ))}
    </div>
  );
}