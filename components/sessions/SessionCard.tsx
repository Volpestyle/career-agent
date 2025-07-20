import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Session } from "@/lib/types";
import {
  Play,
  Pause,
  Square,
  Clock,
  Briefcase,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SessionCardProps {
  session: Session;
  onPause?: (sessionId: string) => void;
  onResume?: (sessionId: string) => void;
  onStop?: (sessionId: string) => void;
}

const getStatusIcon = (status: Session["status"]) => {
  switch (status) {
    case "active":
      return <Play className="h-3 w-3" />;
    case "paused":
      return <Pause className="h-3 w-3" />;
    case "completed":
      return <CheckCircle className="h-3 w-3" />;
    case "failed":
      return <XCircle className="h-3 w-3" />;
    case "starting":
      return <Loader2 className="h-3 w-3 animate-spin" />;
    default:
      return <Clock className="h-3 w-3" />;
  }
};

const getStatusVariant = (
  status: Session["status"]
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "active":
      return "default";
    case "paused":
      return "secondary";
    case "completed":
      return "outline";
    case "failed":
      return "destructive";
    case "starting":
      return "secondary";
    default:
      return "outline";
  }
};

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onPause,
  onResume,
  onStop,
}) => {
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  const isActive = session.status === "active";
  const isPaused = session.status === "paused";
  const canControl = isActive || isPaused;

  return (
    <Link href={`/sessions/${session.id}`} className="block">
      <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-heading truncate">
                {session.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground font-body mt-1 line-clamp-2">
                {session.description || "No description provided"}
              </p>
            </div>
            <Badge
              variant={getStatusVariant(session.status)}
              className="ml-2 font-body flex items-center gap-1"
            >
              {getStatusIcon(session.status)}
              {session.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Thumbnail */}
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            {session.thumbnailUrl ? (
              <img
                src={session.thumbnailUrl}
                alt={`${session.name} thumbnail`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-body">
              <span>Progress</span>
              <span>{session.progress}%</span>
            </div>
            <Progress value={session.progress} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm font-body">
            <div className="space-y-1">
              <p className="text-muted-foreground">Jobs Found</p>
              <p className="font-medium">{session.jobsFound}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Applied</p>
              <p className="font-medium">{session.jobsApplied}</p>
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
            <Clock className="h-3 w-3" />
            <span>
              Started{" "}
              {formatDistanceToNow(session.startTime, { addSuffix: true })}
            </span>
          </div>

          {/* Action Buttons */}
          {canControl && (
            <div className="flex items-center gap-2 pt-2">
              {isActive && onPause && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) =>
                    handleActionClick(e, () => onPause(session.id))
                  }
                  className="flex-1"
                >
                  <Pause className="h-3 w-3 mr-1" />
                  Pause
                </Button>
              )}
              {isPaused && onResume && (
                <Button
                  size="sm"
                  variant="yellow"
                  onClick={(e) =>
                    handleActionClick(e, () => onResume(session.id))
                  }
                  className="flex-1"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Resume
                </Button>
              )}
              {onStop && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) =>
                    handleActionClick(e, () => onStop(session.id))
                  }
                  className="flex-1"
                >
                  <Square className="h-3 w-3 mr-1" />
                  Stop
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
