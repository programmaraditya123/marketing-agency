from typing import Literal
from pydantic import Field, field_validator
from schemas.analysis import StrictModel
from schemas.analysis import Analysis


class TrendInput(StrictModel):
    terms: list[str] = Field(min_length=1, max_length=5)
    geo: str = Field(default="", pattern=r"^([A-Z]{2})?$")
    timeframe: Literal["today 12-m", "today 3-m", "today 5-y"] = "today 12-m"

    @field_validator("terms")
    @classmethod
    def clean_terms(cls, terms):
        cleaned = list(dict.fromkeys(term.strip() for term in terms))
        if any(not term or len(term) > 80 for term in cleaned):
            raise ValueError("Use 1 to 80 characters per term")
        return cleaned


class TrendPoint(StrictModel):
    date: str
    values: dict[str, int]


class TrendMetric(StrictModel):
    term: str
    earlierMean: float
    recentMean: float
    changePercent: float | None
    peakDate: str
    nonZeroPeriods: int


class TrendData(StrictModel):
    source: Literal["Google Trends via pytrends"] = "Google Trends via pytrends"
    collectedAt: str
    config: TrendInput
    timeline: list[TrendPoint] = Field(max_length=400)
    regions: list[dict[str, str | int]] = Field(max_length=20)
    related: dict[str, list[str]]
    warnings: list[str]
    metrics: list[TrendMetric] = Field(max_length=5)


class MarketContext(StrictModel):
    website: str = Field(max_length=2048)
    data: TrendData
    business: Analysis | None = None


class DemandAnalysis(StrictModel):
    summary: str
    momentum: str
    seasonality: str
    regionalInterest: str
    opportunities: list[str] = Field(max_length=6)
    nextSteps: list[str] = Field(max_length=6)
    limitations: list[str] = Field(min_length=1, max_length=6)
