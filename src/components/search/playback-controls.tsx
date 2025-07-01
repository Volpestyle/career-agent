'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  PlayIcon,
  PauseIcon,
  SquareIcon,
  RotateCwIcon,
  SettingsIcon,
} from 'lucide-react';
import { JobSearchSession } from '@/types';

interface PlaybackControlsProps {
  session: JobSearchSession;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onRestart?: () => void;
  isLoading?: boolean;
}

export function PlaybackControls({
  session,
  onPlay,
  onPause,
  onStop,
  onRestart,
  isLoading = false,
}: PlaybackControlsProps) {
  const getStatusColor = () => {
    switch (session.status) {
      case 'running':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'stopped':
        return 'bg-red-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const isRunning = session.status === 'running';
  const isPaused = session.status === 'paused';
  const isStopped = session.status === 'stopped' || session.status === 'completed';

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${getStatusColor()} ${
              isRunning ? 'animate-pulse' : ''
            }`} />
            <span className="font-medium capitalize">{session.status}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {(isPaused || isStopped) && (
              <Button
                size="sm"
                onClick={onPlay}
                disabled={isLoading}
                title="Resume search"
              >
                <PlayIcon className="mr-2 h-4 w-4" />
                {isStopped ? 'Start' : 'Resume'}
              </Button>
            )}

            {isRunning && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onPause}
                disabled={isLoading}
                title="Pause search"
              >
                <PauseIcon className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}

            {(isRunning || isPaused) && (
              <Button
                size="sm"
                variant="destructive"
                onClick={onStop}
                disabled={isLoading}
                title="Stop search"
              >
                <SquareIcon className="mr-2 h-4 w-4" />
                Stop
              </Button>
            )}

            {isStopped && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRestart}
                disabled={isLoading}
                title="Restart search"
              >
                <RotateCwIcon className="mr-2 h-4 w-4" />
                Restart
              </Button>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Jobs found:</span>
            <Badge variant="secondary">{session.jobsFound}</Badge>
          </div>
          <Button
            size="sm"
            variant="ghost"
            title="Search settings"
            disabled
          >
            <SettingsIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}