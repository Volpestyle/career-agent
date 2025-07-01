import { NextRequest, NextResponse } from 'next/server';
import { jobStorage } from '@/lib/job-storage';
import { StagehandClient } from '@/lib/stagehand-client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const { applicationData } = await request.json();
    
    const job = jobStorage.getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.appliedAt) {
      return NextResponse.json(
        { error: 'Job application already submitted' },
        { status: 400 }
      );
    }

    // Update job status to indicate application is in progress
    jobStorage.updateJob(jobId, {
      applicationStatus: 'applying',
      appliedAt: new Date(),
    });

    // TODO: Integrate with Stagehand to automate application process
    // For now, just mark as applied
    const appliedJob = jobStorage.updateJob(jobId, {
      applicationStatus: 'applied',
      appliedAt: new Date(),
      applicationData,
    });

    if (!appliedJob) {
      return NextResponse.json(
        { error: 'Failed to update job application status' },
        { status: 500 }
      );
    }

    return NextResponse.json(appliedJob);
  } catch (error) {
    console.error('Error applying to job:', error);
    
    // Revert job status if error occurred
    jobStorage.updateJob(params.id, {
      applicationStatus: 'not_applied',
      appliedAt: undefined,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}