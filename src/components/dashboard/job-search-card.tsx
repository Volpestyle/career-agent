'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { JobSearchSession } from '@/types';
import {
  PlayIcon,
  PauseIcon,
  SquareIcon,
  BriefcaseIcon,
  ClockIcon,
  MapPinIcon,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from '@/lib/utils';

interface JobSearchCardProps {
  session: JobSearchSession;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
}

export function JobSearchCard({
  session,
  onPlay,
  onPause,
  onStop,
}: JobSearchCardProps) {
  const getStatusColor = () => {
    switch (session.status) {
      case 'running':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'stopped':
        return 'bg-red-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (session.status) {
      case 'running':
        return <div className="animate-pulse h-2 w-2 rounded-full bg-green-500" />;
      case 'paused':
        return <div className="h-2 w-2 rounded-full bg-yellow-500" />;
      case 'stopped':
        return <div className="h-2 w-2 rounded-full bg-red-500" />;
      case 'completed':
        return <div className="h-2 w-2 rounded-full bg-blue-500" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <BriefcaseIcon className="h-5 w-5" />
              {session.searchParams.keywords.join(', ')}
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2">
              <MapPinIcon className="h-4 w-4" />
              {session.searchParams.location}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge variant="outline" className="capitalize">
              {session.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {session.searchParams.jobType === 'any' ? 'All Types' : session.searchParams.jobType}
            </Badge>
            {session.searchParams.experienceLevel.map((level) => (
              <Badge key={level} variant="secondary" className="capitalize">
                {level}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <BriefcaseIcon className="h-4 w-4" />
                {session.jobsFound} jobs found
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                {formatDistanceToNow(new Date(session.startedAt))}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/search/${session.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </Link>
            
            {session.status === 'running' && (
              <Button
                size="icon"
                variant="outline"
                onClick={onPause}
                title="Pause search"
              >
                <PauseIcon className="h-4 w-4" />
              </Button>
            )}
            
            {session.status === 'paused' && (
              <Button
                size="icon"
                variant="outline"
                onClick={onPlay}
                title="Resume search"
              >
                <PlayIcon className="h-4 w-4" />
              </Button>
            )}
            
            {(session.status === 'running' || session.status === 'paused') && (
              <Button
                size="icon"
                variant="outline"
                onClick={onStop}
                title="Stop search"
              >
                <SquareIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}