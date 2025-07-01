import { NextRequest, NextResponse } from 'next/server';
import { jobStorage } from '@/lib/job-storage';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
    // Get the session from storage
    const session = jobStorage.getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.status === 'stopped' || session.status === 'completed') {
      return NextResponse.json(
        { error: 'Session is already stopped' },
        { status: 400 }
      );
    }

    // Update session status to stopped
    const updatedSession = jobStorage.updateSession(sessionId, {
      status: 'stopped',
      updatedAt: new Date(),
    });

    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    // TODO: Clean up any running Stagehand instances

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error stopping search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}