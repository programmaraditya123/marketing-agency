export interface SocialPlatformRecommendation {
  platform: string;
  priority: "primary" | "secondary" | "experimental";
  why: string;
  postingCadence: string;
  bestDays: string[];
  bestTimeWindows: string[];
  timeRationale: string;
  recommendedFormats: string[];
}

export interface ContentPillar {
  name: string;
  allocationPercent: number;
  goal: string;
  contentTypes: string[];
  examplePostIdeas: string[];
}

export interface SchedulePost {
  day: string;
  platform: string;
  timeSlot: string;
  pillar: string;
  contentType: string;
  topic: string;
  hook: string;
  callToAction: string;
}

export interface ContentStrategy {
  summary: string;
  targetAudienceInsights: string;
  platforms: SocialPlatformRecommendation[];
  contentPillars: ContentPillar[];
  weeklySchedule: SchedulePost[];
  growthTips: string[];
}

export interface ContentStrategyState {
  status: "generating" | "completed" | "failed";
  focusGoal?: string;
  result?: ContentStrategy;
  error?: string;
  updatedAt: string;
}
