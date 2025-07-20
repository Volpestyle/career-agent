"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { JobSearchForm } from "@/components/JobSearchForm";
import { SessionCard } from "@/components/sessions/SessionCard";
import {
  Session,
  SessionFilters,
  SessionStats,
  CreateSessionRequest,
} from "@/lib/types";
import { sessionApi, ApiError } from "@/lib/api";
import {
  Search,
  Filter,
  RefreshCw,
  Users,
  PlayCircle,
  Briefcase,
  TrendingUp,
  AlertCircle,
  Loader2,
  Activity,
} from "lucide-react";

export default function JobSearchPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [launchingSession, setLaunchingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<SessionFilters>({});

  // Load sessions data
  const loadSessions = useCallback(async () => {
    try {
      setError(null);
      const response = await sessionApi.getSessions(filters, {
        page: 1,
        limit: 50,
        sortBy: "startTime",
        sortOrder: "desc",
      });
      setSessions(response.data);
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : "Failed to load sessions";
      setError(errorMessage);
      console.error("Error loading sessions:", err);
    }
  }, [filters]);

  const loadStats = useCallback(async () => {
    try {
      const statsData = await sessionApi.getSessionStats();
      setStats(statsData);
    } catch (err) {
      console.error("Error loading stats:", err);
      // Don't set error for stats since it's not critical
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadSessions(), loadStats()]);
      setLoading(false);
    };

    loadData();
  }, [loadSessions, loadStats]);

  // Filter sessions based on search term
  const filteredSessions = sessions.filter((session) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      session.name.toLowerCase().includes(searchLower) ||
      session.description?.toLowerCase().includes(searchLower) ||
      session.status.toLowerCase().includes(searchLower)
    );
  });

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadSessions(), loadStats()]);
    setRefreshing(false);
  };

  // Launch new session
  const handleLaunchSession = async (request: CreateSessionRequest) => {
    setLaunchingSession(true);
    try {
      const newSession = await sessionApi.createSession(request);
      setSessions((prevSessions) => [newSession, ...prevSessions]);

      // Update stats
      if (stats) {
        setStats({
          ...stats,
          totalSessions: stats.totalSessions + 1,
          activeSessions: stats.activeSessions + 1,
        });
      }

      // Navigate to the new session details
      router.push(`/sessions/${newSession.id}`);
    } catch (err) {
      console.error("Error launching session:", err);
      // Could show toast notification here
    } finally {
      setLaunchingSession(false);
    }
  };

  // Session actions
  const handlePauseSession = async (sessionId: string) => {
    try {
      const updatedSession = await sessionApi.updateSessionStatus(
        sessionId,
        "paused"
      );
      setSessions(
        sessions.map((s) => (s.id === sessionId ? updatedSession : s))
      );
    } catch (err) {
      console.error("Error pausing session:", err);
    }
  };

  const handleResumeSession = async (sessionId: string) => {
    try {
      const updatedSession = await sessionApi.updateSessionStatus(
        sessionId,
        "active"
      );
      setSessions(
        sessions.map((s) => (s.id === sessionId ? updatedSession : s))
      );
    } catch (err) {
      console.error("Error resuming session:", err);
    }
  };

  const handleStopSession = async (sessionId: string) => {
    try {
      const updatedSession = await sessionApi.updateSessionStatus(
        sessionId,
        "completed"
      );
      setSessions(
        sessions.map((s) => (s.id === sessionId ? updatedSession : s))
      );
    } catch (err) {
      console.error("Error stopping session:", err);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-heading font-medium text-foreground">
            Job Search
          </h1>
          <p className="text-muted-foreground font-body mt-2">
            Launch automated job search sessions and monitor your active
            searches
          </p>
        </div>
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
        </div>
      </div>

      {/* Job Search Form */}
      <JobSearchForm
        onLaunchSession={handleLaunchSession}
        loading={launchingSession}
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-subheading">
                Total Sessions
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold">
                {stats.totalSessions}
              </div>
              <p className="text-xs text-muted-foreground font-body">
                All time sessions created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-subheading">
                Active Now
              </CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold">
                {stats.activeSessions}
              </div>
              <p className="text-xs text-muted-foreground font-body">
                Currently running sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-subheading">
                Jobs Found
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold">
                {stats.totalJobsFound}
              </div>
              <p className="text-xs text-muted-foreground font-body">
                Total opportunities discovered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-subheading">
                Applications
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold">
                {stats.totalJobsApplied}
              </div>
              <p className="text-xs text-muted-foreground font-body">
                Automated applications sent
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Sessions Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-heading font-medium">
              Active Sessions
            </h2>
            {sessions.length > 0 && (
              <Badge variant="secondary" className="font-body">
                {sessions.length} total
              </Badge>
            )}
          </div>
        </div>

        {/* Search and Filters for Sessions */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions by name, description, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-body"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="flex items-center gap-3 pt-6">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-body font-medium">Failed to load sessions</p>
                <p className="text-sm text-muted-foreground font-body">
                  {error}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="ml-auto"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State for Sessions */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground font-body">
                Loading active sessions...
              </p>
            </div>
          </div>
        ) : filteredSessions.length > 0 ? (
          /* Sessions Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onPause={handlePauseSession}
                onResume={handleResumeSession}
                onStop={handleStopSession}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Activity className="h-16 w-16 text-muted-foreground mb-4" />
              <CardTitle className="text-xl font-heading mb-2">
                {searchTerm ? "No sessions found" : "No active sessions"}
              </CardTitle>
              <CardDescription className="font-body mb-6 max-w-md">
                {searchTerm
                  ? `No sessions match "${searchTerm}". Try adjusting your search criteria.`
                  : "Launch your first automated job search session using the form above. WallCrawler will handle the browser automation for you."}
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
