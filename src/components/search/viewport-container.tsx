'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MaximizeIcon,
  MinimizeIcon,
  RefreshCwIcon,
  XIcon,
} from 'lucide-react';

interface ViewportContainerProps {
  viewportUrl?: string;
  sessionId: string;
  isConnected?: boolean;
}

export function ViewportContainer({
  viewportUrl,
  sessionId,
  isConnected = false,
}: ViewportContainerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (viewportUrl && iframeRef.current) {
      setIsLoading(true);
      setError(null);
    }
  }, [viewportUrl]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
      setIsLoading(true);
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement && iframeRef.current) {
      iframeRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="relative overflow-hidden bg-muted/50">
        <div className="aspect-video flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Browser not connected</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start the search to see the browser viewport
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="relative overflow-hidden bg-destructive/10">
        <div className="aspect-video flex items-center justify-center">
          <div className="text-center">
            <XIcon className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="mt-4"
            >
              <RefreshCwIcon className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden bg-black">
      {/* Viewport Controls */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8"
          onClick={handleRefresh}
          title="Refresh viewport"
        >
          <RefreshCwIcon className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8"
          onClick={handleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <MinimizeIcon className="h-4 w-4" />
          ) : (
            <MaximizeIcon className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <Skeleton className="h-8 w-8 rounded-full mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-muted-foreground">Connecting to browser...</p>
          </div>
        </div>
      )}

      {/* Viewport Iframe */}
      {viewportUrl ? (
        <iframe
          ref={iframeRef}
          src={viewportUrl}
          className="w-full aspect-video bg-white"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError('Failed to connect to browser viewport');
          }}
          allow="autoplay; camera; microphone; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      ) : (
        <div className="aspect-video bg-muted animate-pulse" />
      )}
    </Card>
  );
}