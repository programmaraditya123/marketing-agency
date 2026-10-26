export interface User {
  _id: string; email: string; name: string; passwordHash: string; createdAt: Date;
}
export interface Session {
  _id: string; ownerId: string; userId?: string; createdAt: Date; expiresAt: Date;
}
export interface Identity { sessionId: string; ownerId: string; userId?: string }
export interface Activity {
  _id: string; ownerId: string; type: "website_searched" | "section_viewed" | "brief_updated" | "signed_in" | "signed_up";
  analysisId?: string; detail: string; createdAt: Date; expiresAt: Date;
}
export interface BrandBrief {
  product: string; audience: string; pastSteps: string; futurePlans: string; goals: string;
}
declare module "fastify" {
  interface FastifyRequest { identity: Identity }
}
