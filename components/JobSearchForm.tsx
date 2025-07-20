"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreateSessionRequest } from "@/lib/types";
import {
  Play,
  Save,
  MapPin,
  Briefcase,
  Globe,
  Settings,
  Plus,
  X,
  Loader2,
} from "lucide-react";

interface JobSearchFormProps {
  onLaunchSession: (request: CreateSessionRequest) => Promise<void>;
  onSaveQuery?: (request: CreateSessionRequest) => Promise<void>;
  loading?: boolean;
  savedQueries?: CreateSessionRequest[];
}

export const JobSearchForm: React.FC<JobSearchFormProps> = ({
  onLaunchSession,
  onSaveQuery,
  loading = false,
  savedQueries = [],
}) => {
  const [formData, setFormData] = useState<CreateSessionRequest>({
    name: "",
    description: "",
    jobSearchCriteria: {
      jobTitle: "",
      location: "",
      remote: false,
      keywords: [],
      excludeKeywords: [],
    },
  });

  const [keywordInput, setKeywordInput] = useState("");
  const [excludeKeywordInput, setExcludeKeywordInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (
    field: keyof CreateSessionRequest,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCriteriaChange = (
    field: keyof CreateSessionRequest["jobSearchCriteria"],
    value: string | boolean | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      jobSearchCriteria: {
        ...prev.jobSearchCriteria,
        [field]: value,
      },
    }));
  };

  const addKeyword = () => {
    if (keywordInput.trim()) {
      const newKeywords = [
        ...(formData.jobSearchCriteria.keywords || []),
        keywordInput.trim(),
      ];
      handleCriteriaChange("keywords", newKeywords);
      setKeywordInput("");
    }
  };

  const removeKeyword = (index: number) => {
    const newKeywords =
      formData.jobSearchCriteria.keywords?.filter((_, i) => i !== index) || [];
    handleCriteriaChange("keywords", newKeywords);
  };

  const addExcludeKeyword = () => {
    if (excludeKeywordInput.trim()) {
      const newKeywords = [
        ...(formData.jobSearchCriteria.excludeKeywords || []),
        excludeKeywordInput.trim(),
      ];
      handleCriteriaChange("excludeKeywords", newKeywords);
      setExcludeKeywordInput("");
    }
  };

  const removeExcludeKeyword = (index: number) => {
    const newKeywords =
      formData.jobSearchCriteria.excludeKeywords?.filter(
        (_, i) => i !== index
      ) || [];
    handleCriteriaChange("excludeKeywords", newKeywords);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      action();
    }
  };

  const handleLaunch = async () => {
    if (!formData.jobSearchCriteria.jobTitle.trim()) return;

    // Auto-generate session name if not provided
    const sessionName =
      formData.name.trim() ||
      `${formData.jobSearchCriteria.jobTitle} - ${
        formData.jobSearchCriteria.location || "Remote"
      }`;

    await onLaunchSession({
      ...formData,
      name: sessionName,
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.jobSearchCriteria.jobTitle.trim())
      return;

    if (onSaveQuery) {
      await onSaveQuery(formData);
    }
  };

  const loadSavedQuery = (query: CreateSessionRequest) => {
    setFormData(query);
  };

  const isValid = formData.jobSearchCriteria.jobTitle.trim().length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-heading flex items-center gap-2">
          <Briefcase className="h-6 w-6" />
          Job Search Automation
        </CardTitle>
        <CardDescription className="font-body">
          Configure your job search criteria and launch an automated WallCrawler
          session
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Session Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-body font-medium">
              Session Name (Optional)
            </label>
            <Input
              placeholder="e.g. Senior Frontend Engineer Search"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="font-body"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-body font-medium">
              Description (Optional)
            </label>
            <Input
              placeholder="Brief description of this search"
              value={formData.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="font-body"
            />
          </div>
        </div>

        <Separator />

        {/* Job Search Criteria */}
        <div className="space-y-4">
          <h3 className="text-lg font-subheading">Search Criteria</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-body font-medium">
                Job Title *
              </label>
              <Input
                placeholder="e.g. Software Engineer, Product Manager"
                value={formData.jobSearchCriteria.jobTitle}
                onChange={(e) =>
                  handleCriteriaChange("jobTitle", e.target.value)
                }
                className="font-body"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-body font-medium">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. San Francisco, CA or leave empty for remote"
                  value={formData.jobSearchCriteria.location}
                  onChange={(e) =>
                    handleCriteriaChange("location", e.target.value)
                  }
                  className="pl-10 font-body"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remote"
              checked={formData.jobSearchCriteria.remote}
              onChange={(e) => handleCriteriaChange("remote", e.target.checked)}
              className="rounded border border-input"
            />
            <label
              htmlFor="remote"
              className="text-sm font-body flex items-center gap-1"
            >
              <Globe className="h-4 w-4" />
              Include remote positions
            </label>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="space-y-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 p-0 h-auto"
          >
            <Settings className="h-4 w-4" />
            Advanced Options
          </Button>

          {showAdvanced && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
              {/* Keywords */}
              <div className="space-y-3">
                <label className="text-sm font-body font-medium">
                  Required Keywords
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add keyword (e.g. React, Python)"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, addKeyword)}
                    className="font-body"
                  />
                  <Button type="button" onClick={addKeyword} size="sm">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {formData.jobSearchCriteria.keywords &&
                  formData.jobSearchCriteria.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.jobSearchCriteria.keywords.map(
                        (keyword, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="font-body"
                          >
                            {keyword}
                            <button
                              type="button"
                              onClick={() => removeKeyword(index)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )
                      )}
                    </div>
                  )}
              </div>

              {/* Exclude Keywords */}
              <div className="space-y-3">
                <label className="text-sm font-body font-medium">
                  Exclude Keywords
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add keyword to exclude (e.g. Senior, Manager)"
                    value={excludeKeywordInput}
                    onChange={(e) => setExcludeKeywordInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, addExcludeKeyword)}
                    className="font-body"
                  />
                  <Button type="button" onClick={addExcludeKeyword} size="sm">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {formData.jobSearchCriteria.excludeKeywords &&
                  formData.jobSearchCriteria.excludeKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.jobSearchCriteria.excludeKeywords.map(
                        (keyword, index) => (
                          <Badge
                            key={index}
                            variant="destructive"
                            className="font-body"
                          >
                            {keyword}
                            <button
                              type="button"
                              onClick={() => removeExcludeKeyword(index)}
                              className="ml-1 hover:text-destructive-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )
                      )}
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Saved Queries */}
        {savedQueries.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-body font-medium">
              Quick Start from Saved Searches
            </h4>
            <div className="flex flex-wrap gap-2">
              {savedQueries.slice(0, 3).map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => loadSavedQuery(query)}
                  className="text-xs"
                >
                  {query.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground font-body">
            {isValid ? (
              <>Ready to launch automated job search session</>
            ) : (
              <>Please fill in the job title to continue</>
            )}
          </div>

          <div className="flex items-center gap-3">
            {onSaveQuery && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSave}
                disabled={!formData.name.trim() || !isValid || loading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Query
              </Button>
            )}

            <Button
              type="button"
              variant="yellow"
              onClick={handleLaunch}
              disabled={!isValid || loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Launch Session
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
