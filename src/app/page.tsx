"use client";

import { ActiveSearchesList } from "@/components/dashboard/active-searches-list";
import { Button } from "@/components/ui/button";
import { PlusIcon, BriefcaseIcon } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";
import { useAllSessions } from "@/hooks/use-all-sessions";

export default function DashboardPage() {
  const { sessions, isLoading } = useAllSessions();

  const handlePlay = useCallback(async (sessionId: string) => {
    // Resume search
    await fetch(`/api/search/${sessionId}/resume`, { method: "POST" });
  }, []);

  const handlePause = useCallback(async (sessionId: string) => {
    // Pause search
    await fetch(`/api/search/${sessionId}/pause`, { method: "POST" });
  }, []);

  const handleStop = useCallback(async (sessionId: string) => {
    // Stop search
    await fetch(`/api/search/${sessionId}/stop`, { method: "POST" });
  }, []);

  // Get active sessions (running or paused)
  const activeSessions = sessions.filter(
    (s) => s.status === "running" || s.status === "paused"
  );

  // Get statistics
  const stats = {
    active: activeSessions.length,
    total: sessions.length,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Job Search Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your automated job searches
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Link href="/search/new">
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              New Search
            </Button>
          </Link>
          <Link href="/jobs">
            <Button variant="outline">
              <BriefcaseIcon className="mr-2 h-4 w-4" />
              Saved Jobs
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Active Searches</h3>
          </div>
          <div className="text-2xl font-bold">{stats.active}</div>
          <p className="text-xs text-muted-foreground">
            Currently running or paused
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Searches</h3>
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">All time</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Jobs Found</h3>
          </div>
          <div className="text-2xl font-bold">{/* jobs found count */}</div>
          <p className="text-xs text-muted-foreground">Across all searches</p>
        </div>
      </div>

      {/* Active Searches */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Searches</h2>
        <ActiveSearchesList
          sessions={activeSessions}
          isLoading={isLoading}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
        />
      </div>

      {/* All Searches */}
      {sessions.length > activeSessions.length && (
        <div className="space-y-4 mt-12">
          <h2 className="text-xl font-semibold">All Searches</h2>
          <ActiveSearchesList
            sessions={sessions}
            isLoading={isLoading}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
          />
        </div>
      )}
    </div>
  );
}
