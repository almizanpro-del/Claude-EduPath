from scraper.normalize import find_duplicates, normalize_name


def test_normalize_strips_legal_suffix_both_orders():
    assert normalize_name("University of Jordan") == "jordan"
    assert normalize_name("Jordan University") == "jordan"


def test_normalize_strips_punctuation_and_case():
    # Note: "University" also gets stripped as a legal suffix by the same
    # function -- that's tested separately above. This case checks
    # punctuation/apostrophe handling specifically.
    assert normalize_name("St. Joseph's College!") == "st josephs college"


def test_normalize_collapses_whitespace():
    assert normalize_name("  American   University   of Beirut ") == "american beirut"


def test_normalize_empty_string():
    assert normalize_name("") == ""


def test_find_duplicates_exact_match_after_normalization():
    existing = [("University of Jordan", "Jordan"), ("Cairo University", "Egypt")]
    matches = find_duplicates("Jordan University", "Jordan", existing)
    assert len(matches) == 1
    assert matches[0].existing_index == 0
    assert matches[0].score == 100.0
    assert matches[0].is_review_needed is False


def test_find_duplicates_ignores_different_country():
    # "American University" exists as genuinely distinct institutions in
    # different countries -- a fuzzy name match across countries should
    # NOT be treated as the same duplicate.
    existing = [("American University of Beirut", "Lebanon")]
    matches = find_duplicates("American University of Sharjah", "United Arab Emirates", existing)
    assert matches == []


def test_find_duplicates_fuzzy_match_lands_in_review_band():
    existing = [("Al-Ahliyya Amman University", "Jordan")]
    # A real-world variant (dropped "Al-" prefix) should fuzzy-match but
    # land below the auto-merge threshold, flagged for manual review
    # instead of either silently merging or silently missing it.
    matches = find_duplicates("Ahliyya Amman University", "Jordan", existing)
    assert len(matches) == 1
    assert 80 <= matches[0].score < 92
    assert matches[0].is_review_needed is True


def test_find_duplicates_no_match_for_unrelated_names():
    existing = [("Cairo University", "Egypt")]
    matches = find_duplicates("American University of Beirut", "Egypt", existing)
    assert matches == []
