'use client';

import { Job } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookmarkIcon,
  ExternalLinkIcon,
  MapPinIcon,
  CalendarIcon,
  BuildingIcon,
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

interface JobsExtractedListProps {
  jobs: Job[];
  isLoading?: boolean;
  onSaveJob?: (job: Job) => void;
  onViewDetails?: (job: Job) => void;
}

export function JobsExtractedList({
  jobs,
  isLoading,
  onSaveJob,
  onViewDetails,
}: JobsExtractedListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No jobs extracted yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Jobs will appear here as they are found
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Job Title</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Posted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell onClick={() => onViewDetails?.(job)}>
                <div className="space-y-1">
                  <div className="font-medium">{job.title}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {job.platform}
                    </Badge>
                    {job.jobType !== 'onsite' && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {job.jobType}
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell onClick={() => onViewDetails?.(job)}>
                <div className="flex items-center gap-1 text-sm">
                  <BuildingIcon className="h-3 w-3" />
                  {job.company}
                </div>
              </TableCell>
              <TableCell onClick={() => onViewDetails?.(job)}>
                <div className="flex items-center gap-1 text-sm">
                  <MapPinIcon className="h-3 w-3" />
                  {job.location}
                </div>
              </TableCell>
              <TableCell onClick={() => onViewDetails?.(job)}>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <CalendarIcon className="h-3 w-3" />
                  {formatDistanceToNow(new Date(job.extractedAt))}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSaveJob?.(job);
                    }}
                    disabled={!!job.savedAt}
                    title={job.savedAt ? 'Already saved' : 'Save job'}
                  >
                    <BookmarkIcon
                      className={`h-4 w-4 ${
                        job.savedAt ? 'fill-current' : ''
                      }`}
                    />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(job.url, '_blank');
                    }}
                    title="Open job in new tab"
                  >
                    <ExternalLinkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}