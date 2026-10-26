import { randomBytes } from "node:crypto";
import type { Collection } from "mongodb";
import type { Visitor } from "../../types/auth";
export function createVisitorService(visitors: Collection<Visitor>) {
  return async (provenId?: string, proposedId?: string) => {
    if (provenId) {
      const saved = await visitors.findOne({ _id: provenId });
      if (saved) { await visitors.updateOne({ _id: provenId }, { $set: { lastSeenAt: new Date() } }); return provenId; }
    }
    // A public frontend ID is a proposal, never proof of access to existing data.
    let id = provenId || (proposedId && /^[a-f0-9]{64}$/.test(proposedId) ? proposedId : randomBytes(32).toString("hex"));
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await visitors.insertOne({ _id: id, visitorId: id, userId: null, createdAt: new Date(), lastSeenAt: new Date() });
        return id;
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
        id = randomBytes(32).toString("hex");
      }
    }
    throw new Error("Could not establish visitor identity");
  };
}
