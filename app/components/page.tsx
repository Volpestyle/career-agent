"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Search,
  Download,
  Settings,
  Heart,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";

export default function ComponentsShowcase() {
  const router = useRouter();

  // Redirect to dashboard in production
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      router.push("/");
    }
  }, [router]);

  // Don't render in production
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-medium text-foreground mb-2">
          Component Library
        </h1>
        <p className="text-muted-foreground font-body">
          Showcase of our Career Agent UI components built with Shadcn UI
        </p>
      </div>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="font-subheading">Buttons</CardTitle>
          <CardDescription className="font-body">
            Various button styles with our yellow accent theme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="yellow">
              <Play className="h-4 w-4" />
              Primary Action
            </Button>

            <Button variant="outline">
              <Search className="h-4 w-4" />
              Secondary
            </Button>

            <Button variant="secondary">
              <Settings className="h-4 w-4" />
              Tertiary
            </Button>

            <Button variant="ghost">
              <Heart className="h-4 w-4" />
              Ghost
            </Button>

            <Button variant="link">Link Button</Button>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-3">
            <Button variant="yellow" size="sm">
              Small
            </Button>
            <Button variant="yellow" size="default">
              Default
            </Button>
            <Button variant="yellow" size="lg">
              Large
            </Button>
            <Button variant="yellow" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="yellow" disabled>
              Disabled
            </Button>
            <Button variant="outline" disabled>
              Disabled Outline
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="font-subheading">Cards</CardTitle>
          <CardDescription className="font-body">
            Card components for displaying content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-heading">
                  Job Session
                </CardTitle>
                <CardDescription className="font-body">
                  Active automation session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-body">
                    Running successfully
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-heading">
                  Search Results
                </CardTitle>
                <CardDescription className="font-body">
                  Found job opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-heading text-foreground mb-1">
                  24
                </div>
                <div className="text-xs font-body text-muted-foreground">
                  New matches today
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-heading">
                  Time Saved
                </CardTitle>
                <CardDescription className="font-body">
                  Automation efficiency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-heading text-foreground mb-1">
                  3.2h
                </div>
                <div className="text-xs font-body text-muted-foreground">
                  vs manual search
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Form Elements */}
      <Card>
        <CardHeader>
          <CardTitle className="font-subheading">Form Elements</CardTitle>
          <CardDescription className="font-body">
            Input fields and form controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-body font-medium">Job Title</label>
              <Input
                placeholder="e.g. Software Engineer"
                className="font-body"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-body font-medium">Location</label>
              <Input
                placeholder="e.g. San Francisco, CA"
                className="font-body"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-body font-medium">
              Additional Requirements
            </label>
            <Textarea
              placeholder="Describe any specific requirements or preferences..."
              className="font-body"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Badges and Status */}
      <Card>
        <CardHeader>
          <CardTitle className="font-subheading">Badges & Status</CardTitle>
          <CardDescription className="font-body">
            Status indicators and labels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="font-body">
              Active
            </Badge>
            <Badge variant="secondary" className="font-body">
              Pending
            </Badge>
            <Badge variant="destructive" className="font-body">
              Failed
            </Badge>
            <Badge variant="outline" className="font-body">
              Queued
            </Badge>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-body">
                Session completed successfully
              </span>
              <Badge variant="default" className="ml-auto font-body">
                Success
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-body">Waiting for user input</span>
              <Badge variant="secondary" className="ml-auto font-body">
                Waiting
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-body">
                Processing job applications
              </span>
              <Badge variant="outline" className="ml-auto font-body">
                Processing
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="font-subheading">Progress Indicators</CardTitle>
          <CardDescription className="font-body">
            Progress bars for ongoing operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-body">
              <span>Job Search Progress</span>
              <span>75%</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-body">
              <span>Profile Analysis</span>
              <span>100%</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-body">
              <span>Application Submission</span>
              <span>45%</span>
            </div>
            <Progress value={45} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
