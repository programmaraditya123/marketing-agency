import { randomBytes } from "node:crypto";
import type { Collection } from "mongodb";
import type { CrawlJob } from "../../types/crawler";
import type { Activity, BrandBrief, Attribution } from "../../types/auth";
import { AppError } from "../../utils/app-error";
import { cursorFilter, encodeCursor } from "./workspace.cursor";
export function createWorkspaceService(jobs: Collection<CrawlJob>, activities: Collection<Activity>) {
  async function record(ownerId: string, type: Activity["type"], detail: string, analysisId?: string, attribution?: Attribution) {
    await activities.insertOne({ _id: randomBytes(16).toString("hex"), ownerId, userId: attribution?.userId || null, visitorId: attribution?.visitorId || null, type, detail, analysisId,
      createdAt: new Date(), expiresAt: new Date(Date.now() + 90 * 86400000) });
  }
  async function owned(ownerId: string, id: string) {
    if (!await jobs.findOne({ _id: id, ownerId }, { projection: { _id: 1 } })) throw new AppError(404, "Analysis not found.");
  }
  return {
    record, owned,
    async history(ownerId: string, before?: string, limit = 50) {
      if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new AppError(400, "History page size must be between 1 and 50.");
      const rows = await jobs.find({ ownerId, ...cursorFilter(before) },
        { projection: { _id: 1, startUrl: 1, status: 1, createdAt: 1, updatedAt: 1, parentAnalysisId: 1 } }).sort({ createdAt: -1, _id: -1 }).limit(limit + 1).toArray();
      return { scope: ownerId.startsWith("user:") ? "user" : "guest", pageSize: limit, hasMore: rows.length > limit,
        items: rows.slice(0, limit).map(job => ({ id: job._id, website: job.startUrl, startUrl: job.startUrl, type: job.parentAnalysisId ? "competitor" : "website", parentAnalysisId: job.parentAnalysisId, status: job.status, createdAt: job.createdAt, updatedAt: job.updatedAt })),
        nextCursor: rows.length > limit ? encodeCursor(rows[limit - 1].createdAt, rows[limit - 1]._id) : null };
    },
    async activity(ownerId: string, before?: string) {
      const rows = await activities.find({ ownerId, ...cursorFilter(before, true) },
        { projection: { ownerId: 0, expiresAt: 0 } }).sort({ createdAt: -1, _id: -1 }).limit(51).toArray();
      return { items: rows.slice(0, 50).map(event => ({ id: event._id, type: event.type, detail: event.detail, analysisId: event.analysisId, createdAt: event.createdAt })), nextCursor: rows.length > 50 ? encodeCursor(rows[49].createdAt, rows[49]._id) : null };
    },
    async saveBrief(ownerId: string, id: string, brief: BrandBrief, attribution?: Attribution) {
      const result = await jobs.updateOne({ _id: id, ownerId }, { $set: { brief, updatedAt: new Date().toISOString() } });
      if (!result.matchedCount) throw new AppError(404, "Analysis not found.");
      await record(ownerId, "brief_updated", "Brand brief saved", id, attribution);
      return brief;
    },
    async track(ownerId: string, id: string, section: string, attribution?: Attribution) {
      await owned(ownerId, id);
      await record(ownerId, "section_viewed", section, id, attribution);
    },
  };
}
export type WorkspaceService = ReturnType<typeof createWorkspaceService>;
