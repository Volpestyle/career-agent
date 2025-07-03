"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Square, RotateCcw, Maximize2, Minimize2 } from "lucide-react";

interface VncViewerProps {
  sessionId: string;
  vncUrl?: string;
  className?: string;
}

interface VncStatus {
  connected: boolean;
  connectionId?: string;
  error?: string;
  reconnecting?: boolean;
}

export function VncViewer({ sessionId, vncUrl, className }: VncViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<VncStatus>({ connected: false });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale] = useState(1);

  const connect = useCallback(async () => {
    if (!vncUrl && !sessionId) {
      setStatus({
        connected: false,
        error: "No VNC URL or session ID provided",
      });
      return;
    }

    try {
      setStatus({ connected: false, reconnecting: true });

      // Get VNC connection info from API if URL not provided
      let connectUrl = vncUrl;
      if (!connectUrl) {
        const response = await fetch(
          `/api/automation/proxy?sessionId=${sessionId}&action=connect`
        );
        if (!response.ok) {
          throw new Error("Failed to get VNC connection info");
        }
        const data = await response.json();
        connectUrl = data.vncWebSocketUrl;
      }

      if (!connectUrl) {
        throw new Error("No VNC URL available");
      }

      // Create WebSocket connection
      const ws = new WebSocket(connectUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("VNC WebSocket connected");
        setStatus({ connected: true, reconnecting: false });
      };

      ws.onmessage = (event) => {
        handleVncMessage(event.data);
      };

      ws.onerror = (error) => {
        console.error("VNC WebSocket error:", error);
        setStatus({ connected: false, error: "Connection failed" });
      };

      ws.onclose = (event) => {
        console.log("VNC WebSocket closed:", event.code, event.reason);
        setStatus({
          connected: false,
          error: event.reason || "Connection closed",
          reconnecting: false,
        });
      };
    } catch (error) {
      console.error("Error connecting to VNC:", error);
      setStatus({
        connected: false,
        error: error instanceof Error ? error.message : "Connection failed",
      });
    }
  }, [vncUrl, sessionId]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus({ connected: false });
  }, []);

  const drawFramebufferUpdate = useCallback((data: ArrayBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // This is a simplified implementation
    // Real VNC protocol requires proper RFB decoding

    // For demo purposes, just show that we received data
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#333";
    ctx.font = "16px monospace";
    ctx.textAlign = "center";
    ctx.fillText("VNC Stream Active", canvas.width / 2, canvas.height / 2);
    ctx.fillText(
      `Data received: ${data.byteLength} bytes`,
      canvas.width / 2,
      canvas.height / 2 + 30
    );
  }, []);

  const handleVncMessage = useCallback(
    (data: unknown) => {
      // Handle VNC protocol messages
      // This is a simplified implementation - real VNC protocol is more complex

      if (typeof data === "string") {
        try {
          const message = JSON.parse(data);
          if (message.type === "connection_established") {
            setStatus((prev) => ({
              ...prev,
              connectionId: message.connectionId,
            }));
          }
        } catch (e) {
          // Not JSON, might be binary VNC data
          console.log("Error parsing VNC data", e);
        }
      } else if (data instanceof ArrayBuffer) {
        // Handle binary VNC framebuffer updates
        drawFramebufferUpdate(data);
      }
    },
    [drawFramebufferUpdate]
  );

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!wsRef.current || status.connected !== true) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((event.clientX - rect.left) / scale);
      const y = Math.floor((event.clientY - rect.top) / scale);

      // Send VNC pointer event
      const pointerEvent = {
        type: "pointer",
        x,
        y,
        buttonMask: 1, // Left click
      };

      wsRef.current.send(JSON.stringify(pointerEvent));
    },
    [scale, status.connected]
  );

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const handleReconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 1000);
  }, [connect, disconnect]);

  useEffect(() => {
    // Auto-connect when component mounts
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Calculate canvas size based on container
  const canvasWidth = isFullscreen ? window.innerWidth : 800;
  const canvasHeight = isFullscreen ? window.innerHeight : 600;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            <CardTitle>Browser Automation View</CardTitle>
            <Badge variant={status.connected ? "default" : "destructive"}>
              {status.connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReconnect}
              disabled={status.reconnecting}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              {status.reconnecting ? "Connecting..." : "Reconnect"}
            </Button>

            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={disconnect}
              disabled={!status.connected}
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {status.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              Connection Error: {status.error}
            </p>
          </div>
        )}

        <div
          className={`relative border rounded-lg overflow-hidden ${
            isFullscreen ? "fixed inset-0 z-50 bg-black" : "bg-gray-100"
          }`}
        >
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onClick={handleCanvasClick}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              cursor: status.connected ? "crosshair" : "not-allowed",
            }}
            className="block max-w-full h-auto"
          />

          {!status.connected && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Monitor className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">
                  {status.reconnecting
                    ? "Connecting to automation browser..."
                    : "Browser not connected"}
                </p>
                {!status.reconnecting && (
                  <Button onClick={connect} variant="outline" className="mt-3">
                    Connect
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {status.connected && (
          <div className="mt-3 text-sm text-gray-600">
            <p>Click on the browser view to interact with the automation.</p>
            {status.connectionId && (
              <p>
                Connection ID:{" "}
                <code className="bg-gray-100 px-1 rounded">
                  {status.connectionId}
                </code>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
