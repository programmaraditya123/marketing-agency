import json
import httpx
import pytest
from fastapi.testclient import TestClient
from main import app
from config.settings import Settings
from schemas.seo import SeoComparisonInput

TOKEN = "seo-test-token-" + "x" * 32


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("MICROSERVICE_TOKEN", TOKEN)
    monkeypatch.setenv("KRUTRIM_API_KEY", "")
    with TestClient(app) as test_client:
        yield test_client


MOCK_SEO_RESULT = {
    "summary": "The competitor leads in high-intent commercial keywords and rich snippet schema markup.",
    "competitiveDisadvantageDiagnosis": "Your site uses generic marketing buzzwords in your Title and H1, whereas the competitor explicitly targets high-volume search terms like 'AI CRM Software' and maintains structured FAQPage schema.",
    "organicOpportunityScore": 88,
    "clientProfile": {
        "url": "https://client.com",
        "title": "Welcome to Our Platform | Modern Solutions",
        "titleLength": 42,
        "titleEvaluation": "Vague branding, missing core commercial keywords.",
        "description": "We make teams work faster with modern smart software.",
        "descriptionLength": 53,
        "descriptionEvaluation": "Under the recommended 150-160 characters; lacks clear CTA.",
        "h1Tags": ["Work Smarter Today"],
        "h2Tags": ["Features", "Pricing", "About Us"],
        "canonical": "https://client.com",
        "openGraphTitle": "Welcome to Our Platform",
        "openGraphDescription": "Smart software for teams",
        "schemaTypes": ["Organization"],
        "detectedKeywords": ["modern solutions", "smart software", "work faster"],
        "overallSeoHealthScore": 54,
    },
    "competitorProfile": {
        "url": "https://competitor.com",
        "title": "Best AI CRM Software for B2B Sales Teams | Competitor",
        "titleLength": 54,
        "titleEvaluation": "Optimized length, primary keyword front-loaded, strong click intent.",
        "description": "Close deals 3x faster with Competitor AI CRM. Automated lead scoring, email sequences, and pipeline tracking. Start free 14-day trial.",
        "descriptionLength": 146,
        "descriptionEvaluation": "High CTR appeal, benefit-driven, includes primary keyword and clear trial CTA.",
        "h1Tags": ["The #1 AI CRM for Fast-Growing Sales Teams"],
        "h2Tags": ["Automate Outbound Sequences", "Predictive Pipeline Forecasting", "Compare CRM Plans"],
        "canonical": "https://competitor.com",
        "openGraphTitle": "Competitor AI CRM",
        "openGraphDescription": "Close deals 3x faster with Competitor AI CRM.",
        "schemaTypes": ["Organization", "Product", "FAQPage"],
        "detectedKeywords": ["AI CRM Software", "B2B sales teams", "lead scoring", "pipeline tracking"],
        "overallSeoHealthScore": 92,
    },
    "gapFactors": [
        {
            "category": "Title Tag & Click Intent",
            "status": "competitor_leads",
            "impact": "critical",
            "issue": "Client title is missing target product category keyword.",
            "whyCompetitorWins": "Competitor front-loads 'Best AI CRM Software' which captures high-intent organic search volume.",
        },
        {
            "category": "Structured Schema & Technical",
            "status": "competitor_leads",
            "impact": "high",
            "issue": "Client lacks Product and FAQPage schema for rich search results.",
            "whyCompetitorWins": "Competitor achieves enhanced search SERP real estate via FAQ rich snippets.",
        },
    ],
    "keywordGaps": [
        {
            "keyword": "AI CRM Software",
            "searchIntent": "commercial",
            "impactLevel": "high",
            "whyItMatters": "Drives buyers actively evaluating CRM tools.",
            "clientStatus": "missing",
        },
        {
            "keyword": "automated lead scoring",
            "searchIntent": "transactional",
            "impactLevel": "high",
            "whyItMatters": "High-intent feature keyword with high conversion rates.",
            "clientStatus": "missing",
        },
    ],
    "sharedKeywords": ["CRM", "sales platform"],
    "recommendedTitle": "AI CRM Software for Sales Teams | Client Brand",
    "recommendedTitleRationale": "Front-loads the highest-intent commercial keyword while retaining brand identity in 52 characters.",
    "recommendedDescription": "Accelerate sales pipeline and automate lead tracking with Client AI CRM. Built for high-velocity teams. Start your free trial today.",
    "recommendedDescriptionRationale": "Exact 155 character length with primary keyword, benefits, and urgent CTA.",
    "recommendedH1": "AI-Powered CRM Software That Closes Deals On Autopilot",
    "recommendedH2s": [
        "Automated Lead Scoring & Pipeline Management",
        "Intelligent Email Follow-Ups That Convert",
        "How Client AI CRM Compares to Traditional CRMs",
    ],
    "primaryTargetKeywords": ["AI CRM Software", "automated lead scoring", "sales pipeline CRM"],
    "secondaryTargetKeywords": ["smart sales automation", "lead tracking software"],
    "contentInjectionPlan": [
        {
            "pageSection": "Hero Header & H1",
            "recommendedKeywords": ["AI CRM Software", "sales pipeline"],
            "suggestedCopySnippet": "Supercharge your pipeline with the leading AI CRM software designed to automate sales outreach.",
        }
    ],
    "copyableMetadata": {
        "htmlMetaTags": "<title>AI CRM Software for Sales Teams | Client Brand</title>\n<meta name=\"description\" content=\"Accelerate sales pipeline...\">",
        "jsonLdSchema": "<script type=\"application/ld+json\">{\"@context\":\"https://schema.org\",\"@type\":\"SoftwareApplication\"}</script>",
        "nextJsMetadata": "export const metadata: Metadata = {\n  title: 'AI CRM Software for Sales Teams | Client Brand',\n  description: 'Accelerate sales pipeline...'\n};",
    },
    "topActionSteps": [
        {
            "stepNumber": 1,
            "title": "Update Homepage Title Tag & Meta Description",
            "action": "Deploy the recommended title tag and meta description to capture immediate click-through uplift.",
            "estimatedImpactTime": "1-2 weeks",
        },
        {
            "stepNumber": 2,
            "title": "Inject Keyword-Rich H2 Subheadings",
            "action": "Restructure page sections to explicitly target 'automated lead scoring' and 'sales pipeline CRM'.",
            "estimatedImpactTime": "2-3 weeks",
        },
    ],
}

SAMPLE_PAYLOAD = {
    "client": {
        "url": "https://client.com",
        "title": "Welcome to Our Platform | Modern Solutions",
        "description": "We make teams work faster with modern smart software.",
        "headings": ["Work Smarter Today", "Features", "Pricing"],
        "metaKeywords": "software, tools",
        "canonical": "https://client.com",
        "openGraphTitle": "Welcome to Our Platform",
        "openGraphDescription": "Smart software for teams",
        "structuredDataTypes": ["Organization"],
        "sampleText": "We provide smart software solutions for businesses to streamline operations and get more done.",
    },
    "competitor": {
        "url": "https://competitor.com",
        "title": "Best AI CRM Software for B2B Sales Teams | Competitor",
        "description": "Close deals 3x faster with Competitor AI CRM. Automated lead scoring, email sequences, and pipeline tracking.",
        "headings": ["The #1 AI CRM for Fast-Growing Sales Teams", "Automate Outbound Sequences"],
        "metaKeywords": "AI CRM, sales software",
        "canonical": "https://competitor.com",
        "openGraphTitle": "Competitor AI CRM",
        "openGraphDescription": "Close deals 3x faster with Competitor AI CRM.",
        "structuredDataTypes": ["Organization", "Product", "FAQPage"],
        "sampleText": "Competitor AI CRM automates your sales outreach and lead qualification.",
    },
    "businessContext": "B2B SaaS CRM industry targeting sales directors and founders.",
}


def test_seo_compare_requires_auth(client):
    res = client.post("/api/v1/seo/compare", json=SAMPLE_PAYLOAD)
    assert res.status_code == 401


def test_seo_compare_gemini_success(client):
    async def fake_provider(request):
        return httpx.Response(
            200,
            json={
                "candidates": [
                    {
                        "finishReason": "STOP",
                        "content": {
                            "parts": [
                                {
                                    "text": json.dumps(MOCK_SEO_RESULT)
                                }
                            ]
                        },
                    }
                ]
            },
        )

    original = app.state.http_client
    app.state.http_client = httpx.AsyncClient(transport=httpx.MockTransport(fake_provider))
    try:
        headers = {"X-Service-Token": TOKEN}
        res = client.post("/api/v1/seo/compare", json=SAMPLE_PAYLOAD, headers=headers)
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["summary"] == MOCK_SEO_RESULT["summary"]
        assert data["organicOpportunityScore"] == 88
        assert len(data["keywordGaps"]) == 2
        assert data["keywordGaps"][0]["keyword"] == "AI CRM Software"
        assert data["recommendedTitle"] == MOCK_SEO_RESULT["recommendedTitle"]
        assert "copyableMetadata" in data
        assert "htmlMetaTags" in data["copyableMetadata"]
        assert len(data["topActionSteps"]) == 2
    finally:
        client.portal.call(app.state.http_client.aclose)
        app.state.http_client = original


def test_seo_compare_krutrim_primary_success(client, monkeypatch):
    monkeypatch.setenv("KRUTRIM_API_KEY", "krutrim-test-key")
    orig_settings = app.state.settings
    app.state.settings = Settings(
        gemini_api_key="test-key",
        gemini_model="gemini-2.5-flash",
        service_token=TOKEN,
        krutrim_api_key="krutrim-test-key",
        krutrim_model="gpt-oss-120b",
        krutrim_base_url="https://cloud.olakrutrim.com/v1",
    )

    async def fake_krutrim_provider(request):
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": json.dumps(MOCK_SEO_RESULT),
                        }
                    }
                ]
            },
        )

    original = app.state.http_client
    app.state.http_client = httpx.AsyncClient(transport=httpx.MockTransport(fake_krutrim_provider))
    try:
        headers = {"X-Service-Token": TOKEN}
        res = client.post("/api/v1/seo/compare", json=SAMPLE_PAYLOAD, headers=headers)
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["summary"] == MOCK_SEO_RESULT["summary"]
        assert data["clientProfile"]["overallSeoHealthScore"] == 54
        assert data["competitorProfile"]["overallSeoHealthScore"] == 92
        assert len(data["gapFactors"]) == 2
    finally:
        app.state.settings = orig_settings
        client.portal.call(app.state.http_client.aclose)
        app.state.http_client = original
