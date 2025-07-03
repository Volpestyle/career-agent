import { useState, useEffect, useCallback } from "react";
import { automationProvider } from "@/lib/automation-provider";
import { BrowserSession } from "@wallcrawler/infra-common";

export function useAllSessions() {
  const [sessions, setSessions] = useState<BrowserSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load all sessions from storage
    const loadSessions = async () => {
      try {
        const sessionStateManager = automationProvider.getSessionStateManager();
        const allSessions = await sessionStateManager.getAllSessions();
        setSessions(allSessions);
      } catch (error) {
        console.error("Error loading sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSessions();
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const sessionStateManager = automationProvider.getSessionStateManager();
      await sessionStateManager.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  }, []);

  const refreshSessions = useCallback(async () => {
    try {
      const sessionStateManager = automationProvider.getSessionStateManager();
      const allSessions = await sessionStateManager.getAllSessions();
      setSessions(allSessions);
    } catch (error) {
      console.error("Error refreshing sessions:", error);
    }
  }, []);

  return {
    sessions,
    isLoading,
    deleteSession,
    refreshSessions,
  };
}
