"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScreencastViewer } from "@/components/sessions/ScreencastViewer";
import { CommandLog } from "@/components/sessions/CommandLog";
import { JobTable } from "@/components/sessions/JobTable";
import { Session, Job, CommandLogEntry } from "@/lib/types";
import { sessionApi, jobApi, commandLogApi, ApiError } from "@/lib/api";
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  RefreshCw,
  Calendar,
  Clock,
  Briefcase,
  Users,
  AlertCircle,
  Loader2,
  Settings,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export default function SessionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [logs, setLogs] = useState<CommandLogEntry[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load session data
  const loadSession = useCallback(async () => {
    try {
      const sessionData = await sessionApi.getSession(sessionId);
      setSession(sessionData);
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : "Failed to load session";
      setError(errorMessage);
      console.error("Error loading session:", err);
    }
  }, [sessionId]);

  // Load jobs
  const loadJobs = useCallback(async () => {
    try {
      const response = await jobApi.getSessionJobs(sessionId, undefined, {
        page: 1,
        limit: 100,
        sortBy: "foundAt",
        sortOrder: "desc",
      });
      setJobs(response.data);
    } catch (err) {
      console.error("Error loading jobs:", err);
      // Don't set error for jobs since it's not critical for the main view
    }
  }, [sessionId]);

  // Load command logs
  const loadLogs = useCallback(async () => {
    try {
      const response = await commandLogApi.getSessionLogs(sessionId, {
        page: 1,
        limit: 50,
        sortBy: "timestamp",
        sortOrder: "desc",
      });
      setLogs(response.data);
    } catch (err) {
      console.error("Error loading logs:", err);
      // Don't set error for logs since it's not critical for the main view
    }
  }, [sessionId]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadSession(), loadJobs(), loadLogs()]);
      setLoading(false);
    };

    loadData();
  }, [loadSession, loadJobs, loadLogs]);

  // Set up real-time log updates for active sessions
  useEffect(() => {
    if (!session || session.status !== "active") return;

    const unsubscribe = commandLogApi.subscribeToLogs(
      sessionId,
      (newLog) => {
        setLogs((prevLogs) => [newLog, ...prevLogs].slice(0, 50)); // Keep latest 50 logs
      },
      (error) => {
        console.error("WebSocket error:", error);
      }
    );

    return unsubscribe;
  }, [sessionId, session?.status]);

  // Refresh all data
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadSession(), loadJobs(), loadLogs()]);
    setRefreshing(false);
  };

  // Session control actions
  const handlePauseSession = async () => {
    if (!session) return;
    try {
      const updatedSession = await sessionApi.updateSessionStatus(
        sessionId,
        "paused"
      );
      setSession(updatedSession);
    } catch (err) {
      console.error("Error pausing session:", err);
    }
  };

  const handleResumeSession = async () => {
    if (!session) return;
    try {
      const updatedSession = await sessionApi.updateSessionStatus(
        sessionId,
        "active"
      );
      setSession(updatedSession);
    } catch (err) {
      console.error("Error resuming session:", err);
    }
  };

  const handleStopSession = async () => {
    if (!session) return;
    try {
      const updatedSession = await sessionApi.updateSessionStatus(
        sessionId,
        "completed"
      );
      setSession(updatedSession);
    } catch (err) {
      console.error("Error stopping session:", err);
    }
  };

  // Job actions
  const handleJobAction = async (
    jobId: string,
    action: "save" | "apply" | "reject"
  ) => {
    try {
      const updatedJob = await jobApi.updateJobStatus(
        jobId,
        action === "save"
          ? "saved"
          : action === "apply"
          ? "applied"
          : "rejected"
      );
      setJobs(jobs.map((job) => (job.id === jobId ? updatedJob : job)));

      // Update session stats
      if (session) {
        setSession({
          ...session,
          jobsApplied:
            action === "apply" ? session.jobsApplied + 1 : session.jobsApplied,
        });
      }
    } catch (err) {
      console.error("Error updating job:", err);
    }
  };

  const handleJobSelectionChange = (selectedJobIds: string[]) => {
    setSelectedJobs(selectedJobIds);
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-heading">Loading session details...</p>
            <p className="text-sm text-muted-foreground font-body">
              Connecting to session infrastructure
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center text-center pt-6">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <CardTitle className="font-heading mb-2">
                Session Not Found
              </CardTitle>
              <CardDescription className="font-body mb-6">
                {error ||
                  "The requested session could not be found or may have been deleted."}
              </CardDescription>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Go Back
                </Button>
                <Link href="/sessions">
                  <Button variant="yellow">View All Sessions</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isActive = session.status === "active";
  const isPaused = session.status === "paused";
  const canControl = isActive || isPaused;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-body">
        <Link
          href="/sessions"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Active Sessions
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground">{session.name}</span>
      </div>

      {/* Session Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-heading font-medium">
              {session.name}
            </h1>
            <Badge
              variant={
                session.status === "active"
                  ? "default"
                  : session.status === "paused"
                  ? "secondary"
                  : session.status === "completed"
                  ? "outline"
                  : "destructive"
              }
              className="font-body"
            >
              {session.status}
            </Badge>
          </div>
          {session.description && (
            <p className="text-muted-foreground font-body">
              {session.description}
            </p>
          )}
          <div className="flex items-center gap-6 text-sm text-muted-foreground font-body">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                Started{" "}
                {formatDistanceToNow(session.startTime, { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              <span>{session.jobsFound} jobs found</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{session.jobsApplied} applications sent</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          {canControl && (
            <>
              {isActive && (
                <Button
                  variant="outline"
                  onClick={handlePauseSession}
                  className="flex items-center gap-2"
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              )}
              {isPaused && (
                <Button
                  variant="yellow"
                  onClick={handleResumeSession}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Resume
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={handleStopSession}
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            </>
          )}

          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Command Log */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Command Log
              </CardTitle>
              <CardDescription className="font-body">
                Real-time automation commands
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommandLog logs={logs} isLive={isActive} maxHeight="h-96" />
            </CardContent>
          </Card>
        </div>

        {/* Right Content - Screencast and Jobs */}
        <div className="lg:col-span-3 space-y-6">
          {/* Screencast Viewer */}
          <ScreencastViewer
            streamUrl={session.streamUrl}
            isLive={isActive}
            sessionName={session.name}
            onRefresh={handleRefresh}
          />

          {/* Jobs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading">Found Jobs</CardTitle>
              <CardDescription className="font-body">
                Jobs discovered during this automation session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JobTable
                jobs={jobs}
                selectedJobs={selectedJobs}
                onSelectionChange={handleJobSelectionChange}
                onJobAction={handleJobAction}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
