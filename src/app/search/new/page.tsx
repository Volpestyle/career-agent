'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAllSessions } from '@/hooks/use-all-sessions';
import { JobSearchParams, JobPlatform } from '@/types';
import { ArrowLeftIcon, XIcon } from 'lucide-react';
import Link from 'next/link';

export default function NewSearchPage() {
  const router = useRouter();
  const { createSession } = useAllSessions();
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState<JobSearchParams['jobType']>('any');
  const [experienceLevel, setExperienceLevel] = useState<JobSearchParams['experienceLevel']>([]);
  const [platforms, setPlatforms] = useState<JobPlatform[]>([
    { name: 'linkedin', enabled: true },
    { name: 'indeed', enabled: true },
    { name: 'glassdoor', enabled: false },
    { name: 'angellist', enabled: false },
    { name: 'dice', enabled: false },
    { name: 'monster', enabled: false },
  ]);

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const toggleExperienceLevel = (level: string) => {
    const typedLevel = level as 'entry' | 'mid' | 'senior' | 'executive';
    if (experienceLevel.includes(typedLevel)) {
      setExperienceLevel(experienceLevel.filter((l) => l !== typedLevel));
    } else {
      setExperienceLevel([...experienceLevel, typedLevel]);
    }
  };

  const togglePlatform = (platformName: string) => {
    setPlatforms(
      platforms.map((p) =>
        p.name === platformName ? { ...p, enabled: !p.enabled } : p
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (keywords.length === 0 || !location.trim()) {
      alert('Please add at least one keyword and location');
      return;
    }

    const enabledPlatforms = platforms.filter((p) => p.enabled);
    if (enabledPlatforms.length === 0) {
      alert('Please enable at least one job platform');
      return;
    }

    setIsCreating(true);

    try {
      const params: JobSearchParams = {
        keywords,
        location,
        jobType,
        experienceLevel,
        platforms: enabledPlatforms,
      };

      const session = await createSession(params);
      
      // Start the search
      await fetch('/api/search/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      });

      router.push(`/search/${session.id}`);
    } catch (error) {
      console.error('Error creating search:', error);
      alert('Failed to create search. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">New Job Search</h1>
        <p className="text-muted-foreground mt-1">
          Configure your automated job search parameters
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Keywords */}
        <Card>
          <CardHeader>
            <CardTitle>Search Keywords</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., React Developer, Full Stack Engineer"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
              />
              <Button type="button" onClick={handleAddKeyword} variant="secondary">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="px-3 py-1">
                  {keyword}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="ml-2 hover:text-destructive"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Location & Job Type */}
        <Card>
          <CardHeader>
            <CardTitle>Location & Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., San Francisco, CA or Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="jobType">Job Type</Label>
              <Select value={jobType} onValueChange={(value: string) => setJobType(value as "remote" | "onsite" | "hybrid" | "any")}>
                <SelectTrigger id="jobType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Experience Level */}
        <Card>
          <CardHeader>
            <CardTitle>Experience Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['entry', 'mid', 'senior', 'executive'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleExperienceLevel(level)}
                  className={`px-4 py-2 rounded-md border capitalize transition-colors ${
                    experienceLevel.includes(level as "entry" | "mid" | "senior" | "executive")
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-accent'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Job Platforms */}
        <Card>
          <CardHeader>
            <CardTitle>Job Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {platforms.map((platform) => (
                <div key={platform.name} className="flex items-center justify-between">
                  <Label
                    htmlFor={platform.name}
                    className="text-base capitalize cursor-pointer"
                  >
                    {platform.name}
                  </Label>
                  <Switch
                    id={platform.name}
                    checked={platform.enabled}
                    onCheckedChange={() => togglePlatform(platform.name)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="submit"
            size="lg"
            className="flex-1"
            disabled={isCreating || keywords.length === 0 || !location.trim()}
          >
            {isCreating ? 'Creating Search...' : 'Start Search'}
          </Button>
          <Link href="/">
            <Button type="button" variant="outline" size="lg">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}