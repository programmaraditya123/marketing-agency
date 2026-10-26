from typing import Any

from schemas.analysis import Analysis

# These limits still apply in Pydantic AFTER generation. Combining many bounded
# arrays and URI matchers makes Gemini's constrained decoder exceed its state limit.
VALIDATION_ONLY = {"title", "format", "minLength", "maxLength", "minItems", "maxItems"}


def generation_schema() -> dict[str, Any]:
    def simplify(value: Any) -> Any:
        if isinstance(value, dict):
            return {key: ({name: simplify(schema) for name, schema in item.items()}
                          if key in {"properties", "$defs"} else simplify(item))
                    for key, item in value.items() if key not in VALIDATION_ONLY}
        if isinstance(value, list):
            return [simplify(item) for item in value]
        return value

    return simplify(Analysis.model_json_schema())
