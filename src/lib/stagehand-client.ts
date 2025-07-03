import { Stagehand } from "@wallcrawler/stagehand";
import type { StagehandConfig, JobSearchParams, Job } from "@/types";
import { z } from "zod";

export class StagehandClient {
  private stagehand: Stagehand | null = null;
  private config: StagehandConfig;

  constructor(config: StagehandConfig) {
    this.config = config;
  }

  async initialize() {
    if (this.stagehand) {
      return this.stagehand;
    }

    this.stagehand = new Stagehand({
      env: this.config.provider === "local" ? "LOCAL" : "BROWSERBASE",
      apiKey: this.config.apiKey,
      verbose: 1, // Show errors only
      // Note: headless configuration moved to provider-level
    });

    await this.stagehand.init();
    return this.stagehand;
  }

  async startJobSearch(params: JobSearchParams, platform: string) {
    const stagehand = await this.initialize();
    const page = stagehand.page;

    // Navigate to the job platform
    const platformUrls: Record<string, string> = {
      linkedin: "https://www.linkedin.com/jobs",
      indeed: "https://www.indeed.com",
      glassdoor: "https://www.glassdoor.com/Job/index.htm",
      angellist: "https://angel.co/jobs",
      dice: "https://www.dice.com",
      monster: "https://www.monster.com",
    };

    await page.goto(platformUrls[platform] || platformUrls.linkedin);

    // Use Stagehand to search for jobs
    await page.act(
      `Search for ${params.keywords.join(" ")} jobs in ${params.location}`
    );

    // Apply filters
    if (params.jobType !== "any") {
      await page.act(`Filter by ${params.jobType} jobs`);
    }

    if (params.experienceLevel.length > 0) {
      await page.act(
        `Filter by experience level: ${params.experienceLevel.join(", ")}`
      );
    }

    return page;
  }

  async extractJobs(searchSessionId: string): Promise<Job[]> {
    if (!this.stagehand) {
      throw new Error("Stagehand not initialized");
    }

    const page = this.stagehand.page;

    // Define the job extraction schema
    const jobSchema = z.object({
      jobs: z.array(
        z.object({
          title: z.string().describe("Job title"),
          company: z.string().describe("Company name"),
          location: z.string().describe("Job location"),
          jobType: z
            .enum(["remote", "onsite", "hybrid"])
            .optional()
            .describe("Job type if specified"),
          salary: z.string().optional().describe("Salary range if available"),
          description: z.string().describe("Job description snippet"),
          url: z.string().url().describe("Link to full job posting"),
          postedDate: z.string().describe("When the job was posted"),
        })
      ),
    });

    type ExtractedJobData = z.infer<typeof jobSchema>;
    type ExtractedJob = ExtractedJobData["jobs"][0];

    try {
      const extractedData: ExtractedJobData = await page.extract({
        instruction: "Extract all job listings visible on the page",
        schema: jobSchema,
      });

      // Transform extracted data to our Job interface
      return extractedData.jobs.map((job: ExtractedJob) => ({
        id: `${searchSessionId}_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}`,
        title: job.title,
        company: job.company,
        location: job.location,
        jobType: job.jobType || "onsite",
        salary: job.salary,
        description: job.description,
        url: job.url,
        platform: new URL(page.url()).hostname
          .replace("www.", "")
          .split(".")[0],
        postedDate: job.postedDate,
        extractedAt: new Date(),
        sessionId: searchSessionId,
      }));
    } catch (error) {
      console.error("Error extracting jobs:", error);
      return [];
    }
  }

  async applyToJob(job: Job): Promise<boolean> {
    if (!this.stagehand) {
      throw new Error("Stagehand not initialized");
    }

    const agent = this.stagehand.agent({
      provider: "openai",
      model: "gpt-4o",
    });

    try {
      await agent.execute(`
        Navigate to ${job.url} and apply to this job.
        Fill out the application form with appropriate information.
        Click submit when ready.
      `);

      return true;
    } catch (error) {
      console.error("Error applying to job:", error);
      return false;
    }
  }

  async cleanup() {
    if (this.stagehand) {
      await this.stagehand.close();
      this.stagehand = null;
    }
  }

  getPage() {
    return this.stagehand?.page;
  }
}
