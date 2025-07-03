#!/usr/bin/env node

const { StagehandClient } = require('./src/lib/stagehand-client');
const { dynamoJobStorage } = require('./src/lib/dynamo-job-storage');
// const { getRedisClient } = require('./src/lib/redis-client'); // DEPRECATED: Redis client moved to wallcrawler infrastructure
const express = require('express');

const app = express();
app.use(express.json());

let stagehandClient = null;
let currentSessionId = null;
let automationStatus = 'idle';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    automation: automationStatus,
    sessionId: currentSessionId,
    vnc: {
      direct: 'vnc://localhost:5900',
      web: 'http://localhost:6080/vnc.html'
    }
  });
});

// Start job search automation
app.post('/start', async (req, res) => {
  try {
    const { sessionId, searchParams } = req.body;
    
    if (automationStatus !== 'idle') {
      return res.status(400).json({ error: 'Automation already running' });
    }

    // Get session from DynamoDB
    const session = await dynamoJobStorage.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Initialize Stagehand with visible browser (for VNC)
    stagehandClient = new StagehandClient({
      provider: 'local',
      headless: false, // Important: visible browser for VNC
      args: [
        '--display=:99', // Use the Xvfb display
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    });

    currentSessionId = sessionId;
    automationStatus = 'running';

    // Start automation asynchronously
    runAutomationSession(session).catch(console.error);

    res.json({ 
      status: 'started', 
      sessionId,
      vncUrl: 'ws://localhost:6080/websockify'
    });

  } catch (error) {
    console.error('Error starting automation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop automation
app.post('/stop', async (req, res) => {
  try {
    automationStatus = 'stopping';
    
    if (stagehandClient) {
      await stagehandClient.close();
      stagehandClient = null;
    }
    
    automationStatus = 'idle';
    currentSessionId = null;

    res.json({ status: 'stopped' });

  } catch (error) {
    console.error('Error stopping automation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get VNC connection info
app.get('/vnc', (req, res) => {
  res.json({
    webUrl: 'http://localhost:6080/vnc.html',
    websocketUrl: 'ws://localhost:6080/websockify',
    directVnc: 'vnc://localhost:5900'
  });
});

async function runAutomationSession(session) {
  const redis = await getRedisClient();
  
  try {
    // Publish status updates
    await redis.publish(`automation:${session.id}`, JSON.stringify({
      type: 'automation_status',
      data: { status: 'starting', message: 'Initializing browser automation' }
    }));

    // Enable platforms
    const enabledPlatforms = session.searchParams.platforms.filter(p => p.enabled);
    
    for (const platform of enabledPlatforms) {
      try {
        await redis.publish(`automation:${session.id}`, JSON.stringify({
          type: 'automation_status',
          data: { 
            status: 'running', 
            message: `Searching ${platform.name}`,
            platform: platform.name
          }
        }));

        // Start automation session on platform
        await stagehandClient.startJobSearch(session.searchParams, platform.name);

        // Extract jobs periodically
        const extractJobs = async () => {
          if (automationStatus !== 'running') return;

          const jobs = await stagehandClient.extractJobs(session.id);
          
          if (jobs.length > 0) {
            // Save to DynamoDB
            await Promise.all(jobs.map(job => dynamoJobStorage.saveJob(job)));

            // Notify via Redis
            await redis.publish(`automation:${session.id}`, JSON.stringify({
              type: 'jobs_extracted',
              data: { 
                jobs, 
                totalJobsFound: jobs.length,
                platform: platform.name
              }
            }));
          }

          // Send viewport update
          if (stagehandClient.page) {
            const screenshot = await stagehandClient.page.screenshot({ 
              format: 'jpeg', 
              quality: 60 
            });
            
            await redis.publish(`automation:${session.id}`, JSON.stringify({
              type: 'viewport_update',
              data: {
                screenshot: screenshot.toString('base64'),
                currentUrl: stagehandClient.page.url(),
                timestamp: Date.now()
              }
            }));
          }

          // Continue if still running
          if (automationStatus === 'running') {
            setTimeout(extractJobs, 10000); // Every 10 seconds
          }
        };

        // Start extraction
        setTimeout(extractJobs, 2000);

      } catch (platformError) {
        console.error(`Error with platform ${platform.name}:`, platformError);
        
        await redis.publish(`automation:${session.id}`, JSON.stringify({
          type: 'automation_error',
          data: {
            error: platformError.message,
            platform: platform.name,
            requiresIntervention: platformError.name === 'TimeoutError'
          }
        }));
      }
    }

  } catch (error) {
    console.error('Automation error:', error);
    automationStatus = 'error';
    
    await redis.publish(`automation:${session.id}`, JSON.stringify({
      type: 'automation_error',
      data: {
        error: error.message,
        requiresIntervention: true
      }
    }));
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Automation worker listening on port ${PORT}`);
  console.log(`VNC web interface: http://localhost:6080/vnc.html`);
  console.log(`Direct VNC: vnc://localhost:5900`);
});