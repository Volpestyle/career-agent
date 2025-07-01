import { NextRequest, NextResponse } from 'next/server';
import { jobStorage } from '@/lib/job-storage';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const { status, notes } = await request.json();
    
    const job = jobStorage.getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Validate status
    const validStatuses = ['not_applied', 'applying', 'applied', 'interviewing', 'rejected', 'offer'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.applicationStatus = status;
    if (notes !== undefined) updateData.notes = notes;

    const updatedJob = jobStorage.updateJob(jobId, updateData);
    
    if (!updatedJob) {
      return NextResponse.json(
        { error: 'Failed to update job status' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error('Error updating job status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}