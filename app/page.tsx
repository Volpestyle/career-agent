"use client";

import { useState } from "react";
import {
  Play,
  RefreshCw,
  BarChart3,
  Eye,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const [isSessionRunning, setIsSessionRunning] = useState(false);

  const handleStartSession = () => {
    setIsSessionRunning(true);
    // TODO: Start an actual automation session
    setTimeout(() => setIsSessionRunning(false), 5000); // Demo timeout
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-heading font-medium text-foreground">
            Anonymous Dashboard
          </h1>
          <p className="text-muted-foreground font-body mt-1">
            Start automating your job search. No account required.
          </p>
        </div>

        <Button
          onClick={handleStartSession}
          disabled={isSessionRunning}
          variant="yellow"
          size="lg"
          className="font-body"
        >
          {isSessionRunning ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Start Job Search
            </>
          )}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground">
              Active Sessions
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading text-foreground">
              {isSessionRunning ? "1" : "0"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground">
              Job Boards
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading text-foreground">3</div>
            <div className="text-xs font-body text-muted-foreground">
              LinkedIn, Indeed, Glassdoor
            </div>
          </CardContent>
        </Card>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-body text-muted-foreground">
              Jobs Found
            </span>
          </div>
          <div className="text-2xl font-heading text-foreground">—</div>
          <div className="text-xs font-body text-muted-foreground">
            Start a session to see results
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-body text-muted-foreground">
              Time Saved
            </span>
          </div>
          <div className="text-2xl font-heading text-foreground">—</div>
          <div className="text-xs font-body text-muted-foreground">
            vs manual searching
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Browser View */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg">
            <div className="p-4 border-b border-border">
              <h2 className="font-subheading text-lg text-foreground">
                Live Browser Session
              </h2>
              <p className="text-sm font-body text-muted-foreground">
                Watch AI navigate job sites in real-time
              </p>
            </div>

            <div className="p-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                {isSessionRunning ? (
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 text-yellow-500 animate-spin mx-auto mb-2" />
                    <p className="text-sm font-body text-muted-foreground">
                      Searching LinkedIn for JavaScript jobs...
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Play className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-body text-muted-foreground">
                      Start a session to see browser automation
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search Configuration */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-subheading text-base text-foreground mb-3">
              Quick Search Setup
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-body text-foreground">
                  Role: Software Engineer
                </span>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-body text-foreground">
                  Location: Remote, San Francisco
                </span>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-body text-foreground">
                  Salary: $120k - $180k
                </span>
              </div>
            </div>

            <button className="btn-secondary px-4 py-2 rounded-md text-sm font-body mt-4 w-full">
              Customize Search
            </button>
          </div>
        </div>

        {/* Right Column - Activity & Results */}
        <div className="space-y-4">
          {/* Activity Log */}
          <div className="bg-card border border-border rounded-lg">
            <div className="p-4 border-b border-border">
              <h2 className="font-subheading text-lg text-foreground">
                Activity Log
              </h2>
              <p className="text-sm font-body text-muted-foreground">
                Real-time automation steps
              </p>
            </div>

            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {isSessionRunning ? (
                <>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-body text-foreground">
                        Connected to LinkedIn
                      </p>
                      <p className="text-xs font-body text-muted-foreground">
                        2 seconds ago
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin mt-0.5" />
                    <div>
                      <p className="text-sm font-body text-foreground">
                        Searching for JavaScript jobs...
                      </p>
                      <p className="text-xs font-body text-muted-foreground">
                        Now
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-body text-muted-foreground">
                    Activity will appear here during sessions
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-subheading text-base text-foreground mb-3">
              How Career Agent Works
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-body text-yellow-500">1</span>
                </div>
                <div>
                  <p className="text-sm font-body text-foreground">
                    AI opens job sites
                  </p>
                  <p className="text-xs font-body text-muted-foreground">
                    Navigates LinkedIn, Indeed, Glassdoor
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-body text-yellow-500">2</span>
                </div>
                <div>
                  <p className="text-sm font-body text-foreground">
                    Searches & filters jobs
                  </p>
                  <p className="text-xs font-body text-muted-foreground">
                    Uses your criteria automatically
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-body text-yellow-500">3</span>
                </div>
                <div>
                  <p className="text-sm font-body text-foreground">
                    Saves relevant matches
                  </p>
                  <p className="text-xs font-body text-muted-foreground">
                    Review and apply to the best ones
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
