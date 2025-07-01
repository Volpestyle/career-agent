import { NextRequest, NextResponse } from 'next/server';
import { jobStorage } from '@/lib/job-storage';
import { StagehandClient } from '@/lib/stagehand-client';
import { RedisConnectionManager } from '@/lib/redis-client';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get the session from storage
    const session = jobStorage.getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Update session status to running
    const updatedSession = jobStorage.updateSession(sessionId, {
      status: 'running',
      updatedAt: new Date(),
    });

    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    // Initialize Stagehand client
    const stagehandClient = new StagehandClient({
      provider: 'local', // TODO: Make this configurable
      headless: false, // Set to false for viewport streaming
    });

    // Start job search asynchronously
    startJobSearchAsync(stagehandClient, updatedSession);

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error starting search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Async function to run the job search
async function startJobSearchAsync(
  stagehandClient: StagehandClient,
  session: any
) {
  try {
    // Start search for each enabled platform
    const enabledPlatforms = session.searchParams.platforms.filter(
      (p: any) => p.enabled
    );

    for (const platform of enabledPlatforms) {
      try {
        await stagehandClient.startJobSearch(
          session.searchParams,
          platform.name
        );

        // Extract jobs periodically
        const extractJobs = async () => {
          const jobs = await stagehandClient.extractJobs(session.id);
          
          // Save extracted jobs
          jobs.forEach((job) => {
            jobStorage.saveJob(job);
          });

          // Update session with job count
          const updatedSession = jobStorage.updateSession(session.id, {
            jobsFound: jobStorage.getJobsBySession(session.id).length,
          });

          // Publish events to connected clients
          if (jobs.length > 0) {
            await RedisConnectionManager.publishEvent(session.id, 'jobs_extracted', {
              jobs,
              totalJobsFound: updatedSession?.jobsFound || 0,
            });
          }

          await RedisConnectionManager.publishEvent(session.id, 'session_updated', {
            session: updatedSession,
          });

          // Continue extracting if session is still running
          const currentSession = jobStorage.getSession(session.id);
          if (currentSession?.status === 'running') {
            setTimeout(extractJobs, 30000); // Extract every 30 seconds
          }
        };

        // Start extraction process
        setTimeout(extractJobs, 5000); // Initial delay
        
      } catch (platformError) {
        console.error(`Error with platform ${platform.name}:`, platformError);
      }
    }

  } catch (error) {
    console.error('Error in async job search:', error);
    
    // Mark session as stopped on error
    jobStorage.updateSession(session.id, {
      status: 'stopped',
      updatedAt: new Date(),
    });
  }
}