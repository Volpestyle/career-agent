import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Monitor,
  Wifi,
  WifiOff,
  RotateCcw,
} from "lucide-react";

interface ScreencastViewerProps {
  streamUrl?: string;
  isLive: boolean;
  sessionName: string;
  onRefresh?: () => void;
}

export const ScreencastViewer: React.FC<ScreencastViewerProps> = ({
  streamUrl,
  isLive,
  sessionName,
  onRefresh,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const handleRefresh = useCallback(() => {
    setHasError(false);
    setIsConnecting(true);

    if (videoRef.current && streamUrl) {
      videoRef.current.load();
    }

    if (onRefresh) {
      onRefresh();
    }

    // Simulate connection attempt
    setTimeout(() => {
      setIsConnecting(false);
    }, 2000);
  }, [streamUrl, onRefresh]);

  const handleVideoError = useCallback(() => {
    setHasError(true);
    setIsConnecting(false);
  }, []);

  const handleVideoLoad = useCallback(() => {
    setHasError(false);
    setIsConnecting(false);
  }, []);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-heading">Live Session</CardTitle>
            <Badge
              variant={isLive ? "default" : "secondary"}
              className="font-body flex items-center gap-1"
            >
              {isLive ? (
                <>
                  <Wifi className="h-3 w-3" />
                  Live
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  Offline
                </>
              )}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isConnecting}
            >
              <RotateCcw
                className={`h-3 w-3 mr-1 ${isConnecting ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div
          ref={containerRef}
          className="relative bg-black rounded-lg overflow-hidden aspect-video"
        >
          {/* Video Element */}
          {streamUrl && !hasError ? (
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              autoPlay={isLive}
              muted={isMuted}
              controls={false}
              onError={handleVideoError}
              onLoadedData={handleVideoLoad}
              onCanPlay={handleVideoLoad}
            >
              <source src={streamUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            /* Placeholder */
            <div className="w-full h-full flex flex-col items-center justify-center text-white">
              {hasError ? (
                <>
                  <WifiOff className="h-12 w-12 mb-4 text-red-400" />
                  <p className="text-lg font-heading mb-2">Connection Failed</p>
                  <p className="text-sm text-gray-300 font-body mb-4 text-center">
                    Unable to connect to the browser session
                  </p>
                  <Button onClick={handleRefresh} variant="outline" size="sm">
                    Try Again
                  </Button>
                </>
              ) : isConnecting ? (
                <>
                  <Monitor className="h-12 w-12 mb-4 text-blue-400 animate-pulse" />
                  <p className="text-lg font-heading mb-2">Connecting...</p>
                  <p className="text-sm text-gray-300 font-body">
                    Establishing connection to browser session
                  </p>
                </>
              ) : (
                <>
                  <Monitor className="h-12 w-12 mb-4 text-gray-400" />
                  <p className="text-lg font-heading mb-2">
                    No Stream Available
                  </p>
                  <p className="text-sm text-gray-300 font-body mb-4 text-center">
                    {isLive
                      ? "Browser session is starting up..."
                      : "Session is not active"}
                  </p>
                  {isLive && (
                    <Button onClick={handleRefresh} variant="outline" size="sm">
                      Check for Stream
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Video Controls Overlay */}
          {streamUrl && !hasError && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={togglePlayPause}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-body">{sessionName}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Live Indicator */}
          {isLive && !hasError && (
            <div className="absolute top-4 left-4">
              <Badge variant="destructive" className="font-body animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full mr-2" />
                LIVE
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
