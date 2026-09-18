import httpx
import pytest

from scraper.adapters.openalex import COUNTRY_CODES, OpenAlexAdapter

PAGE_1 = {
    "results": [
        {
            "id": "https://openalex.org/I123",
            "display_name": "University of Jordan",
            "homepage_url": "https://ju.edu.jo",
            "geo": {"city": "Amman"},
            "type": "education",
        }
    ],
    "meta": {"next_cursor": "cursor2"},
}

PAGE_2 = {
    "results": [
        {
            "id": "https://openalex.org/I456",
            "display_name": "German Jordanian University",
            "homepage_url": "https://gju.edu.jo",
            "geo": {"city": "Amman"},
            "type": "education",
        }
    ],
    "meta": {"next_cursor": None},
}


def _mock_transport(pages_by_cursor: dict[str, dict]):
    def handler(request: httpx.Request) -> httpx.Response:
        cursor = httpx.QueryParams(request.url.query.decode()).get("cursor")
        assert httpx.QueryParams(request.url.query.decode()).get("api_key") == "test-key"
        return httpx.Response(200, json=pages_by_cursor[cursor])

    return httpx.MockTransport(handler)


def test_requires_api_key(monkeypatch):
    monkeypatch.delenv("OPENALEX_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="OPENALEX_API_KEY"):
        OpenAlexAdapter()


def test_fetch_candidates_paginates_and_maps_fields():
    transport = _mock_transport({"*": PAGE_1, "cursor2": PAGE_2})
    client = httpx.Client(transport=transport)
    adapter = OpenAlexAdapter(api_key="test-key", client=client, request_delay=0)

    results = list(adapter.fetch_candidates(["Jordan"]))

    assert len(results) == 2
    assert results[0]["name"] == "University of Jordan"
    assert results[0]["country"] == "Jordan"
    assert results[0]["city"] == "Amman"
    assert results[0]["website"] == "https://ju.edu.jo"
    assert results[0]["source_record_id"] == "https://openalex.org/I123"
    assert results[1]["name"] == "German Jordanian University"


def test_unknown_country_raises():
    client = httpx.Client(transport=httpx.MockTransport(lambda r: httpx.Response(200, json={"results": []})))
    adapter = OpenAlexAdapter(api_key="test-key", client=client)
    with pytest.raises(ValueError, match="No OpenAlex country_code mapping"):
        list(adapter.fetch_candidates(["Atlantis"]))


def test_all_phase1_countries_are_mapped():
    # dev plan Chapter 1's target country list
    phase1_countries = [
        "United Kingdom",
        "Germany",
        "Turkey",
        "Poland",
        "Lithuania",
        "Malaysia",
        "Egypt",
        "Lebanon",
        "Jordan",
        "United Arab Emirates",
    ]
    for country in phase1_countries:
        assert country in COUNTRY_CODES, f"{country} missing from COUNTRY_CODES"
