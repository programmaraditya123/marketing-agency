from pydantic import Field, HttpUrl, field_validator
from schemas.analysis import Analysis, StrictModel


class CompetitorContext(StrictModel):
    startUrl: HttpUrl
    analysis: Analysis


class CompetitorSuggestion(StrictModel):
    name: str = Field(min_length=1, max_length=150)
    website: HttpUrl
    description: str = Field(min_length=10, max_length=600)

    @field_validator("website")
    @classmethod
    def official_website(cls, value: HttpUrl) -> HttpUrl:
        if value.username or value.password or value.port not in (None, 80, 443):
            raise ValueError("Use a public company website without credentials or custom ports")
        return value


class CompetitorSuggestions(StrictModel):
    competitors: list[CompetitorSuggestion] = Field(min_length=1, max_length=10)
