import { MongoClient, type Collection } from "mongodb";
import type { Environment } from "./env";
import type { CrawlJob } from "../types/crawler";
import type { User, Session, Activity } from "../types/auth";
export async function connectDatabase(env: Environment) {
  const client = new MongoClient(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const jobs: Collection<CrawlJob> = client.db(env.mongoDatabase).collection("website_analyses");
    await jobs.createIndex({ createdAt: -1 });
    await jobs.createIndex({ ownerId: 1, createdAt: -1, _id: -1 });
    const db = client.db(env.mongoDatabase);
    const users = db.collection<User>("users"), sessions = db.collection<Session>("sessions"), activities = db.collection<Activity>("user_activity");
    await users.createIndex({ email: 1 }, { unique: true });
    await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await sessions.createIndex({ userId: 1 });
    await activities.createIndex({ ownerId: 1, createdAt: -1, _id: -1 });
    await activities.createIndex({ analysisId: 1 });
    await activities.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await jobs.updateMany({ status: { $in: ["queued", "crawling", "analyzing"] } }, {
      $set: { status: "failed", error: "Analysis interrupted by a server restart. Please start again.", updatedAt: new Date().toISOString() },
    });
    return { client, jobs, users, sessions, activities };
  } catch (error) { await client.close(); throw error; }
}
