from scraper.quality import review_bucket, score_completeness


def test_empty_record_scores_zero():
    assert score_completeness({}) == 0
    assert review_bucket(0) == "auto_rejected"


def test_complete_record_scores_100():
    record = {
        "tuition_usd": 8000,
        "living_cost_usd": 6000,
        "programs": [{"name": "Computer Science"}],
        "scholarships": [{"name": "Merit Award"}],
        "deadlines": ["2027-03-01"],
        "language_requirements": "IELTS 6.0",
        "intl_student_pct": 12.5,
        "website": "https://example.edu",
    }
    assert score_completeness(record) == 100
    assert review_bucket(100) == "ready_for_review"


def test_openalex_style_record_scores_low():
    # OpenAlex only ever gives name/country/city/website/source_record_id
    # -- no tuition, no programs. This should score low, which is the
    # whole point: it needs Tier 4 enrichment before it's publishable.
    record = {"name": "Example University", "country": "Jordan", "website": "https://example.edu"}
    score = score_completeness(record)
    assert score <= 5  # only the 5-point website field applies
    assert review_bucket(score) == "auto_rejected"


def test_missing_scholarships_gets_half_credit_not_zero():
    with_scholarships = {"scholarships": [{"name": "X"}]}
    without_scholarships = {"scholarships": []}
    without_field = {}

    assert score_completeness(with_scholarships) == 10
    assert score_completeness(without_scholarships) == 5
    assert score_completeness(without_field) == 0


def test_review_bucket_thresholds():
    assert review_bucket(29) == "auto_rejected"
    assert review_bucket(30) == "needs_attention"
    assert review_bucket(59) == "needs_attention"
    assert review_bucket(60) == "ready_for_review"
