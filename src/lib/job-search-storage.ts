import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { Job, JobSearchParams, ApplicationStatus } from "@/types";

// DynamoDB attribute value types
type DynamoDBAttributeValue = string | number | boolean | null | undefined;
type DynamoDBUpdateValues = Record<string, DynamoDBAttributeValue>;

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const docClient = DynamoDBDocumentClient.from(client);

const JOBS_TABLE = process.env.JOBS_TABLE_NAME || "career-agent-jobs";
const JOB_SEARCHES_TABLE =
  process.env.SESSIONS_TABLE_NAME || "career-agent-sessions";

class JobSearchStorage {
  // Job Search Params Operations (Persistent User Configurations)
  async createJobSearchParams(
    jobSearchParams: JobSearchParams
  ): Promise<JobSearchParams> {
    await docClient.send(
      new PutCommand({
        TableName: JOB_SEARCHES_TABLE,
        Item: {
          ...jobSearchParams,
          createdAt: jobSearchParams.createdAt.toISOString(),
          updatedAt: jobSearchParams.updatedAt.toISOString(),
        },
      })
    );
    return jobSearchParams;
  }

  async getJobSearchParams(id: string): Promise<JobSearchParams | undefined> {
    const result = await docClient.send(
      new GetCommand({
        TableName: JOB_SEARCHES_TABLE,
        Key: { id },
      })
    );

    if (!result.Item) return undefined;

    return {
      ...result.Item,
      createdAt: new Date(result.Item.createdAt),
      updatedAt: new Date(result.Item.updatedAt),
    } as JobSearchParams;
  }

  async updateJobSearchParams(
    id: string,
    updates: Partial<JobSearchParams>
  ): Promise<JobSearchParams | undefined> {
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: DynamoDBUpdateValues = {};

    Object.entries(updates).forEach(([key, value], index) => {
      if (key !== "id") {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        updateExpression.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] =
          value instanceof Date
            ? value.toISOString()
            : (value as DynamoDBAttributeValue);
      }
    });

    // Always update updatedAt
    const updatedAtIndex = Object.keys(updates).length;
    updateExpression.push(`#attr${updatedAtIndex} = :val${updatedAtIndex}`);
    expressionAttributeNames[`#attr${updatedAtIndex}`] = "updatedAt";
    expressionAttributeValues[`:val${updatedAtIndex}`] =
      new Date().toISOString();

    try {
      const result = await docClient.send(
        new UpdateCommand({
          TableName: JOB_SEARCHES_TABLE,
          Key: { id },
          UpdateExpression: `SET ${updateExpression.join(", ")}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: "ALL_NEW",
        })
      );

      if (!result.Attributes) return undefined;

      return {
        ...result.Attributes,
        createdAt: new Date(result.Attributes.createdAt),
        updatedAt: new Date(result.Attributes.updatedAt),
      } as JobSearchParams;
    } catch (error) {
      console.error("Error updating job search:", error);
      return undefined;
    }
  }

  async getAllJobSearchParams(): Promise<JobSearchParams[]> {
    const result = await docClient.send(
      new ScanCommand({
        TableName: JOB_SEARCHES_TABLE,
      })
    );

    return (result.Items || [])
      .map(
        (item) =>
          ({
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          } as JobSearchParams)
      )
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async deleteJobSearchParams(id: string): Promise<boolean> {
    try {
      await docClient.send(
        new DeleteCommand({
          TableName: JOB_SEARCHES_TABLE,
          Key: { id },
        })
      );
      return true;
    } catch (error) {
      console.error("Error deleting job search params:", error);
      return false;
    }
  }

  // Job Operations (Results from searches)
  async saveJob(job: Job): Promise<Job> {
    const jobWithTimestamps = {
      ...job,
      extractedAt: job.extractedAt.toISOString(),
      savedAt: new Date().toISOString(),
      ...(job.appliedAt && { appliedAt: job.appliedAt.toISOString() }),
    };

    await docClient.send(
      new PutCommand({
        TableName: JOBS_TABLE,
        Item: jobWithTimestamps,
      })
    );

    // Update job search params job count
    const jobSearchParams = await this.getJobSearchParams(job.sessionId);
    if (jobSearchParams) {
      await this.updateJobSearchParams(jobSearchParams.id, {
        jobsFound: jobSearchParams.jobsFound + 1,
      });
    }

    return {
      ...job,
      savedAt: new Date(),
    };
  }

  async saveMultipleJobs(jobs: Job[]): Promise<Job[]> {
    const savedJobs = await Promise.all(jobs.map((job) => this.saveJob(job)));
    return savedJobs;
  }

  async getJob(id: string): Promise<Job | undefined> {
    const result = await docClient.send(
      new GetCommand({
        TableName: JOBS_TABLE,
        Key: { id },
      })
    );

    if (!result.Item) return undefined;

    return {
      ...result.Item,
      extractedAt: new Date(result.Item.extractedAt),
      savedAt: result.Item.savedAt ? new Date(result.Item.savedAt) : undefined,
      appliedAt: result.Item.appliedAt
        ? new Date(result.Item.appliedAt)
        : undefined,
    } as Job;
  }

  async getJobsBySearch(sessionId: string): Promise<Job[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: JOBS_TABLE,
        IndexName: "SessionIndex",
        KeyConditionExpression: "sessionId = :sessionId",
        ExpressionAttributeValues: {
          ":sessionId": sessionId,
        },
      })
    );

    return (result.Items || [])
      .map(
        (item) =>
          ({
            ...item,
            extractedAt: new Date(item.extractedAt),
            savedAt: item.savedAt ? new Date(item.savedAt) : undefined,
            appliedAt: item.appliedAt ? new Date(item.appliedAt) : undefined,
          } as Job)
      )
      .sort((a, b) => b.extractedAt.getTime() - a.extractedAt.getTime());
  }

  async getSavedJobs(): Promise<Job[]> {
    const result = await docClient.send(
      new ScanCommand({
        TableName: JOBS_TABLE,
        FilterExpression: "attribute_exists(savedAt)",
      })
    );

    return (result.Items || [])
      .map(
        (item) =>
          ({
            ...item,
            extractedAt: new Date(item.extractedAt),
            savedAt: new Date(item.savedAt),
            appliedAt: item.appliedAt ? new Date(item.appliedAt) : undefined,
          } as Job)
      )
      .sort((a, b) => (b.savedAt?.getTime() || 0) - (a.savedAt?.getTime() || 0));
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: DynamoDBUpdateValues = {};

    Object.entries(updates).forEach(([key, value], index) => {
      if (key !== "id") {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        updateExpression.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] =
          value instanceof Date
            ? value.toISOString()
            : (value as DynamoDBAttributeValue);
      }
    });

    if (updateExpression.length === 0) return undefined;

    try {
      const result = await docClient.send(
        new UpdateCommand({
          TableName: JOBS_TABLE,
          Key: { id },
          UpdateExpression: `SET ${updateExpression.join(", ")}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: "ALL_NEW",
        })
      );

      if (!result.Attributes) return undefined;

      return {
        ...result.Attributes,
        extractedAt: new Date(result.Attributes.extractedAt),
        savedAt: result.Attributes.savedAt
          ? new Date(result.Attributes.savedAt)
          : undefined,
        appliedAt: result.Attributes.appliedAt
          ? new Date(result.Attributes.appliedAt)
          : undefined,
      } as Job;
    } catch (error) {
      console.error("Error updating job:", error);
      return undefined;
    }
  }

  async updateJobApplication(
    jobId: string,
    status: ApplicationStatus,
    method: "manual" | "automated"
  ): Promise<Job | undefined> {
    const updates: Partial<Job> = {
      applicationStatus: status,
      appliedAt: new Date(),
      applicationMethod: method,
    };

    return this.updateJob(jobId, updates);
  }

  async deleteJob(id: string): Promise<boolean> {
    try {
      await docClient.send(
        new DeleteCommand({
          TableName: JOBS_TABLE,
          Key: { id },
        })
      );
      return true;
    } catch (error) {
      console.error("Error deleting job:", error);
      return false;
    }
  }

  async searchJobs(query: string): Promise<Job[]> {
    const result = await docClient.send(
      new ScanCommand({
        TableName: JOBS_TABLE,
        FilterExpression:
          "contains(title, :query) OR contains(company, :query) OR contains(description, :query)",
        ExpressionAttributeValues: {
          ":query": query,
        },
      })
    );

    return (result.Items || [])
      .map(
        (item) =>
          ({
            ...item,
            extractedAt: new Date(item.extractedAt),
            savedAt: item.savedAt ? new Date(item.savedAt) : undefined,
            appliedAt: item.appliedAt ? new Date(item.appliedAt) : undefined,
          } as Job)
      )
      .sort((a, b) => b.extractedAt.getTime() - a.extractedAt.getTime());
  }

  async getStats(): Promise<{
    totalJobs: number;
    savedJobs: number;
    appliedJobs: number;
    totalSearches: number;
  }> {
    const [allJobs, savedJobs, allSearches] = await Promise.all([
      docClient.send(new ScanCommand({ TableName: JOBS_TABLE })),
      this.getSavedJobs(),
      this.getAllJobSearchParams(),
    ]);

    const appliedJobs = (allJobs.Items || []).filter(
      (item) => item.appliedAt
    ).length;

    return {
      totalJobs: allJobs.Items?.length || 0,
      savedJobs: savedJobs.length,
      appliedJobs,
      totalSearches: allSearches.length,
    };
  }
}

export const jobSearchStorage = new JobSearchStorage();
