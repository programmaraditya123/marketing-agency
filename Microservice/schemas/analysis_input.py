from typing import Any

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class ScrapedPage(BaseModel):
    model_config = ConfigDict(extra="forbid", str_max_length=16000)
    url: HttpUrl
    title: str = Field(max_length=500)
    description: str = Field(max_length=1500)
    headings: list[str] = Field(max_length=40)
    mainText: str = Field(max_length=14000)
    structuredData: list[Any] = Field(max_length=10)
    scrapedAt: str = Field(max_length=50)


class SocialLink(BaseModel):
    model_config = ConfigDict(extra="forbid")
    platform: str = Field(max_length=50)
    url: HttpUrl
    discoveredOn: HttpUrl


class AnalysisInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    startUrl: HttpUrl
    pages: list[ScrapedPage] = Field(min_length=1, max_length=8)
    socialLinks: list[SocialLink] = Field(max_length=40)
    warnings: list[str] = Field(max_length=30)
