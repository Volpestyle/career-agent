"use client";

import { useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [isSigningIn, setIsSigningIn] = useState(false);

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-end px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="font-body"
            onClick={() => setIsSigningIn(true)}
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>

          <Button
            variant="yellow"
            size="sm"
            className="font-body"
            onClick={() => setIsSigningIn(true)}
          >
            <UserPlus className="h-4 w-4" />
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
}
