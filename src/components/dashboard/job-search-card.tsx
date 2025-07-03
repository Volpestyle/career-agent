"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrowserSession } from "@wallcrawler/infra-common";
import {
  PlayIcon,
  PauseIcon,
  SquareIcon,
  BriefcaseIcon,
  ClockIcon,
  MapPinIcon,
} from "lucide-react";
import Link from "next/link";

interface JobSearchCardProps {
  session: BrowserSession;
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
  const getStatusIcon = () => {
    switch (session.status) {
      case "running":
        return (
          <div className="animate-pulse h-2 w-2 rounded-full bg-green-500" />
        );
      case "paused":
        return <div className="h-2 w-2 rounded-full bg-yellow-500" />;
      case "stopped":
        return <div className="h-2 w-2 rounded-full bg-red-500" />;
      case "failed":
        return <div className="h-2 w-2 rounded-full bg-red-500" />;
      default:
        return <div className="h-2 w-2 rounded-full bg-gray-500" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <BriefcaseIcon className="h-5 w-5" />
              Session {session.id.split("_")[1]}
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2">
              <MapPinIcon className="h-4 w-4" />
              Task ID: {session.taskId}
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
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <BriefcaseIcon className="h-4 w-4" />
                {session.itemsProcessed} jobs found
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                {formatTimeAgo(session.startedAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/search/${session.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </Link>

            {session.status === "running" && (
              <Button
                size="icon"
                variant="outline"
                onClick={onPause}
                title="Pause search"
              >
                <PauseIcon className="h-4 w-4" />
              </Button>
            )}

            {session.status === "paused" && (
              <Button
                size="icon"
                variant="outline"
                onClick={onPlay}
                title="Resume search"
              >
                <PlayIcon className="h-4 w-4" />
              </Button>
            )}

            {(session.status === "running" || session.status === "paused") && (
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
