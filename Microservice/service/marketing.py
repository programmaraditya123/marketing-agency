import httpx
from config.settings import Settings
from model.gemini_model import generate_structured
from prompts.marketing import MARKETING_PROMPT
from schemas.marketing import MarketingContext, ChannelRecommendations, MarketingPlan, AllocatedChannel
from utils.exceptions import AnalysisError


async def recommend_channels(payload: MarketingContext, client: httpx.AsyncClient, settings: Settings) -> MarketingPlan:
    recommendations = await generate_structured(payload, ChannelRecommendations, MARKETING_PROMPT, client, settings)
    daily = int(payload.budget.dailyBudget * 100)
    monthly = min(int(payload.budget.monthlyBudget * 100), daily * 30)
    effective_daily = monthly // 30
    weights = [channel.allocationPercent for channel in recommendations.channels]
    if sum(weights) > 100 or (monthly == 0 and (any(weights) or any(channel.approach == "paid" for channel in recommendations.channels))):
        raise AnalysisError("Gemini returned an invalid budget split. Please retry.", 502, "INVALID_MARKETING_BUDGET")
    if len({channel.name.strip().casefold() for channel in recommendations.channels}) != len(weights):
        raise AnalysisError("Gemini returned duplicate channels. Please retry.", 502, "INVALID_MARKETING_CHANNELS")
    channels = [AllocatedChannel(**channel.model_dump(), dailyAllocation=(effective_daily * channel.allocationPercent // 100) / 100,
                                 monthlyAllocation=(monthly * channel.allocationPercent // 100) / 100)
                for channel in recommendations.channels]
    used_daily = sum(effective_daily * weight // 100 for weight in weights)
    used_monthly = sum(monthly * weight // 100 for weight in weights)
    return MarketingPlan(summary=recommendations.summary, channels=channels, assumptions=recommendations.assumptions,
                         currency=payload.budget.currency, effectiveDailyBudget=effective_daily / 100,
                         effectiveMonthlyBudget=monthly / 100, unallocatedDaily=(effective_daily - used_daily) / 100,
                         unallocatedMonthly=(monthly - used_monthly) / 100)
