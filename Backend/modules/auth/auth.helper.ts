import { randomBytes } from "node:crypto";
import type { Collection } from "mongodb";
import type { User, Session, Identity, Activity, Visitor } from "../../types/auth";
import type { CrawlJob } from "../../types/crawler";
import { AppError } from "../../utils/app-error";
import { hashPassword, verifyPassword } from "./auth.password";
import { createVisitorService } from "./auth.visitor";
type Store = { users: Collection<User>; sessions: Collection<Session>; activities: Collection<Activity>; jobs: Collection<CrawlJob>; visitors: Collection<Visitor> };
export const publicUser = (user: User) => ({ id: user._id, name: user.name, email: user.email });
export function createAuthService(store: Store) {
  const visitor = createVisitorService(store.visitors);
  async function newSession(userId?: string, visitorId?: string) {
    visitorId ||= await visitor();
    const id = randomBytes(32).toString("hex");
    const session: Session = { _id: id, ownerId: userId ? `user:${userId}` : `guest:${visitorId}`, userId: userId || null, visitorId,
      createdAt: new Date(), expiresAt: new Date(Date.now() + 604800000) };
    await store.sessions.insertOne(session);
    return { sessionId: id, ownerId: session.ownerId, userId, visitorId };
  }
  return {
    newSession, visitor,
    async bindVisitor(identity: Identity, visitorId: string): Promise<Identity> {
      const ownerId = identity.userId ? identity.ownerId : `guest:${visitorId}`;
      const fields = { userId: identity.userId || null, visitorId };
      if (!identity.userId) {
        await store.jobs.updateMany({ ownerId: identity.ownerId }, { $set: { ownerId, ...fields } });
        await store.activities.updateMany({ ownerId: identity.ownerId }, { $set: { ownerId, ...fields } });
      } else {
        // Attribute legacy records only when they have no recorded visitor yet.
        await store.jobs.updateMany({ ownerId, visitorId: { $exists: false } }, { $set: fields });
        await store.activities.updateMany({ ownerId, visitorId: { $exists: false } }, { $set: fields });
        await store.users.updateOne({ _id: identity.userId }, { $set: { userId: identity.userId, visitorId }, $addToSet: { visitorIds: visitorId } });
        await store.visitors.updateOne({ _id: visitorId }, { $set: { userId: identity.userId, lastSeenAt: new Date() } });
      }
      await store.sessions.updateOne({ _id: identity.sessionId }, { $set: { ownerId, ...fields } });
      return { ...identity, ownerId, visitorId };
    },
    async resolve(sessionId: string): Promise<Identity> {
      const session = await store.sessions.findOne({ _id: sessionId, expiresAt: { $gt: new Date() } });
      if (!session) throw new AppError(401, "Your session expired. Please sign in again.");
      return { sessionId, ownerId: session.ownerId, userId: session.userId || undefined, visitorId: session.visitorId };
    },
    async me(identity: Identity) {
      if (!identity.userId) return null;
      const user = await store.users.findOne({ _id: identity.userId });
      if (!user) throw new AppError(401, "Account not found. Please sign in again.");
      return publicUser(user);
    },
    async authenticate(mode: "register" | "login", input: { email: string; password: string; name?: string }, identity: Identity) {
      const email = input.email.trim().toLowerCase();
      let user = await store.users.findOne({ email });
      if (mode === "register") {
        if (user) throw new AppError(409, "An account already exists for this email. Please sign in.");
        const userId = randomBytes(16).toString("hex");
        user = { _id: userId, userId, visitorId: identity.visitorId, visitorIds: identity.visitorId ? [identity.visitorId] : [], email, name: input.name!.trim(), passwordHash: await hashPassword(input.password), createdAt: new Date() };
        try { await store.users.insertOne(user); }
        catch (error) { if ((error as { code?: number }).code === 11000) throw new AppError(409, "An account already exists for this email."); throw error; }
      } else {
        // Perform the same expensive derivation for nonexistent accounts.
        const valid = await verifyPassword(input.password, user?.passwordHash || `${"0".repeat(32)}:${"0".repeat(128)}`);
        if (!user || !valid) throw new AppError(401, "Email or password is incorrect.");
      }
      const ownerId = `user:${user!._id}`;
      const visitorId = identity.visitorId || await visitor();
      await store.users.updateOne({ _id: user!._id }, { $set: { userId: user!._id, visitorId }, $addToSet: { visitorIds: visitorId } });
      await store.visitors.updateOne({ _id: visitorId }, { $set: { userId: user!._id, lastSeenAt: new Date() } });
      if (!identity.userId) {
        // Preserve each document's original visitor ID when assigning an account.
        await store.jobs.updateMany({ ownerId: identity.ownerId }, { $set: { ownerId, userId: user!._id } });
        await store.activities.updateMany({ ownerId: identity.ownerId }, { $set: { ownerId, userId: user!._id } });
        await store.sessions.deleteMany({ ownerId: identity.ownerId });
      }
      await store.jobs.updateMany({ ownerId, visitorId: { $exists: false } }, { $set: { userId: user!._id, visitorId } });
      await store.activities.updateMany({ ownerId, visitorId: { $exists: false } }, { $set: { userId: user!._id, visitorId } });
      await store.sessions.deleteOne({ _id: identity.sessionId });
      const next = await newSession(user!._id, visitorId);
      await store.activities.insertOne({ _id: randomBytes(16).toString("hex"), ownerId, userId: user!._id, visitorId, type: mode === "register" ? "signed_up" : "signed_in", detail: "Account session started", createdAt: new Date(), expiresAt: new Date(Date.now() + 90 * 86400000) });
      return { identity: next, user: publicUser(user!) };
    },
    async logout(identity: Identity) {
      await store.sessions.deleteOne({ _id: identity.sessionId });
      return newSession(undefined, identity.visitorId);
    },
  };
}
export type AuthService = ReturnType<typeof createAuthService>;
