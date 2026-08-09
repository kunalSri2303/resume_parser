import os
import sys
import json
import pytest
from pathlib import Path

# Add backend root to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_status():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_extract_vacancy_sample_pdf(tmp_path):
    tmp_path.mkdir(parents=True, exist_ok=True)
    # Create a test PDF with demand letter content
    import fitz
    doc = fitz.open()
    page = doc.new_page()
    text = """
    DEMAND LETTER
    Ref No: DL/UAE/2026/808
    Company Name: Gulf Contracting & Engineering LLC
    Client: Abu Dhabi Airport Expansion Project
    Country: United Arab Emirates
    Working Hours: 8 Hours / Day
    Contract Period: 2 Years
    Contact Person: Ahmed Al-Mansoori (HR Manager)
    Contact Phone: +971-50-9876543
    Contact Email: recruitment@gulfcontracting.ae
    Accommodation: Free Company Accommodation Provided
    Transport: Free Transportation Provided
    Food: Duty Meals Provided

    REQUIRED POSITIONS:
    1. Senior Quality Engineer (QA/QC)
       Quantity: 3
       Salary: 8500 AED
       Experience Required: 5+ Years in Oil & Gas / Civil Inspection
       Education: B.E. / B.Tech Mechanical Engineering
       Skills: NDT Level II, ASME Section V, ISO 9001, Piping Inspection

    2. Structural Welder
       Quantity: 10
       Salary: 3200 AED
       Experience Required: 3 Years 6G Welding
       Education: ITI / Technical Diploma
       Skills: 6G SMAW, GTAW Welding, Safety Compliance
    """
    page.insert_text((50, 50), text)
    pdf_path = tmp_path / "sample_demand_letter.pdf"
    doc.save(str(pdf_path))
    doc.close()

    with open(pdf_path, "rb") as f:
        response = client.post(
            "/extract-vacancy",
            files={"file": ("sample_demand_letter.pdf", f, "application/pdf")}
        )

    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "success"
    data = res_data["data"]

    # Verify extracted requisition header fields
    assert "Gulf Contracting" in (data.get("company_name") or "")
    assert data.get("demand_letter_number") == "DL/UAE/2026/808" or "808" in (data.get("demand_letter_number") or "")
    
    # Verify positions extracted
    positions = data.get("positions", [])
    assert len(positions) >= 2
    
    pos_titles = [p["title"].lower() for p in positions]
    assert any("quality" in t or "engineer" in t for t in pos_titles)
    assert any("welder" in t for t in pos_titles)

    print("\n✅ Vacancy Demand Letter Extraction Test PASSED!")
    print(f"Extracted Company: {data.get('company_name')}")
    print(f"Extracted Positions Count: {len(positions)}")
    print(json.dumps(data, indent=2))

if __name__ == "__main__":
    test_extract_vacancy_sample_pdf(Path("./tmp"))
