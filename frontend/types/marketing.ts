export interface MarketingBudget { currency: "INR" | "USD" | "EUR" | "GBP" | "AUD" | "CAD" | "SGD" | "AED"; dailyBudget: number; monthlyBudget: number }
export interface MarketingChannel {
  name: string; approach: "paid" | "organic" | "owned"; allocationPercent: number;
  why: string; when: string; firstSteps: string[]; successMetric: string; scaleOrStop: string;
  dailyAllocation: number; monthlyAllocation: number;
}
export interface MarketingPlan {
  summary: string; channels: MarketingChannel[]; assumptions: string[]; currency: string;
  effectiveDailyBudget: number; effectiveMonthlyBudget: number;
  unallocatedDaily: number; unallocatedMonthly: number; planningDays: 30;
}
export interface MarketingState {
  trendsCollectedAt?: string | null;
  status: "generating" | "completed" | "failed"; budget: MarketingBudget; updatedAt: string;
  result?: MarketingPlan; error?: string;
  previous?: { budget: MarketingBudget; result: MarketingPlan; updatedAt: string };
}
