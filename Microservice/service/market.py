from datetime import datetime, timezone
from threading import BoundedSemaphore
from schemas.market import TrendInput, TrendData
from utils.exceptions import AnalysisError

_capacity = BoundedSemaphore(1)


def collect_trends(config: TrendInput, factory=None) -> TrendData:
    if not _capacity.acquire(blocking=False):
        raise AnalysisError("Trends collection is busy. Retry later.", 429, "TRENDS_BUSY")
    try:
        if factory is None:
            from pytrends.request import TrendReq
            factory = TrendReq
        trends = factory(hl="en-US", tz=0, timeout=(5, 15), retries=0)
        trends.build_payload(config.terms, timeframe=config.timeframe, geo=config.geo)
        frame = trends.interest_over_time()
        if frame.empty:
            raise AnalysisError("No Google Trends data for these terms. Try broader product categories.", 422, "TRENDS_EMPTY")
        timeline = []
        for date, row in frame.tail(400).iterrows():
            if bool(row.get("isPartial", False)):
                continue
            timeline.append({"date": date.isoformat(), "values": {term: int(row[term]) for term in config.terms}})
        if not timeline:
            raise AnalysisError("No complete Google Trends periods available.", 422, "TRENDS_EMPTY")
        metrics = []
        half = len(timeline) // 2
        for term in config.terms:
            values = [point["values"][term] for point in timeline]
            earlier = sum(values[:half]) / half if half else 0
            recent = sum(values[-half:]) / half if half else values[-1]
            metrics.append({"term": term, "earlierMean": round(earlier, 2), "recentMean": round(recent, 2),
                            "changePercent": round((recent - earlier) / earlier * 100, 1) if earlier else None,
                            "peakDate": timeline[values.index(max(values))]["date"], "nonZeroPeriods": sum(value > 0 for value in values)})
        warnings = ["Relative search interest (0-100), not absolute search volume, sales, or market size. Zero can mean insufficient data.",
                    "Change compares recent and earlier halves of complete periods in one dataset; it is not a forecast or year-over-year growth."]
        regions, related = [], {}
        try:
            regional = trends.interest_by_region(resolution="COUNTRY", inc_low_vol=True)
            if not regional.empty:
                regional = regional.assign(_total=regional[config.terms].sum(axis=1)).sort_values("_total", ascending=False).head(20)
                regions = [{"region": str(name), **{term: int(row[term]) for term in config.terms}} for name, row in regional.iterrows()]
        except Exception:
            warnings.append("Regional data unavailable for this collection.")
        try:
            queries = trends.related_queries()
            for term in config.terms:
                top = queries.get(term, {}).get("top")
                related[term] = [] if top is None else [str(item)[:200] for item in top["query"].head(10)]
        except Exception:
            warnings.append("Related query data unavailable for this collection.")
        return TrendData(collectedAt=datetime.now(timezone.utc).isoformat(), config=config, timeline=timeline, regions=regions, related=related, warnings=warnings, metrics=metrics)
    except AnalysisError:
        raise
    except Exception as error:
        raise AnalysisError("Google Trends is unavailable or rate limited. Please retry later.", 502, "TRENDS_UNAVAILABLE") from error
    finally:
        _capacity.release()
