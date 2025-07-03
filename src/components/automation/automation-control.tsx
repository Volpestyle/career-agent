'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Activity, 
  Clock, 
  Database,
  AlertTriangle
} from 'lucide-react';
import { VncViewer } from './vnc-viewer';

interface AutomationControlProps {
  sessionId: string;
  className?: string;
}

interface AutomationStatus {
  status: 'not_running' | 'starting' | 'running' | 'stopping' | 'error';
  taskInfo?: {
    taskArn: string;
    status: string;
    createdAt?: string;
    startedAt?: string;
    lastStatus: string;
    healthStatus?: string;
  };
  connections?: {
    api?: string;
    vnc?: string;
    webVnc?: string;
  };
  message?: string;
  error?: string;
}

export function AutomationControl({ sessionId, className }: AutomationControlProps) {
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus>({ 
    status: 'not_running' 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [jobsFound] = useState(0);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/automation/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setAutomationStatus(data);
      } else {
        setAutomationStatus({ 
          status: 'not_running',
          error: 'Failed to fetch status'
        });
      }
    } catch (error) {
      console.error('Error fetching automation status:', error);
      setAutomationStatus({ 
        status: 'error',
        error: 'Network error'
      });
    }
  };

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/automation/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        const data = await response.json();
        setAutomationStatus(data);
        
        // Refresh status after a short delay
        setTimeout(fetchStatus, 2000);
      } else {
        const error = await response.text();
        setAutomationStatus(prev => ({
          ...prev,
          status: 'error',
          error: `Failed to ${action}: ${error}`
        }));
      }
    } catch (error) {
      console.error(`Error ${action}ing automation:`, error);
      setAutomationStatus(prev => ({
        ...prev,
        status: 'error',
        error: `Network error during ${action}`
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    const { status } = automationStatus;
    
    switch (status) {
      case 'running':
        return <Badge variant="default" className="bg-green-500">Running</Badge>;
      case 'starting':
        return <Badge variant="secondary">Starting</Badge>;
      case 'stopping':
        return <Badge variant="secondary">Stopping</Badge>;
      case 'not_running':
        return <Badge variant="outline">Not Running</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDuration = (startTime?: string) => {
    if (!startTime) return 'N/A';
    
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    return `${diffMins}m ${diffSecs}s`;
  };

  useEffect(() => {
    // Initial status fetch
    fetchStatus();

    // Poll for status updates every 10 seconds
    const interval = setInterval(fetchStatus, 10000);

    return () => clearInterval(interval);
  }, [sessionId, fetchStatus]);

  const isRunning = automationStatus.status === 'running';
  const canStart = ['not_running', 'error'].includes(automationStatus.status);
  const canStop = ['running', 'starting'].includes(automationStatus.status);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>Automation Control</CardTitle>
              {getStatusBadge()}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleAction('start')}
                disabled={!canStart || isLoading}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
              
              <Button
                onClick={() => handleAction('restart')}
                disabled={!isRunning || isLoading}
                variant="outline"
                size="sm"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Restart
              </Button>
              
              <Button
                onClick={() => handleAction('stop')}
                disabled={!canStop || isLoading}
                variant="destructive"
                size="sm"
              >
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {automationStatus.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{automationStatus.error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-gray-600">
                  {automationStatus.taskInfo?.lastStatus || 'Not Started'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Runtime</p>
                <p className="text-sm text-gray-600">
                  {formatDuration(automationStatus.taskInfo?.startedAt)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Jobs Found</p>
                <p className="text-sm text-gray-600">{jobsFound}</p>
              </div>
            </div>
          </div>

          {automationStatus.taskInfo && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Task Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Task ARN:</span>
                    <p className="font-mono text-xs break-all">
                      {automationStatus.taskInfo.taskArn}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Health:</span>
                    <p>{automationStatus.taskInfo.healthStatus || 'Unknown'}</p>
                  </div>
                  {automationStatus.taskInfo.createdAt && (
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <p>{new Date(automationStatus.taskInfo.createdAt).toLocaleString()}</p>
                    </div>
                  )}
                  {automationStatus.taskInfo.startedAt && (
                    <div>
                      <span className="text-gray-500">Started:</span>
                      <p>{new Date(automationStatus.taskInfo.startedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* VNC Viewer */}
      {isRunning && (
        <VncViewer 
          sessionId={sessionId}
          vncUrl={automationStatus.connections?.vnc}
        />
      )}
    </div>
  );
}