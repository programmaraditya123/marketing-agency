import type { Attribution, Identity } from "../../types/auth";
export function documentIdentity(identity?: Identity): Attribution {
  return { userId: identity?.userId || null, visitorId: identity?.visitorId || null };
}
