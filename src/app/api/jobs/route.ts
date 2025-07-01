import { NextRequest, NextResponse } from 'next/server';
import { jobStorage } from '@/lib/job-storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const search = searchParams.get('search');

    let jobs = jobStorage.getSavedJobs();

    // Apply search filter
    if (search) {
      jobs = jobStorage.searchJobs(search).filter(job => job.savedAt);
    }

    // Apply additional filters
    if (filter) {
      switch (filter) {
        case 'applied':
          jobs = jobs.filter(job => job.appliedAt);
          break;
        case 'pending':
          jobs = jobs.filter(job => !job.appliedAt);
          break;
        case 'remote':
          jobs = jobs.filter(job => job.jobType === 'remote');
          break;
        case 'onsite':
          jobs = jobs.filter(job => job.jobType === 'onsite');
          break;
        case 'hybrid':
          jobs = jobs.filter(job => job.jobType === 'hybrid');
          break;
      }
    }

    return NextResponse.json({
      jobs,
      total: jobs.length,
      stats: jobStorage.getStats(),
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const jobData = await request.json();
    
    // Validate required fields
    if (!jobData.title || !jobData.company || !jobData.url) {
      return NextResponse.json(
        { error: 'Missing required fields: title, company, url' },
        { status: 400 }
      );
    }

    // Save the job
    const savedJob = jobStorage.saveJob({
      ...jobData,
      id: jobData.id || `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      extractedAt: new Date(),
      searchSessionId: jobData.searchSessionId || 'manual',
    });

    return NextResponse.json(savedJob, { status: 201 });
  } catch (error) {
    console.error('Error saving job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}