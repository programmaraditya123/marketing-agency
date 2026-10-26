import { randomBytes } from "node:crypto";
import type { Collection } from "mongodb";
import type { User, Session, Identity, Activity } from "../../types/auth";
import type { CrawlJob } from "../../types/crawler";
import { AppError } from "../../utils/app-error";
import { hashPassword, verifyPassword } from "./auth.password";
type Store = { users: Collection<User>; sessions: Collection<Session>; activities: Collection<Activity>; jobs: Collection<CrawlJob> };
export const publicUser = (user: User) => ({ id: user._id, name: user.name, email: user.email });
export function createAuthService(store: Store) {
  async function newSession(userId?: string) {
    const id = randomBytes(32).toString("hex");
    const session: Session = { _id: id, ownerId: userId ? `user:${userId}` : `guest:${id}`, userId,
      createdAt: new Date(), expiresAt: new Date(Date.now() + 604800000) };
    await store.sessions.insertOne(session);
    return { sessionId: id, ownerId: session.ownerId, userId };
  }
  return {
    newSession,
    async resolve(sessionId: string): Promise<Identity> {
      const session = await store.sessions.findOne({ _id: sessionId, expiresAt: { $gt: new Date() } });
      if (!session) throw new AppError(401, "Your session expired. Please sign in again.");
      return { sessionId, ownerId: session.ownerId, userId: session.userId };
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
        user = { _id: randomBytes(16).toString("hex"), email, name: input.name!.trim(), passwordHash: await hashPassword(input.password), createdAt: new Date() };
        try { await store.users.insertOne(user); }
        catch (error) { if ((error as { code?: number }).code === 11000) throw new AppError(409, "An account already exists for this email."); throw error; }
      } else {
        // Perform the same expensive derivation for nonexistent accounts.
        const valid = await verifyPassword(input.password, user?.passwordHash || `${"0".repeat(32)}:${"0".repeat(128)}`);
        if (!user || !valid) throw new AppError(401, "Email or password is incorrect.");
      }
      const ownerId = `user:${user!._id}`;
      if (!identity.userId) {
        await store.jobs.updateMany({ ownerId: identity.ownerId }, { $set: { ownerId } });
        await store.activities.updateMany({ ownerId: identity.ownerId }, { $set: { ownerId } });
      }
      await store.sessions.deleteOne({ _id: identity.sessionId });
      const next = await newSession(user!._id);
      await store.activities.insertOne({ _id: randomBytes(16).toString("hex"), ownerId, type: mode === "register" ? "signed_up" : "signed_in", detail: "Account session started", createdAt: new Date(), expiresAt: new Date(Date.now() + 90 * 86400000) });
      return { identity: next, user: publicUser(user!) };
    },
    async logout(identity: Identity) {
      await store.sessions.deleteOne({ _id: identity.sessionId });
      return newSession();
    },
  };
}
export type AuthService = ReturnType<typeof createAuthService>;
