from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_max_length=4000)


class Finding(StrictModel):
    value: str
    basis: Literal["observed", "inferred", "unknown"]
    confidence: Literal["high", "medium", "low"]
    evidenceUrls: list[HttpUrl] = Field(max_length=8)


class Company(StrictModel):
    name: Finding
    summary: Finding
    industry: Finding
    businessModel: Finding
    locations: Finding


class Product(StrictModel):
    name: str
    description: Finding
    category: str
    benefits: list[str] = Field(max_length=10)
    pricing: Finding


class Audience(StrictModel):
    segment: str
    description: Finding
    needs: list[str] = Field(max_length=10)
    painPoints: list[str] = Field(max_length=10)
    buyingTriggers: list[str] = Field(max_length=10)
    suggestedChannels: list[str] = Field(max_length=10)


class Positioning(StrictModel):
    valueProposition: Finding
    differentiators: list[Finding] = Field(max_length=10)
    brandVoice: Finding


class Opportunity(StrictModel):
    title: str
    rationale: str
    priority: Literal["high", "medium", "low"]
    suggestedAction: str
    evidenceUrls: list[HttpUrl] = Field(max_length=8)


class Analysis(StrictModel):
    company: Company
    products: list[Product] = Field(max_length=15)
    targetAudience: list[Audience] = Field(max_length=8)
    positioning: Positioning
    contentThemes: list[str] = Field(max_length=12)
    marketingOpportunities: list[Opportunity] = Field(max_length=10)
    missingInformation: list[str] = Field(max_length=20)
    limitations: list[str] = Field(max_length=15)
