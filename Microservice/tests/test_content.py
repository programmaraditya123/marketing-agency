import json
import httpx
import pytest
from fastapi.testclient import TestClient
from main import app
from schemas.content import ContentStrategyInput

UNKNOWN = {"value": "Unknown", "basis": "unknown", "confidence": "low", "evidenceUrls": []}
REPORT = {
    "company": {key: UNKNOWN for key in ["name", "summary", "industry", "businessModel", "locations"]},
    "products": [{"name": "AI CRM", "description": UNKNOWN, "category": "SaaS", "benefits": ["Auto replies"], "pricing": UNKNOWN}],
    "targetAudience": [{"segment": "B2B SaaS Founders", "description": UNKNOWN, "needs": ["More leads"], "painPoints": ["Slow follow ups"], "buyingTriggers": ["Lost sales"], "suggestedChannels": ["LinkedIn"]}],
    "positioning": {"valueProposition": UNKNOWN, "differentiators": [], "brandVoice": UNKNOWN},
    "contentThemes": ["Founder stories", "Sales automation tutorials"],
    "marketingOpportunities": [],
    "missingInformation": [],
    "limitations": []
}

TOKEN = "content-test-token-" + "x" * 32


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("MICROSERVICE_TOKEN", TOKEN)
    with TestClient(app) as test_client:
        yield test_client


MOCK_STRATEGY = {
    "summary": "Target high-intent B2B SaaS founders through LinkedIn thought leadership and YouTube teardowns.",
    "targetAudienceInsights": "Founders consume bite-sized actionable workflow breakdowns early morning and during commutes.",
    "platforms": [
        {
            "platform": "LinkedIn",
            "priority": "primary",
            "why": "High concentration of B2B SaaS founders and active decision-makers.",
            "postingCadence": "4 posts / week",
            "bestDays": ["Tuesday", "Wednesday", "Thursday"],
            "bestTimeWindows": ["08:00 - 10:00 AM", "12:30 - 02:00 PM"],
            "timeRationale": "Founders browse feeds before daily standups and during midday breaks.",
            "recommendedFormats": ["Carousel breakdowns", "Founder teardowns", "Text + Image"]
        },
        {
            "platform": "YouTube",
            "priority": "secondary",
            "why": "Long-shelf-life search intent for CRM and sales workflows.",
            "postingCadence": "1 video / week + 2 Shorts",
            "bestDays": ["Wednesday", "Saturday"],
            "bestTimeWindows": ["04:00 - 06:00 PM"],
            "timeRationale": "Weekend and evening deep-work learning time.",
            "recommendedFormats": ["Workflow tutorials", "SaaS automation teardowns"]
        }
    ],
    "contentPillars": [
        {
            "name": "Sales Automation Frameworks",
            "allocationPercent": 40,
            "goal": "Build deep technical and operational authority",
            "contentTypes": ["Step-by-step guides", "Slide carousels"],
            "examplePostIdeas": [
                "How to automate 80% of inbound lead triage without losing personalization",
                "The 3 lead qualification mistakes costing B2B startups 5 figures monthly"
            ]
        },
        {
            "name": "Behind-the-Scenes & Founder Lessons",
            "allocationPercent": 30,
            "goal": "Humanize the brand and foster founder connection",
            "contentTypes": ["Founder stories", "Lessons learned"],
            "examplePostIdeas": [
                "Why we built our AI CRM after losing a $20k deal to slow response times",
                "What 50 customer discovery calls taught us about sales fatigue"
            ]
        },
        {
            "name": "Customer Transformation & Social Proof",
            "allocationPercent": 30,
            "goal": "Provide high-trust conversion evidence",
            "contentTypes": ["Case studies", "Before-and-after screenshots"],
            "examplePostIdeas": [
                "How a 5-person agency closed 2.4x more deals with automated triage"
            ]
        }
    ],
    "weeklySchedule": [
        {
            "day": "Monday",
            "platform": "LinkedIn",
            "timeSlot": "08:30 AM",
            "pillar": "Sales Automation Frameworks",
            "contentType": "Carousel Infographic",
            "topic": "5 automated sales plays for 2026",
            "hook": "Most B2B founders spend 12 hours a week manually answering CRM leads.",
            "callToAction": "Save this carousel for your Monday pipeline review."
        },
        {
            "day": "Wednesday",
            "platform": "LinkedIn",
            "timeSlot": "12:30 PM",
            "pillar": "Behind-the-Scenes & Founder Lessons",
            "contentType": "Founder Story Post",
            "topic": "The exact message template that salvaged an at-risk deal",
            "hook": "We almost lost our biggest enterprise lead because of an email typo.",
            "callToAction": "Drop a comment below with your favorite CRM follow-up rule."
        },
        {
            "day": "Friday",
            "platform": "YouTube",
            "timeSlot": "04:00 PM",
            "pillar": "Customer Transformation & Social Proof",
            "contentType": "Video Breakdown",
            "topic": "From 4-hour response time to 90 seconds: Agency case study",
            "hook": "Watch us rebuild an entire sales pipeline in 15 minutes.",
            "callToAction": "Link to the full blueprint in the video description."
        }
    ],
    "growthTips": [
        "Engage on 5 key industry influencer posts 15 minutes prior to publishing your own.",
        "Repurpose carousel slides into a 60-second video walkthrough for YouTube Shorts.",
        "Include a direct conversational question at the end of every post to drive algorithm comment velocity."
    ]
}


def install_content_provider(client):
    async def provider(request):
        body = json.loads(request.content)
        context = json.loads(body["contents"][0]["parts"][0]["text"])
        assert context["business"]["products"][0]["name"] == "AI CRM"
        assert "SOCIAL MEDIA PLATFORMS" in body["systemInstruction"]["parts"][0]["text"]
        return httpx.Response(
            200,
            json={"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": json.dumps(MOCK_STRATEGY)}]}}]}
        )

    original = app.state.http_client
    app.state.http_client = httpx.AsyncClient(transport=httpx.MockTransport(provider))
    return original


def test_content_strategy_requires_auth(client):
    response = client.post(
        "/api/v1/content/strategy",
        headers={},
        json={"website": "https://example.com", "business": REPORT}
    )
    assert response.status_code == 401


def test_content_strategy_success(client):
    original = install_content_provider(client)
    try:
        response = client.post(
            "/api/v1/content/strategy",
            headers={"X-Service-Token": TOKEN},
            json={
                "website": "https://example.com",
                "business": REPORT,
                "focusGoal": "lead_generation",
                "socialLinks": [{"platform": "LinkedIn", "url": "https://linkedin.com/company/example"}]
            }
        )
        assert response.status_code == 200, response.text
        data = response.json()
        assert "LinkedIn" in [p["platform"] for p in data["platforms"]]
        assert len(data["contentPillars"]) == 3
        assert sum(p["allocationPercent"] for p in data["contentPillars"]) == 100
        assert len(data["weeklySchedule"]) == 3
        assert len(data["growthTips"]) == 3
    finally:
        client.portal.call(app.state.http_client.aclose)
        app.state.http_client = original
