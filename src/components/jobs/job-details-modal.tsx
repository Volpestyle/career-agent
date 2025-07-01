'use client';

import { Job } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MapPinIcon,
  BuildingIcon,
  CalendarIcon,
  ExternalLinkIcon,
  BookmarkIcon,
  BriefcaseIcon,
  DollarSignIcon,
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

interface JobDetailsModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (job: Job) => void;
  onApply?: (job: Job, method: 'manual' | 'automated') => void;
}

export function JobDetailsModal({
  job,
  isOpen,
  onClose,
  onSave,
  onApply,
}: JobDetailsModalProps) {
  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{job.title}</DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <BuildingIcon className="h-4 w-4" />
                {job.company}
              </div>
              <div className="flex items-center gap-1">
                <MapPinIcon className="h-4 w-4" />
                {job.location}
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Metadata */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{job.platform}</Badge>
            <Badge variant="outline" className="capitalize">
              {job.jobType}
            </Badge>
            {job.salary && (
              <Badge variant="outline">
                <DollarSignIcon className="mr-1 h-3 w-3" />
                {job.salary}
              </Badge>
            )}
            <Badge variant="outline">
              <CalendarIcon className="mr-1 h-3 w-3" />
              Posted {formatDistanceToNow(new Date(job.postedDate))}
            </Badge>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-3">
            <h3 className="font-semibold">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {job.description}
            </p>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Requirements</h3>
                <ul className="list-disc list-inside space-y-1">
                  {job.requirements.map((req, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Application Status */}
          {job.applicationStatus && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Application Status</h3>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      job.applicationStatus.status === 'applied'
                        ? 'default'
                        : job.applicationStatus.status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {job.applicationStatus.status}
                  </Badge>
                  {job.applicationMethod && (
                    <span className="text-sm text-muted-foreground">
                      via {job.applicationMethod} application
                    </span>
                  )}
                </div>
                {job.applicationStatus.notes && (
                  <p className="text-sm text-muted-foreground">
                    {job.applicationStatus.notes}
                  </p>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => window.open(job.url, '_blank')}
              className="flex-1"
            >
              <ExternalLinkIcon className="mr-2 h-4 w-4" />
              View Original
            </Button>
            
            {!job.savedAt && onSave && (
              <Button
                variant="outline"
                onClick={() => onSave(job)}
                className="flex-1"
              >
                <BookmarkIcon className="mr-2 h-4 w-4" />
                Save Job
              </Button>
            )}

            {!job.appliedAt && onApply && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => onApply(job, 'manual')}
                  className="flex-1"
                >
                  <BriefcaseIcon className="mr-2 h-4 w-4" />
                  Apply Manually
                </Button>
                <Button
                  variant="default"
                  onClick={() => onApply(job, 'automated')}
                  className="flex-1"
                >
                  <BriefcaseIcon className="mr-2 h-4 w-4" />
                  Auto Apply
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}