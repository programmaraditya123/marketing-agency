export interface WebsiteSeoSummary {
  url: string;
  title: string;
  titleLength: number;
  titleEvaluation: string;
  description: string;
  descriptionLength: number;
  descriptionEvaluation: string;
  h1Tags: string[];
  h2Tags: string[];
  canonical?: string | null;
  openGraphTitle?: string | null;
  openGraphDescription?: string | null;
  schemaTypes: string[];
  detectedKeywords: string[];
  overallSeoHealthScore: number;
}

export interface SeoGapFactor {
  category: string;
  status: "competitor_leads" | "tied" | "client_leads";
  impact: "critical" | "high" | "medium";
  issue: string;
  whyCompetitorWins: string;
}

export interface KeywordGapItem {
  keyword: string;
  searchIntent: "commercial" | "transactional" | "informational" | "navigational";
  impactLevel: "high" | "medium" | "niche";
  whyItMatters: string;
  clientStatus: "missing" | "weak" | "ranking";
}

export interface ContentInjectionRecommendation {
  pageSection: string;
  recommendedKeywords: string[];
  suggestedCopySnippet: string;
}

export interface ActionStep {
  stepNumber: number;
  title: string;
  action: string;
  estimatedImpactTime: string;
}

export interface CopyableMetadata {
  htmlMetaTags: string;
  jsonLdSchema: string;
  nextJsMetadata: string;
}

export interface SeoComparisonResult {
  summary: string;
  competitiveDisadvantageDiagnosis: string;
  organicOpportunityScore: number;
  clientProfile: WebsiteSeoSummary;
  competitorProfile: WebsiteSeoSummary;
  gapFactors: SeoGapFactor[];
  keywordGaps: KeywordGapItem[];
  sharedKeywords: string[];
  recommendedTitle: string;
  recommendedTitleRationale: string;
  recommendedDescription: string;
  recommendedDescriptionRationale: string;
  recommendedH1: string;
  recommendedH2s: string[];
  primaryTargetKeywords: string[];
  secondaryTargetKeywords: string[];
  contentInjectionPlan: ContentInjectionRecommendation[];
  copyableMetadata: CopyableMetadata;
  topActionSteps: ActionStep[];
}

export interface SeoComparisonState {
  status: "idle" | "generating" | "completed" | "failed";
  activeCompetitorUrl?: string;
  activeCompetitorDomain?: string;
  result?: SeoComparisonResult;
  savedComparisons?: Record<string, SeoComparisonResult>;
  error?: string;
  updatedAt: string;
}

export interface WebsiteSeoInput {
  url: string;
  title: string;
  description: string;
  headings: string[];
  metaKeywords: string;
  canonical?: string | null;
  openGraphTitle?: string | null;
  openGraphDescription?: string | null;
  structuredDataTypes: string[];
  sampleText: string;
}

export interface SeoComparisonInput {
  client: WebsiteSeoInput;
  competitor: WebsiteSeoInput;
  businessContext?: string | null;
}
