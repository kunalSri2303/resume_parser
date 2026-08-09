import sys
import json
import fitz
from pathlib import Path

# Add backend root to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_multi_page_table_vacancy_extraction(tmp_path):
    tmp_path.mkdir(parents=True, exist_ok=True)
    
    # Create multi-page PDF document with table rows on page 1 and page 2
    doc = fitz.open()

    # PAGE 1: Header Requisition Info + Table Rows 1 & 2
    page1 = doc.new_page()
    page1_text = """
    OFFICIAL DEMAND LETTER
    Ref No: DL/QATAR/2026/1020
    Company: Al-Jaber Engineering & Construction W.L.L.
    Client: Qatar Gas Industrial Project
    Country: Qatar
    Working Hours: 8 Hours Daily
    Contract: 2 Years Renewable
    Contact: Mr. Rashid Al-Hajri (Recruitment Manager)
    Email: jobs@aljaberqatar.com | Phone: +974-4455-6677

    POSITION TABLE REQUIREMENTS:
    -----------------------------------------------------------------------------------------
    S.No | Position Title             | Qty | Basic Salary | Currency | Benefits
    -----------------------------------------------------------------------------------------
    1    | Pipe Fabricator            | 15  | 2800         | QAR      | Free Accommodation
    2    | Rigging Supervisor         | 5   | 5500         | QAR      | Free Food & Transport
    -----------------------------------------------------------------------------------------
    """
    page1.insert_text((50, 50), page1_text)

    # PAGE 2: Table Rows 3, 4 & 5 on Page 2
    page2 = doc.new_page()
    page2_text = """
    POSITION TABLE REQUIREMENTS (CONTINUED - PAGE 2):
    -----------------------------------------------------------------------------------------
    S.No | Position Title             | Qty | Basic Salary | Currency | Benefits
    -----------------------------------------------------------------------------------------
    3    | Safety Officer (NEBOSH)    | 4   | 6200         | QAR      | Duty Allowance
    4    | Heavy Equipment Driver     | 12  | 2400         | QAR      | Free Accommodation
    5    | Millwright Technician      | 8   | 3500         | QAR      | Free Food & Transport
    -----------------------------------------------------------------------------------------
    Note: All candidates must have minimum 3 years Gulf experience.
    """
    page2.insert_text((50, 50), page2_text)

    pdf_path = tmp_path / "multi_page_demand_letter.pdf"
    doc.save(str(pdf_path))
    doc.close()

    with open(pdf_path, "rb") as f:
        response = client.post(
            "/extract-vacancy",
            files={"file": ("multi_page_demand_letter.pdf", f, "application/pdf")}
        )

    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "success"
    data = res_data["data"]

    # 1. Verify Header Requisition Details
    assert "Al-Jaber" in (data.get("company_name") or "")
    assert data.get("demand_letter_number") == "DL/QATAR/2026/1020" or "1020" in (data.get("demand_letter_number") or "")
    assert "Qatar" in (data.get("country") or "")

    # 2. Verify Multi-Page Position Table Extraction (Should extract 5 distinct positions across Page 1 & Page 2)
    positions = data.get("positions", [])
    print(f"\n✅ Total Extracted Positions across Multi-Page Document: {len(positions)}")
    
    pos_titles = [p["title"].lower() for p in positions]
    print("Extracted Position Titles:", pos_titles)

    # Verify positions from Page 1
    assert any("pipe" in t or "fabricator" in t for t in pos_titles), "Page 1 position 'Pipe Fabricator' missing"
    assert any("rigging" in t or "supervisor" in t for t in pos_titles), "Page 1 position 'Rigging Supervisor' missing"

    # Verify positions from Page 2
    assert any("safety" in t or "nebosh" in t for t in pos_titles), "Page 2 position 'Safety Officer' missing"
    assert any("driver" in t or "equipment" in t for t in pos_titles), "Page 2 position 'Heavy Equipment Driver' missing"
    assert any("millwright" in t or "technician" in t for t in pos_titles), "Page 2 position 'Millwright Technician' missing"

    # Ensure positions were NOT merged into one
    assert len(positions) >= 5, f"Expected at least 5 positions from table, got {len(positions)}"

    print("\n✅ Multi-Page & Table Extraction Test PASSED!")
    print(json.dumps(data, indent=2))

if __name__ == "__main__":
    test_multi_page_table_vacancy_extraction(Path("./tmp"))
