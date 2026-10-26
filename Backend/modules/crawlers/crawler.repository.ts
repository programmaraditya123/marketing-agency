import type { Collection } from "mongodb";
import type { CrawlJob } from "../../types/crawler";
import { AppError } from "../../utils/app-error";
export function createRepository(jobs: Collection<CrawlJob>) {
  return {
    async insert(job: CrawlJob) { await jobs.insertOne(job); },
    async update(id: string, fields: Partial<CrawlJob>) {
      await jobs.updateOne({ _id: id }, { $set: { ...fields, updatedAt: new Date().toISOString() } });
    },
    async get(id: string) {
      const job = await jobs.findOne({ _id: id });
      if (!job) throw new AppError(404, "Analysis not found.");
      return job;
    },
  };
}
export type CrawlRepository = ReturnType<typeof createRepository>;
