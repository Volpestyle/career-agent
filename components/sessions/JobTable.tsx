import React, { useState, useMemo } from "react";
import { Job } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  MapPin,
  DollarSign,
  Calendar,
  Building2,
  Clock,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface JobTableProps {
  jobs: Job[];
  selectedJobs: string[];
  onSelectionChange: (selectedJobIds: string[]) => void;
  onJobAction?: (jobId: string, action: "save" | "apply" | "reject") => void;
}

const getStatusBadgeVariant = (
  status: Job["status"]
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "found":
      return "secondary";
    case "saved":
      return "default";
    case "applied":
      return "outline";
    case "rejected":
      return "destructive";
    default:
      return "secondary";
  }
};

const getJobTypeBadge = (jobType: Job["jobType"]) => {
  const variants = {
    "full-time": "default",
    "part-time": "secondary",
    contract: "outline",
    internship: "destructive",
  } as const;

  return variants[jobType] || "secondary";
};

export const JobTable: React.FC<JobTableProps> = ({
  jobs,
  selectedJobs,
  onSelectionChange,
  onJobAction,
}) => {
  const [sortField, setSortField] = useState<keyof Job>("foundAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sortedJobs = useMemo(() => {
    return [...jobs].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [jobs, sortField, sortDirection]);

  const handleSort = (field: keyof Job) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(jobs.map((job) => job.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleJobSelect = (jobId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedJobs, jobId]);
    } else {
      onSelectionChange(selectedJobs.filter((id) => id !== jobId));
    }
  };

  const isAllSelected = jobs.length > 0 && selectedJobs.length === jobs.length;
  const isPartiallySelected =
    selectedJobs.length > 0 && selectedJobs.length < jobs.length;

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Building2 className="h-12 w-12 mb-4" />
        <h3 className="text-lg font-heading mb-2">No Jobs Found Yet</h3>
        <p className="text-sm font-body text-center max-w-md">
          Jobs will appear here as the automation session discovers them on job
          boards.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Header with Selection Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-heading">Found Jobs ({jobs.length})</h3>
          {selectedJobs.length > 0 && (
            <Badge variant="default" className="font-body">
              {selectedJobs.length} selected
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-3 w-3 mr-1" />
            Filter
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all jobs"
                />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort("title")}
              >
                <div className="flex items-center gap-1 font-subheading">
                  Job Title
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort("company")}
              >
                <div className="flex items-center gap-1 font-subheading">
                  Company
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort("foundAt")}
              >
                <div className="flex items-center gap-1 font-subheading">
                  Found
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedJobs.map((job) => (
              <TableRow
                key={job.id}
                className={selectedJobs.includes(job.id) ? "bg-muted/50" : ""}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedJobs.includes(job.id)}
                    onCheckedChange={(checked) =>
                      handleJobSelect(job.id, Boolean(checked))
                    }
                    aria-label={`Select ${job.title} at ${job.company}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium font-body truncate max-w-64">
                      {job.title}
                    </div>
                    {job.description && (
                      <div className="text-xs text-muted-foreground font-body line-clamp-2 max-w-64">
                        {job.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 font-body">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate max-w-32">{job.company}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 font-body">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate max-w-24">{job.location}</span>
                    {job.remote && (
                      <Badge variant="outline" className="text-xs">
                        Remote
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getJobTypeBadge(job.jobType)}
                    className="font-body text-xs"
                  >
                    {job.jobType}
                  </Badge>
                </TableCell>
                <TableCell>
                  {job.salary ? (
                    <div className="flex items-center gap-1 font-body">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{job.salary}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Not listed
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm font-body text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(job.foundAt, { addSuffix: true })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getStatusBadgeVariant(job.status)}
                    className="font-body"
                  >
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(job.url, "_blank")}
                      className="h-7 w-7 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    {onJobAction && job.status === "found" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onJobAction(job.id, "save")}
                        className="h-7 px-2 text-xs"
                      >
                        Save
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Action Bar */}
      {selectedJobs.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
          <span className="text-sm font-body">
            {selectedJobs.length} job{selectedJobs.length === 1 ? "" : "s"}{" "}
            selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectionChange([])}
            >
              Clear Selection
            </Button>
            <Button
              variant="yellow"
              size="sm"
              onClick={() => {
                selectedJobs.forEach((jobId) => {
                  if (onJobAction) onJobAction(jobId, "save");
                });
              }}
            >
              Save Selected
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
