from pydantic import ValidationError
import pytest

from model.gemini_schema import VALIDATION_ONLY, generation_schema
from schemas.analysis import Analysis, Finding


def test_generation_schema_keeps_fields_but_omits_decoder_expensive_constraints():
    schema = generation_schema()

    def inspect(node):
        if not isinstance(node, dict):
            return
        assert not (set(node) & VALIDATION_ONLY)
        assert set(node.get("required", [])) <= set(node.get("properties", {}))
        for key, value in node.items():
            if key in {"properties", "$defs"}:
                for child in value.values():
                    inspect(child)
            elif isinstance(value, dict):
                inspect(value)
    inspect(schema)
    assert "title" in schema["$defs"]["Opportunity"]["properties"]
    assert "enum" in schema["$defs"]["Finding"]["properties"]["basis"]
    assert "maxItems" in Analysis.model_json_schema()["properties"]["products"]


def test_strict_post_generation_url_and_length_validation_remains():
    with pytest.raises(ValidationError):
        Finding(value="Acme", basis="observed", confidence="high", evidenceUrls=["javascript:alert(1)"])
    with pytest.raises(ValidationError):
        Finding(value="x" * 4001, basis="unknown", confidence="low", evidenceUrls=[])
