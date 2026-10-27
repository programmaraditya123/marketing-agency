import json
import re
from typing import Any, get_args, get_origin
from pydantic import HttpUrl


def extract_json_payload(raw_text: str) -> Any:
    cleaned = raw_text.strip()
    cleaned = re.sub(r"<(think|thought)>[\s\S]*?</\1>", "", cleaned).strip()

    code_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if code_match:
        try:
            return json.loads(code_match.group(1).strip())
        except Exception:
            pass

    try:
        return json.loads(cleaned)
    except Exception:
        pass

    first_brace, last_brace = cleaned.find("{"), cleaned.rfind("}")
    if first_brace != -1 and last_brace > first_brace:
        try:
            return json.loads(cleaned[first_brace : last_brace + 1])
        except Exception:
            pass

    first_bracket, last_bracket = cleaned.find("["), cleaned.rfind("]")
    if first_bracket != -1 and last_bracket > first_bracket:
        try:
            return json.loads(cleaned[first_bracket : last_bracket + 1])
        except Exception:
            pass

    return json.loads(cleaned)


def _sanitize_url(url_val: Any) -> str | None:
    if not isinstance(url_val, str):
        return None
    val = url_val.strip()
    if not val or val.lower() in ("none", "n/a", "null", "undefined", "about:blank"):
        return None
    if not (val.startswith("http://") or val.startswith("https://")):
        val = f"https://{val}"
    return val


def _filter_urls(urls: list[Any], allowed: set[str] | None) -> list[str]:
    clean = [u for u in (_sanitize_url(x) for x in urls) if u]
    if not allowed:
        return clean[:8]
    matched = [next((s for s in allowed if s.rstrip("/") == u.rstrip("/")), None) for u in clean]
    return [m for m in matched if m][:8]


def _is_finding(cls: Any) -> bool:
    fields = getattr(cls, "model_fields", None)
    return bool(fields and "basis" in fields and "confidence" in fields and "value" in fields)


def _sanitize_finding_dict(data: dict, allowed: set[str] | None = None) -> dict:
    res = dict(data)
    basis = str(res.get("basis", "inferred")).lower().strip()
    res["basis"] = basis if basis in ("observed", "inferred", "unknown") else "inferred"
    conf = str(res.get("confidence", "medium")).lower().strip()
    res["confidence"] = conf if conf in ("high", "medium", "low") else "medium"

    if res["basis"] == "unknown":
        res.update({"value": "Unknown", "confidence": "low", "evidenceUrls": []})
    else:
        urls = _filter_urls(res.get("evidenceUrls") or [], allowed)
        res["evidenceUrls"] = urls
        if res["basis"] == "observed" and not res["evidenceUrls"]:
            res["basis"] = "inferred"

    return {k: res.get(k) for k in ("value", "basis", "confidence", "evidenceUrls") if k in res}


def sanitize_payload(data: Any, model_cls: type, allowed_sources: set[str] | None = None) -> Any:
    if not isinstance(data, dict) or not hasattr(model_cls, "model_fields"):
        return data

    cleaned: dict[str, Any] = {}
    for key, field_info in model_cls.model_fields.items():
        if key not in data:
            continue
        val = data[key]
        ann = field_info.annotation
        origin, args = get_origin(ann), get_args(ann)

        if _is_finding(ann):
            val = {"value": str(val), "basis": "inferred", "confidence": "medium", "evidenceUrls": []} if isinstance(val, str) else _sanitize_finding_dict(val, allowed_sources)
        elif hasattr(ann, "model_fields") and isinstance(val, dict):
            val = sanitize_payload(val, ann, allowed_sources)
        elif origin is list and isinstance(val, list):
            elem = args[0] if args else None
            if _is_finding(elem):
                val = [_sanitize_finding_dict(i, allowed_sources) if isinstance(i, dict) else {"value": str(i), "basis": "inferred", "confidence": "medium", "evidenceUrls": []} for i in val]
            elif hasattr(elem, "model_fields"):
                val = [sanitize_payload(i, elem, allowed_sources) for i in val if isinstance(i, dict)]
            elif elem is HttpUrl:
                val = _filter_urls(val, allowed_sources)
            elif elem is str:
                val = [str(i) for i in val if i is not None]
        elif ann is HttpUrl and isinstance(val, str):
            val = _sanitize_url(val) or val
        elif str(origin) == "typing.Literal" and isinstance(val, str):
            val_lower = val.lower().strip()
            val = next((opt for opt in args if str(opt).lower() == val_lower), val)

        cleaned[key] = val

    return cleaned
