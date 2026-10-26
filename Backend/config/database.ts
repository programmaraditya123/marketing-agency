import { MongoClient, type Collection } from "mongodb";
import type { Environment } from "./env";
import type { CrawlJob } from "../types/crawler";
import type { User, Session, Activity, Visitor } from "../types/auth";
export async function connectDatabase(env: Environment) {
  const client = new MongoClient(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const jobs: Collection<CrawlJob> = client.db(env.mongoDatabase).collection("website_analyses");
    await jobs.createIndex({ createdAt: -1 });
    await jobs.createIndex({ ownerId: 1, createdAt: -1, _id: -1 });
    await jobs.createIndex({ parentAnalysisId: 1, competitorId: 1 });
    await jobs.updateMany({ "marketingPlan.status": "generating" }, {
      $set: { "marketingPlan.status": "failed", "marketingPlan.error": "Marketing plan interrupted by restart. Please retry." },
    });
    await jobs.updateMany({ "marketResearch.status": { $in: ["collecting", "analyzing"] } }, {
      $set: { "marketResearch.status": "failed", "marketResearch.error": "Research interrupted by restart. Retry to continue with saved evidence." },
    });
    await jobs.updateMany({ "competitors.status": { $in: ["queued", "generating", "keywords", "searching"] } }, {
      $set: { "competitors.status": "failed", "competitors.error": "Competitor search interrupted by a restart. Please retry.", "competitors.updatedAt": new Date().toISOString() },
    });
    const db = client.db(env.mongoDatabase);
    const users = db.collection<User>("users"), sessions = db.collection<Session>("sessions"), activities = db.collection<Activity>("user_activity");
    const visitors = db.collection<Visitor>("visitors");
    await users.createIndex({ email: 1 }, { unique: true });
    await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await sessions.createIndex({ userId: 1 });
    await sessions.createIndex({ visitorId: 1 });
    await jobs.createIndex({ userId: 1, createdAt: -1, _id: -1 });
    await jobs.createIndex({ visitorId: 1, createdAt: -1, _id: -1 });
    await activities.createIndex({ userId: 1, createdAt: -1, _id: -1 });
    await activities.createIndex({ visitorId: 1, createdAt: -1, _id: -1 });
    await visitors.createIndex({ userId: 1 });
    await activities.createIndex({ ownerId: 1, createdAt: -1, _id: -1 });
    await activities.createIndex({ analysisId: 1 });
    await activities.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await jobs.updateMany({ status: { $in: ["queued", "crawling", "analyzing"] } }, {
      $set: { status: "failed", error: "Analysis interrupted by a server restart. Please start again.", updatedAt: new Date().toISOString() },
    });
    return { client, jobs, users, sessions, activities, visitors };
  } catch (error) { await client.close(); throw error; }
}
