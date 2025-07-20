import React, { useEffect, useRef } from "react";
import { CommandLogEntry } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Terminal,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Info,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CommandLogProps {
  logs: CommandLogEntry[];
  isLive?: boolean;
  maxHeight?: string;
}

const getLogIcon = (type: CommandLogEntry["type"]) => {
  switch (type) {
    case "sent":
      return <ArrowRight className="h-3 w-3 text-blue-500" />;
    case "received":
      return <ArrowLeft className="h-3 w-3 text-green-500" />;
    case "error":
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    case "info":
      return <Info className="h-3 w-3 text-gray-500" />;
    default:
      return <Terminal className="h-3 w-3 text-gray-500" />;
  }
};

const getLogBadgeVariant = (
  type: CommandLogEntry["type"]
): "default" | "secondary" | "destructive" | "outline" => {
  switch (type) {
    case "sent":
      return "default";
    case "received":
      return "outline";
    case "error":
      return "destructive";
    case "info":
      return "secondary";
    default:
      return "secondary";
  }
};

const formatDuration = (duration?: number): string => {
  if (!duration) return "";
  if (duration < 1000) return `${duration}ms`;
  return `${(duration / 1000).toFixed(1)}s`;
};

export const CommandLog: React.FC<CommandLogProps> = ({
  logs,
  isLive = false,
  maxHeight = "h-96",
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const endOfLogsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isLive && endOfLogsRef.current) {
      endOfLogsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isLive]);

  if (logs.length === 0) {
    return (
      <div
        className={`${maxHeight} flex flex-col items-center justify-center text-muted-foreground`}
      >
        <Terminal className="h-8 w-8 mb-2" />
        <p className="text-sm font-body">No commands logged yet</p>
        {isLive && (
          <p className="text-xs text-muted-foreground mt-1">
            Commands will appear here as they execute
          </p>
        )}
      </div>
    );
  }

  return (
    <ScrollArea className={`${maxHeight} w-full`} ref={scrollAreaRef}>
      <div className="space-y-3 p-1">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex flex-col space-y-2 p-3 bg-muted/30 rounded-lg border"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getLogIcon(log.type)}
                <Badge
                  variant={getLogBadgeVariant(log.type)}
                  className="text-xs font-body"
                >
                  {log.type.toUpperCase()}
                </Badge>
                {log.duration && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatDuration(log.duration)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-body">
                <Clock className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Command */}
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-body uppercase tracking-wide">
                Command
              </div>
              <div className="bg-black/10 dark:bg-white/10 rounded p-2">
                <code className="text-sm font-mono text-foreground break-all">
                  {log.command}
                </code>
              </div>
            </div>

            {/* Response */}
            {log.response && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground font-body uppercase tracking-wide">
                  Response
                </div>
                <div className="bg-black/10 dark:bg-white/10 rounded p-2">
                  <code className="text-sm font-mono text-foreground break-all">
                    {log.response}
                  </code>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Auto-scroll target */}
        <div ref={endOfLogsRef} />
      </div>
    </ScrollArea>
  );
};
