import { randomBytes } from "node:crypto";
import type { Collection } from "mongodb";
import type { CrawlJob } from "../../types/crawler";
import type { Activity, BrandBrief } from "../../types/auth";
import { AppError } from "../../utils/app-error";
import { cursorFilter, encodeCursor } from "./workspace.cursor";
export function createWorkspaceService(jobs: Collection<CrawlJob>, activities: Collection<Activity>) {
  async function record(ownerId: string, type: Activity["type"], detail: string, analysisId?: string) {
    await activities.insertOne({ _id: randomBytes(16).toString("hex"), ownerId, type, detail, analysisId,
      createdAt: new Date(), expiresAt: new Date(Date.now() + 90 * 86400000) });
  }
  async function owned(ownerId: string, id: string) {
    if (!await jobs.findOne({ _id: id, ownerId }, { projection: { _id: 1 } })) throw new AppError(404, "Analysis not found.");
  }
  return {
    record, owned,
    async history(ownerId: string, before?: string) {
      const rows = await jobs.find({ ownerId, ...cursorFilter(before) },
        { projection: { _id: 1, startUrl: 1, status: 1, createdAt: 1, updatedAt: 1 } }).sort({ createdAt: -1, _id: -1 }).limit(51).toArray();
      return { items: rows.slice(0, 50).map(job => ({ id: job._id, startUrl: job.startUrl, status: job.status, createdAt: job.createdAt, updatedAt: job.updatedAt })), nextCursor: rows.length > 50 ? encodeCursor(rows[49].createdAt, rows[49]._id) : null };
    },
    async activity(ownerId: string, before?: string) {
      const rows = await activities.find({ ownerId, ...cursorFilter(before, true) },
        { projection: { ownerId: 0, expiresAt: 0 } }).sort({ createdAt: -1, _id: -1 }).limit(51).toArray();
      return { items: rows.slice(0, 50).map(event => ({ id: event._id, type: event.type, detail: event.detail, analysisId: event.analysisId, createdAt: event.createdAt })), nextCursor: rows.length > 50 ? encodeCursor(rows[49].createdAt, rows[49]._id) : null };
    },
    async saveBrief(ownerId: string, id: string, brief: BrandBrief) {
      const result = await jobs.updateOne({ _id: id, ownerId }, { $set: { brief, updatedAt: new Date().toISOString() } });
      if (!result.matchedCount) throw new AppError(404, "Analysis not found.");
      await record(ownerId, "brief_updated", "Brand brief saved", id);
      return brief;
    },
    async track(ownerId: string, id: string, section: string) {
      await owned(ownerId, id);
      await record(ownerId, "section_viewed", section, id);
    },
  };
}
export type WorkspaceService = ReturnType<typeof createWorkspaceService>;
