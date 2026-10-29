import json
import re
from typing import Any, get_args, get_origin
from pydantic import HttpUrl

from model.krutrim_urls import extract_allowed_sources, filter_urls, get_max_length, is_finding, sanitize_url


def extract_json_payload(raw_text: str) -> Any:
    cleaned = re.sub(r"<(think|thought)>[\s\S]*?</\1>", "", raw_text.strip()).strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except Exception:
            pass
    try:
        return json.loads(cleaned)
    except Exception:
        pass
    fb, lb = cleaned.find("{"), cleaned.rfind("}")
    if fb != -1 and lb > fb:
        try:
            return json.loads(cleaned[fb : lb + 1])
        except Exception:
            pass
    fbr, lbr = cleaned.find("["), cleaned.rfind("]")
    if fbr != -1 and lbr > fbr:
        try:
            return json.loads(cleaned[fbr : lbr + 1])
        except Exception:
            pass
    return json.loads(cleaned)


def _sanitize_finding_dict(data: dict, allowed: set[str] | None = None) -> dict:
    res = dict(data) if isinstance(data, dict) else {}
    val = res.get("value")
    if val is None or not str(val).strip():
        for alt in ("text", "description", "summary", "name", "finding"):
            if res.get(alt):
                val = str(res[alt])
                break
    res["value"] = str(val or "Unknown")[:4000]
    basis = str(res.get("basis", "inferred")).lower().strip()
    res["basis"] = basis if basis in ("observed", "inferred", "unknown") else "inferred"
    conf = str(res.get("confidence", "medium")).lower().strip()
    res["confidence"] = conf if conf in ("high", "medium", "low") else "medium"

    if res["basis"] == "unknown" or res["value"] == "Unknown":
        res.update({"value": "Unknown", "basis": "unknown", "confidence": "low", "evidenceUrls": []})
    else:
        urls = filter_urls(res.get("evidenceUrls") or [], allowed)
        res["evidenceUrls"] = urls
        if res["basis"] == "observed" and not res["evidenceUrls"]:
            res["basis"] = "inferred"

    return {k: res.get(k) for k in ("value", "basis", "confidence", "evidenceUrls")}


def sanitize_payload(data: Any, model_cls: type, allowed_sources: set[str] | None = None) -> Any:
    if not isinstance(data, dict) or not hasattr(model_cls, "model_fields"):
        return data
    if not data and model_cls.__name__ == "Analysis":
        return data

    cleaned: dict[str, Any] = {}
    for key, field_info in model_cls.model_fields.items():
        ann = field_info.annotation
        origin, args = get_origin(ann), get_args(ann)
        if key not in data or data[key] is None:
            if model_cls.__name__ == "Analysis":
                continue
            if is_finding(ann):
                cleaned[key] = {"value": "Unknown", "basis": "unknown", "confidence": "low", "evidenceUrls": []}
            elif origin is list:
                cleaned[key] = []
            elif hasattr(ann, "model_fields"):
                cleaned[key] = sanitize_payload({}, ann, allowed_sources)
            elif ann is str:
                cleaned[key] = ""
            elif str(origin) == "typing.Literal" and args:
                cleaned[key] = args[0]
            continue

        val = data[key]
        if is_finding(ann):
            val = {"value": str(val)[:4000], "basis": "inferred", "confidence": "medium", "evidenceUrls": []} if isinstance(val, str) else _sanitize_finding_dict(val, allowed_sources)
        elif hasattr(ann, "model_fields") and isinstance(val, dict):
            val = sanitize_payload(val, ann, allowed_sources)
        elif origin is list:
            if not isinstance(val, list):
                cleaned[key] = val
                continue
            elem, max_len = args[0] if args else None, get_max_length(field_info)
            if is_finding(elem):
                val = [_sanitize_finding_dict(i, allowed_sources) if isinstance(i, dict) else {"value": str(i)[:4000], "basis": "inferred", "confidence": "medium", "evidenceUrls": []} for i in val]
            elif hasattr(elem, "model_fields"):
                val = [sanitize_payload(i, elem, allowed_sources) for i in val if isinstance(i, dict)]
            elif elem is HttpUrl:
                val = filter_urls(val, allowed_sources)
            elif elem is str:
                val = [str(i)[:4000] for i in val if i is not None]
            if max_len is not None:
                val = val[:max_len]
        elif ann is HttpUrl and isinstance(val, str):
            val = sanitize_url(val) or val
        elif ann is str and isinstance(val, str):
            val = val[:4000]
        elif str(origin) == "typing.Literal" and isinstance(val, str):
            val_lower = val.lower().strip()
            val = next((opt for opt in args if str(opt).lower() == val_lower), val)
        cleaned[key] = val

    return cleaned
