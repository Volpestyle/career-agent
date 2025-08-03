const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const secretsManager = new AWS.SecretsManager();

const USERS_TABLE = process.env.USERS_TABLE;
const WALLCRAWLER_API_KEY_SECRET_ARN = process.env.WALLCRAWLER_API_KEY_SECRET_ARN;

let wallcrawlerApiKey;

async function getWallcrawlerApiKey() {
  if (wallcrawlerApiKey) {
    return wallcrawlerApiKey;
  }

  try {
    const secret = await secretsManager.getSecretValue({
      SecretId: WALLCRAWLER_API_KEY_SECRET_ARN
    }).promise();

    wallcrawlerApiKey = secret.SecretString;
    return wallcrawlerApiKey;
  } catch (error) {
    console.error('Failed to retrieve Wallcrawler API key:', error);
    throw error;
  }
}

async function getActiveSearches() {
  const now = new Date().toISOString();
  
  const params = {
    TableName: USERS_TABLE,
    IndexName: 'ActiveSearchesIndex',
    KeyConditionExpression: 'isActive = :active AND nextRunAt <= :now',
    ExpressionAttributeValues: {
      ':active': 'true',
      ':now': now
    }
  };

  try {
    const result = await dynamodb.query(params).promise();
    return result.Items || [];
  } catch (error) {
    console.error('Failed to get active searches:', error);
    throw error;
  }
}

async function runSearch(search) {
  const apiKey = await getWallcrawlerApiKey();
  
  console.log(`Running search for user ${search.userId}: ${search.searchName}`);
  
  // TODO: Implement actual Wallcrawler API call
  // This is a placeholder for the actual implementation
  // You would make an HTTP request to the Wallcrawler API here
  
  // For now, we'll just log and update the next run time
  const results = {
    jobsFound: Math.floor(Math.random() * 10),
    timestamp: new Date().toISOString()
  };

  return results;
}

async function updateSearchNextRun(userId, searchId) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: userId,
      dataType: `SEARCH#${searchId}`
    },
    UpdateExpression: 'SET nextRunAt = :nextRun, lastRunAt = :lastRun',
    ExpressionAttributeValues: {
      ':nextRun': tomorrow.toISOString(),
      ':lastRun': new Date().toISOString()
    }
  };

  try {
    await dynamodb.update(params).promise();
  } catch (error) {
    console.error('Failed to update search next run:', error);
    throw error;
  }
}

async function saveNewJobs(userId, jobs) {
  if (!jobs || jobs.length === 0) {
    return;
  }

  const putRequests = jobs.map(job => ({
    PutRequest: {
      Item: {
        userId: userId,
        dataType: `JOB#${job.id}`,
        jobId: job.id,
        ...job,
        savedAt: new Date().toISOString(),
        source: 'scheduled-search'
      }
    }
  }));

  const chunks = [];
  for (let i = 0; i < putRequests.length; i += 25) {
    chunks.push(putRequests.slice(i, i + 25));
  }

  for (const chunk of chunks) {
    const params = {
      RequestItems: {
        [USERS_TABLE]: chunk
      }
    };

    try {
      await dynamodb.batchWrite(params).promise();
    } catch (error) {
      console.error('Failed to save jobs:', error);
      throw error;
    }
  }
}

exports.handler = async (event) => {
  console.log('Search scheduler triggered:', JSON.stringify(event, null, 2));

  try {
    const activeSearches = await getActiveSearches();
    console.log(`Found ${activeSearches.length} active searches to run`);

    const results = [];
    
    for (const search of activeSearches) {
      try {
        const searchResults = await runSearch(search);
        
        if (searchResults.jobsFound > 0) {
          // In a real implementation, you would save the actual job data
          // await saveNewJobs(search.userId, searchResults.jobs);
        }

        await updateSearchNextRun(search.userId, search.searchId);
        
        results.push({
          userId: search.userId,
          searchId: search.searchId,
          status: 'success',
          jobsFound: searchResults.jobsFound
        });
      } catch (error) {
        console.error(`Failed to run search ${search.searchId} for user ${search.userId}:`, error);
        results.push({
          userId: search.userId,
          searchId: search.searchId,
          status: 'failed',
          error: error.message
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Search scheduler completed',
        searchesProcessed: results.length,
        results: results
      })
    };
  } catch (error) {
    console.error('Search scheduler failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Search scheduler failed',
        error: error.message
      })
    };
  }
};