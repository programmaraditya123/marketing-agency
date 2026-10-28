from typing import Literal
from pydantic import Field
from schemas.analysis import StrictModel


class WebsiteSeoSummary(StrictModel):
    url: str = Field(max_length=2048)
    title: str = Field(default="")
    titleLength: int = Field(default=0, ge=0, le=1000)
    titleEvaluation: str = Field(default="")
    description: str = Field(default="")
    descriptionLength: int = Field(default=0, ge=0, le=2000)
    descriptionEvaluation: str = Field(default="")
    h1Tags: list[str] = Field(default_factory=list, max_length=10)
    h2Tags: list[str] = Field(default_factory=list, max_length=20)
    canonical: str | None = Field(default=None, max_length=2048)
    openGraphTitle: str | None = Field(default=None, max_length=500)
    openGraphDescription: str | None = Field(default=None, max_length=1000)
    schemaTypes: list[str] = Field(default_factory=list, max_length=15)
    detectedKeywords: list[str] = Field(default_factory=list, max_length=30)
    overallSeoHealthScore: int = Field(default=50, ge=0, le=100)


class SeoGapFactor(StrictModel):
    category: str = Field(max_length=80)
    status: Literal["competitor_leads", "tied", "client_leads"]
    impact: Literal["critical", "high", "medium"]
    issue: str = Field(min_length=1)
    whyCompetitorWins: str = Field(min_length=1)


class KeywordGapItem(StrictModel):
    keyword: str = Field(min_length=1, max_length=100)
    searchIntent: Literal["commercial", "transactional", "informational", "navigational"]
    impactLevel: Literal["high", "medium", "niche"]
    whyItMatters: str = Field(min_length=1)
    clientStatus: Literal["missing", "weak", "ranking"]


class ContentInjectionRecommendation(StrictModel):
    pageSection: str = Field(max_length=80)
    recommendedKeywords: list[str] = Field(min_length=1, max_length=10)
    suggestedCopySnippet: str = Field(min_length=1)


class ActionStep(StrictModel):
    stepNumber: int = Field(ge=1, le=10)
    title: str = Field(max_length=120)
    action: str = Field(min_length=1)
    estimatedImpactTime: str = Field(max_length=60)


class CopyableMetadata(StrictModel):
    htmlMetaTags: str = Field(min_length=1)
    jsonLdSchema: str = Field(min_length=1)
    nextJsMetadata: str = Field(min_length=1)


class SeoComparisonResult(StrictModel):
    summary: str = Field(min_length=1)
    competitiveDisadvantageDiagnosis: str = Field(min_length=1)
    organicOpportunityScore: int = Field(default=80, ge=0, le=100)
    clientProfile: WebsiteSeoSummary
    competitorProfile: WebsiteSeoSummary
    gapFactors: list[SeoGapFactor] = Field(min_length=1, max_length=10)
    keywordGaps: list[KeywordGapItem] = Field(min_length=1, max_length=20)
    sharedKeywords: list[str] = Field(default_factory=list, max_length=25)
    recommendedTitle: str = Field(min_length=1, max_length=120)
    recommendedTitleRationale: str = Field(min_length=1)
    recommendedDescription: str = Field(min_length=1, max_length=320)
    recommendedDescriptionRationale: str = Field(min_length=1)
    recommendedH1: str = Field(min_length=1, max_length=150)
    recommendedH2s: list[str] = Field(min_length=1, max_length=10)
    primaryTargetKeywords: list[str] = Field(min_length=1, max_length=15)
    secondaryTargetKeywords: list[str] = Field(default_factory=list, max_length=20)
    contentInjectionPlan: list[ContentInjectionRecommendation] = Field(min_length=1, max_length=8)
    copyableMetadata: CopyableMetadata
    topActionSteps: list[ActionStep] = Field(min_length=1, max_length=8)


class WebsiteSeoInput(StrictModel):
    url: str = Field(max_length=2048)
    title: str = Field(default="", max_length=1000)
    description: str = Field(default="", max_length=2000)
    headings: list[str] = Field(default_factory=list, max_length=40)
    metaKeywords: str = Field(default="", max_length=1000)
    canonical: str | None = Field(default=None, max_length=2048)
    openGraphTitle: str | None = Field(default=None, max_length=1000)
    openGraphDescription: str | None = Field(default=None, max_length=2000)
    structuredDataTypes: list[str] = Field(default_factory=list, max_length=20)
    sampleText: str = Field(default="", max_length=8000)


class SeoComparisonInput(StrictModel):
    client: WebsiteSeoInput
    competitor: WebsiteSeoInput
    businessContext: str | None = Field(default=None, max_length=1000)
