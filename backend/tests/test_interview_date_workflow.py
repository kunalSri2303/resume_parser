import os
import sys
import json
import pytest
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_interview_date_job_crud_workflow():
    # 1. Create Vacancy with Interview Date
    create_payload = {
        "title": "Senior Quality Inspector",
        "location": "Abu Dhabi",
        "experience": "5+ Years",
        "education": "B.E. Mechanical",
        "interview_date": "2026-08-25",
        "skills": ["NDT Level II", "Piping Inspection"],
        "responsibilities": ["Inspect welding joints", "Sign off quality reports"]
    }
    create_res = client.post("/job", json=create_payload)
    assert create_res.status_code == 200, create_res.text
    created_job = create_res.json()
    assert created_job["title"] == "Senior Quality Inspector"
    assert created_job["interview_date"] == "2026-08-25"
    job_id = created_job["id"]

    # 2. Get Vacancy Details and verify interview_date
    get_res = client.get(f"/job/{job_id}")
    assert get_res.status_code == 200
    fetched_job = get_res.json()
    assert fetched_job["id"] == job_id
    assert fetched_job["interview_date"] == "2026-08-25"

    # 3. Update Vacancy Interview Date
    update_payload = {
        "interview_date": "2026-09-01",
        "location": "Dubai"
    }
    update_res = client.put(f"/job/{job_id}", json=update_payload)
    assert update_res.status_code == 200
    updated_job = update_res.json()
    assert updated_job["interview_date"] == "2026-09-01"
    assert updated_job["location"] == "Dubai"

    # 4. Verify Get Vacancy reflects updated interview_date
    get_res_updated = client.get(f"/job/{job_id}")
    assert get_res_updated.status_code == 200
    assert get_res_updated.json()["interview_date"] == "2026-09-01"

    # 5. Verify Vacancy List includes interview_date
    list_res = client.get("/jobs")
    assert list_res.status_code == 200
    all_jobs = list_res.json()
    matched = [j for j in all_jobs if j["id"] == job_id]
    assert len(matched) == 1
    assert matched[0]["interview_date"] == "2026-09-01"

    print("\n✅ Interview Date Job CRUD & API Workflow Test PASSED!")

if __name__ == "__main__":
    test_interview_date_job_crud_workflow()
