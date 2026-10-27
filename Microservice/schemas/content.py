from typing import Literal
from pydantic import Field
from schemas.analysis import Analysis, StrictModel


class SocialPlatformRecommendation(StrictModel):
    platform: str = Field(min_length=1, max_length=50)
    priority: Literal["primary", "secondary", "experimental"]
    why: str = Field(min_length=1)
    postingCadence: str = Field(min_length=1)
    bestDays: list[str] = Field(min_length=1, max_length=7)
    bestTimeWindows: list[str] = Field(min_length=1, max_length=5)
    timeRationale: str = Field(min_length=1)
    recommendedFormats: list[str] = Field(min_length=1, max_length=8)


class ContentPillar(StrictModel):
    name: str = Field(min_length=1, max_length=100)
    allocationPercent: int = Field(ge=0, le=100)
    goal: str = Field(min_length=1)
    contentTypes: list[str] = Field(min_length=1, max_length=8)
    examplePostIdeas: list[str] = Field(min_length=1, max_length=6)


class SchedulePost(StrictModel):
    day: str = Field(min_length=1, max_length=20)
    platform: str = Field(min_length=1, max_length=50)
    timeSlot: str = Field(min_length=1, max_length=30)
    pillar: str = Field(min_length=1, max_length=100)
    contentType: str = Field(min_length=1, max_length=80)
    topic: str = Field(min_length=1)
    hook: str = Field(min_length=1)
    callToAction: str = Field(min_length=1)


class ContentStrategy(StrictModel):
    summary: str = Field(min_length=1)
    targetAudienceInsights: str = Field(min_length=1)
    platforms: list[SocialPlatformRecommendation] = Field(min_length=1, max_length=6)
    contentPillars: list[ContentPillar] = Field(min_length=1, max_length=6)
    weeklySchedule: list[SchedulePost] = Field(min_length=1, max_length=14)
    growthTips: list[str] = Field(min_length=1, max_length=8)


class SocialLinkItem(StrictModel):
    platform: str
    url: str
    discoveredOn: str | None = None


class ContentStrategyInput(StrictModel):
    website: str = Field(max_length=2048)
    business: Analysis
    focusGoal: str | None = Field(default=None, max_length=100)
    socialLinks: list[SocialLinkItem] | None = None
