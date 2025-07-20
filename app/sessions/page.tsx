"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SessionsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the job search page where sessions are now managed
    router.replace("/search");
  }, [router]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-lg font-heading">Redirecting...</p>
          <p className="text-sm text-muted-foreground font-body">
            Sessions are now managed from the Job Search page
          </p>
        </div>
      </div>
    </div>
  );
}
