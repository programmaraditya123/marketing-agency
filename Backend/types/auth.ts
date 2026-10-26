export interface User {
  _id: string; email: string; name: string; passwordHash: string; createdAt: Date;
  userId?: string; visitorId?: string; visitorIds?: string[];
}
export interface Visitor { _id: string; visitorId: string; userId: string | null; createdAt: Date; lastSeenAt: Date }
export interface Attribution { userId: string | null; visitorId: string | null }
export interface Session {
  _id: string; ownerId: string; userId?: string | null; visitorId?: string; createdAt: Date; expiresAt: Date;
}
export interface Identity { sessionId: string; ownerId: string; userId?: string; visitorId?: string }
export interface Activity {
  userId?: string | null; visitorId?: string | null;
  _id: string; ownerId: string; type: "website_searched" | "section_viewed" | "brief_updated" | "signed_in" | "signed_up" | "competitors_searched" | "competitor_analyzed" | "market_researched" | "marketing_planned";
  analysisId?: string; detail: string; createdAt: Date; expiresAt: Date;
}
export interface BrandBrief {
  product: string; audience: string; pastSteps: string; futurePlans: string; goals: string;
}
declare module "fastify" {
  interface FastifyRequest { identity: Identity }
}
