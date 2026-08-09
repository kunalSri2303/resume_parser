import pytest
import json
from unittest.mock import MagicMock, patch
from app.services.skill_normalizer import SkillNormalizer
from app.services.extractor import ExtractorService
from app.services.matching_service import MatchingService
from app.database.models import Candidate, Job

# --- Unit Tests: SkillNormalizer ---

def test_skill_normalizer_aliases():
    normalizer = SkillNormalizer()
    
    # Test canonical mappings
    assert normalizer.normalize_skill("cpp") == "C++"
    assert normalizer.normalize_skill("c plus plus") == "C++"
    assert normalizer.normalize_skill("nodejs") == "Node.js"
    assert normalizer.normalize_skill("reactjs") == "React"
    assert normalizer.normalize_skill("k8s") == "Kubernetes"
    
    # Test list normalization (uniqueness and casing)
    input_skills = ["cpp", "C++", "reactjs", "HTML5", "unknown-skill"]
    normalized = normalizer.normalize_skills(input_skills)
    
    assert "C++" in normalized
    assert "React" in normalized
    assert "HTML" in normalized
    assert "Unknown Skill" in normalized
    assert len(normalized) == 4 # 'cpp' and 'C++' resolve to the same, removing duplicates

# --- Unit Tests: Regex Extraction ---

def test_regex_extraction_deterministic():
    resume_text = """
    John Doe
    Email: john.doe@example.com | Phone: +1-234-567-8901
    LinkedIn: linkedin.com/in/johndoe | GitHub: github.com/johndoe
    Portfolio: https://johndoe.dev
    
    Summary: Experienced full stack engineer.
    """
    
    rule_data = ExtractorService.extract_rule_based(resume_text)
    
    assert rule_data["email"] == "john.doe@example.com"
    assert rule_data["phone"] == "+1-234-567-8901"
    assert "johndoe" in rule_data["linkedin"]
    assert "johndoe" in rule_data["github"]
    assert rule_data["portfolio"] == "https://johndoe.dev"

# --- Unit Tests: Matching Engine Calculations ---

@patch('app.services.vector_store.VectorStoreService')
@patch('app.services.embedding.base_embedding.EmbeddingProvider')
def test_weighted_matching_scores(mock_embed, mock_vector_store):
    db_mock = MagicMock()
    
    # Mock candidate list query
    candidate_mock = MagicMock(spec=Candidate)
    candidate_mock.id = 1
    candidate_mock.name = "Test Candidate"
    candidate_mock.email = "test@example.com"
    candidate_mock.role = "Python Dev"
    candidate_mock.skills = []
    
    db_mock.query().all.return_value = [candidate_mock]
    
    # Mock FAISS query results for sections
    # Returns (faiss_id, score)
    mock_vector_store_instance = mock_vector_store.return_value
    # Let's say:
    # - skills query returns ID 10 with score 0.8
    # - experience query returns ID 11 with score 0.7
    # - projects query returns ID 12 with score 0.6
    # - education query returns ID 13 with score 0.9
    # - summary query returns ID 14 with score 0.5
    mock_vector_store_instance.search.side_effect = [
        [(10, 0.8)], # skills
        [(11, 0.7)], # experience
        [(12, 0.6)], # projects
        [(13, 0.9)], # education
        [(14, 0.5)]  # summary
    ]
    
    # Mock metadata mapping lookup matching those IDs
    meta_skills = MagicMock(faiss_index_id=10, entity_id=1, section_type="skills")
    meta_exp = MagicMock(faiss_index_id=11, entity_id=1, section_type="experience")
    meta_proj = MagicMock(faiss_index_id=12, entity_id=1, section_type="projects")
    meta_edu = MagicMock(faiss_index_id=13, entity_id=1, section_type="education")
    meta_sum = MagicMock(faiss_index_id=14, entity_id=1, section_type="summary")
    
    db_mock.query().filter().all.side_effect = [
        [meta_skills],
        [meta_exp],
        [meta_proj],
        [meta_edu],
        [meta_sum]
    ]

    # Initialize service
    matcher = MatchingService(mock_embed.return_value, mock_vector_store_instance)
    
    # Mock job
    job = MagicMock(spec=Job)
    job.skills = json.dumps(["Python"])
    job.experience = "3 years"
    job.education = "CS"
    job.responsibilities = json.dumps(["Develop APIs"])
    job.title = "Python Engineer"
    
    matches = matcher.match_job(db_mock, job)
    
    assert len(matches) == 1
    best_match = matches[0]
    assert best_match["candidate_id"] == 1
    
    # Check weighted scores:
    # Skills = 0.8 * 0.4 = 0.32
    # Exp = 0.7 * 0.3 = 0.21
    # Proj = 0.6 * 0.15 = 0.09
    # Edu = 0.9 * 0.1 = 0.09
    # Summary = 0.5 * 0.05 = 0.025
    # Total = 0.32 + 0.21 + 0.09 + 0.09 + 0.025 = 0.735 -> 73.5%
    assert best_match["overall_score"] == 73.5
    assert best_match["section_scores"]["skills"] == 80.0
    assert best_match["section_scores"]["experience"] == 70.0

# --- Unit Tests: Clean experience years, text cleaning, and upgraded regexes ---

def test_clean_experience_years():
    from app.services.extractor import clean_experience_years
    assert clean_experience_years(5) == 5.0
    assert clean_experience_years(7.2) == 7.2
    assert clean_experience_years("5+ years") == 5.0
    assert clean_experience_years("7.5 Yrs") == 7.5
    assert clean_experience_years("five") == 5.0
    assert clean_experience_years("no experience") == 0.0
    assert clean_experience_years(None) == 0.0

def test_parser_text_cleaning():
    from app.services.parser import ParserService
    raw_dirty_text = """
    Page 1 of 5
    Hello World
    
    1 / 3
    Some Content   Here  with multiple spaces
    
    PG. 4
    Goodbye World
    """
    cleaned = ParserService.clean_text(raw_dirty_text)
    expected_lines = [
        "Hello World",
        "Some Content Here with multiple spaces",
        "Goodbye World"
    ]
    assert cleaned.split("\n") == expected_lines

def test_regex_indian_and_international_phone_numbers():
    from app.services.extractor import ExtractorService
    test_resume_us = "Contact: +1 (123) 456-7890 or mail to us"
    test_resume_in_space = "Contact: +91 98765 43210 or call me"
    test_resume_in_dash = "Phone: 98765-43210"
    test_resume_short = "Call 12345" # Should be rejected as too short
    
    res_us = ExtractorService.extract_rule_based(test_resume_us)
    res_in_space = ExtractorService.extract_rule_based(test_resume_in_space)
    res_in_dash = ExtractorService.extract_rule_based(test_resume_in_dash)
    res_short = ExtractorService.extract_rule_based(test_resume_short)
    
    assert res_us["phone"] == "+1 (123) 456-7890"
    assert res_in_space["phone"] == "+91 98765 43210"
    assert res_in_dash["phone"] == "98765-43210"
    assert res_short["phone"] is None

