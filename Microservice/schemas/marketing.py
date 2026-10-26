from decimal import Decimal
from typing import Literal
from pydantic import Field
from schemas.analysis import Analysis, StrictModel
from schemas.market import TrendData


class MarketingBudget(StrictModel):
    currency: Literal["INR", "USD", "EUR", "GBP", "AUD", "CAD", "SGD", "AED"]
    dailyBudget: Decimal = Field(ge=0, le=100000000, decimal_places=2)
    monthlyBudget: Decimal = Field(ge=0, le=1000000000, decimal_places=2)


class MarketingContext(StrictModel):
    website: str = Field(max_length=2048)
    business: Analysis
    budget: MarketingBudget
    trends: TrendData | None = None


class Channel(StrictModel):
    name: str = Field(min_length=1, max_length=100)
    approach: Literal["paid", "organic", "owned"]
    allocationPercent: int = Field(ge=0, le=100)
    why: str = Field(min_length=1)
    when: str = Field(min_length=1)
    firstSteps: list[str] = Field(min_length=1, max_length=5)
    successMetric: str = Field(min_length=1)
    scaleOrStop: str = Field(min_length=1)


class ChannelRecommendations(StrictModel):
    summary: str = Field(min_length=1)
    channels: list[Channel] = Field(min_length=1, max_length=5)
    assumptions: list[str] = Field(min_length=1, max_length=6)


class AllocatedChannel(Channel):
    dailyAllocation: float
    monthlyAllocation: float


class MarketingPlan(StrictModel):
    summary: str
    channels: list[AllocatedChannel]
    assumptions: list[str]
    currency: str
    effectiveDailyBudget: float
    effectiveMonthlyBudget: float
    unallocatedDaily: float
    unallocatedMonthly: float
    planningDays: Literal[30] = 30
