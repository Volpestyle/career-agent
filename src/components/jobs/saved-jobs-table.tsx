'use client';

import { useState } from 'react';
import { Job, ApplicationStatus } from '@/types';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ExternalLinkIcon,
  MoreHorizontalIcon,
  SearchIcon,
  TrashIcon,
  FileTextIcon,
  RocketIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

interface SavedJobsTableProps {
  jobs: Job[];
  onApply?: (job: Job, method: 'manual' | 'automated') => void;
  onUpdateStatus?: (jobId: string, status: ApplicationStatus) => void;
  onDelete?: (jobId: string) => void;
  onViewDetails?: (job: Job) => void;
}

export function SavedJobsTable({
  jobs,
  onApply,
  onUpdateStatus,
  onDelete,
  onViewDetails,
}: SavedJobsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterJobType, setFilterJobType] = useState<string>('all');

  // Get unique platforms
  const platforms = Array.from(new Set(jobs.map((job) => job.platform)));

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      searchQuery === '' ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlatform = filterPlatform === 'all' || job.platform === filterPlatform;
    
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'pending' && !job.appliedAt) ||
      (filterStatus === 'applied' && job.applicationStatus?.status === 'applied') ||
      (filterStatus === 'rejected' && job.applicationStatus?.status === 'rejected') ||
      (filterStatus === 'interview' && job.applicationStatus?.status === 'interview');

    const matchesJobType = filterJobType === 'all' || job.jobType === filterJobType;

    return matchesSearch && matchesPlatform && matchesStatus && matchesJobType;
  });

  const getStatusIcon = (status?: ApplicationStatus['status']) => {
    switch (status) {
      case 'applied':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />;
      case 'interview':
        return <UserIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status?: ApplicationStatus['status']) => {
    switch (status) {
      case 'applied':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'interview':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            {platforms.map((platform) => (
              <SelectItem key={platform} value={platform} className="capitalize">
                {platform}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterJobType} onValueChange={setFilterJobType}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Job Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="onsite">On-site</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Job Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Saved</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">No jobs found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredJobs.map((job) => (
                <TableRow
                  key={job.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onViewDetails?.(job)}
                >
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{job.title}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {job.platform}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {job.jobType}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{job.company}</TableCell>
                  <TableCell>{job.location}</TableCell>
                  <TableCell>
                    {job.appliedAt ? (
                      <Badge variant={getStatusColor(job.applicationStatus?.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(job.applicationStatus?.status)}
                          {job.applicationStatus?.status || 'Applied'}
                        </span>
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {job.savedAt && formatDistanceToNow(new Date(job.savedAt))}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(job.url, '_blank');
                          }}
                        >
                          <ExternalLinkIcon className="mr-2 h-4 w-4" />
                          View Original
                        </DropdownMenuItem>
                        
                        {!job.appliedAt && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onApply?.(job, 'manual');
                              }}
                            >
                              <FileTextIcon className="mr-2 h-4 w-4" />
                              Apply Manually
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onApply?.(job, 'automated');
                              }}
                            >
                              <RocketIcon className="mr-2 h-4 w-4" />
                              Auto Apply
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {job.appliedAt && onUpdateStatus && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateStatus(job.id, {
                                  status: 'interview',
                                  updatedAt: new Date(),
                                });
                              }}
                            >
                              Mark as Interview
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateStatus(job.id, {
                                  status: 'rejected',
                                  updatedAt: new Date(),
                                });
                              }}
                            >
                              Mark as Rejected
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(job.id);
                          }}
                        >
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}