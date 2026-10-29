from typing import Any
from urllib.parse import urlparse


def sanitize_url(url_val: Any) -> str | None:
    if not isinstance(url_val, str):
        return None
    val = url_val.strip()
    if not val or val.lower() in ("none", "n/a", "null", "undefined", "about:blank"):
        return None
    if not (val.startswith("http://") or val.startswith("https://")):
        val = f"https://{val}"
    return val


def filter_urls(urls: list[Any], allowed: set[str] | None) -> list[str]:
    clean = [u for u in (sanitize_url(x) for x in urls) if u]
    if not allowed:
        return clean[:8]
    allowed_norm = {s.rstrip("/").lower(): s for s in allowed}
    allowed_domains = {urlparse(s).netloc.lower(): s for s in allowed}
    matched: list[str] = []
    for u in clean:
        u_norm = u.split("#")[0].rstrip("/").lower()
        if u in allowed:
            matched.append(u)
        elif u_norm in allowed_norm:
            matched.append(allowed_norm[u_norm])
        else:
            u_domain = urlparse(u).netloc.lower()
            if u_domain in allowed_domains:
                matched.append(allowed_domains[u_domain])
            else:
                matched.append(u)
    return matched[:8]


def extract_allowed_sources(payload: Any) -> set[str] | None:
    pages = getattr(payload, "pages", None)
    if isinstance(pages, list):
        return {str(getattr(p, "url", p.get("url") if isinstance(p, dict) else "")) for p in pages if p}
    return None


def is_finding(cls: Any) -> bool:
    fields = getattr(cls, "model_fields", None)
    return bool(fields and "basis" in fields and "confidence" in fields and "value" in fields)


def get_max_length(field_info: Any) -> int | None:
    ml = getattr(field_info, "max_length", None)
    if ml is not None:
        return ml
    for m in getattr(field_info, "metadata", []):
        val = getattr(m, "max_length", None)
        if val is not None:
            return val
    return None
