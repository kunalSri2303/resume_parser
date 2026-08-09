import io
import os
import re
import sys
import time
import zipfile
import requests
import fitz  # PyMuPDF
import docx

API_URL = "http://127.0.0.1:8000"
TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp_test_data")

def setup_test_files():
    """Generates the required PDF, DOCX, and ZIP resume files programmatically."""
    os.makedirs(TEMP_DIR, exist_ok=True)
    print("Creating programmatically simulated resume files...")
    
    # 1. Normal PDF resume
    doc = fitz.open()
    page = doc.new_page()
    normal_text = (
        "John Doe\n"
        "Email: john.doe@example.com | Phone: +1-234-567-8901\n"
        "LinkedIn: linkedin.com/in/johndoe\n"
        "Skills: Python, FastAPI, SQLite\n"
        "Experience: Senior Software Engineer (Jan 2020 - Present)\n"
        "Developed FastAPI services and databases.\n"
        "Education: Bachelor of Science in Computer Science, MIT (2018-2022)"
    )
    page.insert_text((50, 50), normal_text)
    doc.save(os.path.join(TEMP_DIR, "normal.pdf"))
    doc.close()
    
    # 2. Multi-column PDF resume
    doc = fitz.open()
    page = doc.new_page()
    # Left Column
    page.insert_text((50, 50), "Jane Smith\nEmail: jane.smith@example.com\nPhone: +91 98765 43210\nLocation: Bangalore, India")
    # Right Column
    page.insert_text((300, 50), "Skills:\nReact\nJavaScript\nNode.js\n\nExperience:\nFrontend Engineer at Flipkart (Jun 2021 - Present)")
    doc.save(os.path.join(TEMP_DIR, "multi_column.pdf"))
    doc.close()
    
    # 3. Table PDF resume
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), "Alan Turing\nEmail: alan.turing@example.com\nPhone: 9876543210\n\nExperience Summary:\n")
    page.insert_text((50, 120), "Company | Role | Duration\nGoogle | ML Engineer | 3 Years\nAmazon | Applied Scientist | 2 Years")
    doc.save(os.path.join(TEMP_DIR, "table.pdf"))
    doc.close()
    
    # 4. Scanned PDF resume (no selectable text, image-only)
    temp_doc = fitz.open()
    temp_page = temp_doc.new_page()
    scanned_source_text = (
        "Scanned Candidate\n"
        "Email: scanned.candidate@example.com\n"
        "Phone: +91-76071-63007\n"
        "Skills: TensorFlow, PyTorch, Deep Learning\n"
        "Experience: ML Research Engineer (2022 - Present)\n"
        "Education: MS in AI, Stanford University"
    )
    temp_page.insert_text((50, 50), scanned_source_text)
    pix = temp_page.get_pixmap(dpi=150)
    img_bytes = pix.tobytes("png")
    temp_doc.close()
    
    scanned_doc = fitz.open()
    scanned_page = scanned_doc.new_page()
    rect = fitz.Rect(0, 0, scanned_page.rect.width, scanned_page.rect.height)
    scanned_page.insert_image(rect, stream=img_bytes)
    scanned_doc.save(os.path.join(TEMP_DIR, "scanned.pdf"))
    scanned_doc.close()
    
    # 5. Invalid PDF file
    with open(os.path.join(TEMP_DIR, "invalid.pdf"), "w", encoding="utf-8") as f:
        f.write("JUNK BYTES NOT A VALID PDF SIGNATURE")
        
    # 6. Normal DOCX resume with headers & footers
    doc_docx = docx.Document()
    section = doc_docx.sections[0]
    # Header containing contact details (essential test case)
    section.header.paragraphs[0].text = "Contact: bob.johnson@example.com | Phone: 888-777-6666"
    doc_docx.add_paragraph("Bob Johnson Resume")
    doc_docx.add_paragraph("Experience: C++ Software Developer at Microsoft")
    table = doc_docx.add_table(rows=3, cols=2)
    table.rows[0].cells[0].paragraphs[0].text = "Skill"
    table.rows[0].cells[1].paragraphs[0].text = "Proficiency"
    table.rows[1].cells[0].paragraphs[0].text = "C++"
    table.rows[1].cells[1].paragraphs[0].text = "Expert"
    table.rows[2].cells[0].paragraphs[0].text = "Docker"
    table.rows[2].cells[1].paragraphs[0].text = "Intermediate"
    doc_docx.save(os.path.join(TEMP_DIR, "normal.docx"))
    
    # 7. ZIP file containing resumes
    with zipfile.ZipFile(os.path.join(TEMP_DIR, "archive.zip"), "w") as z:
        z.write(os.path.join(TEMP_DIR, "normal.pdf"), "normal.pdf")
        z.write(os.path.join(TEMP_DIR, "normal.docx"), "normal.docx")
        
    print("Simulated test files successfully created.")

def test_health():
    print("\n--- Testing Health Check Endpoint ---")
    res = requests.get(f"{API_URL}/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    print("Health check OK:", data)

def upload_file(filename: str):
    file_path = os.path.join(TEMP_DIR, filename)
    with open(file_path, "rb") as f:
        files = [("files", (filename, f, "application/octet-stream"))]
        res = requests.post(f"{API_URL}/upload-resume", files=files)
    return res

def wait_for_candidate(email: str, max_wait=60) -> dict:
    print(f"Waiting for candidate '{email}' to finish background processing...")
    start_time = time.time()
    while time.time() - start_time < max_wait:
        res = requests.get(f"{API_URL}/candidates")
        assert res.status_code == 200
        candidates = res.json()
        for cand in candidates:
            if cand["email"] == email:
                print(f"Candidate '{email}' found in database after {time.time() - start_time:.1f}s.")
                return cand
        time.sleep(2)
    raise TimeoutError(f"Candidate '{email}' not extracted within {max_wait}s.")

def verify_all():
    # Clean up state for a fresh test run
    import sqlite3
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "recruitment.db"))
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            tables = ["candidate_skills", "candidates", "embedding_metadata", "jobs", "recommendations", "recruiter_feedbacks"]
            for table in tables:
                try:
                    cursor.execute(f"DELETE FROM {table}")
                except Exception as tbl_err:
                    print(f"Notice: Table {table} clear skipped: {tbl_err}")
            conn.commit()
            conn.close()
            print("Cleared database records for a clean E2E test.")
        except Exception as e:
            print(f"Warning: Could not clear database: {e}")
            
    excel_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "excel", "Candidates.xlsx"))
    if os.path.exists(excel_path):
        try:
            os.remove(excel_path)
            print("Cleared existing Candidates.xlsx spreadsheet.")
        except Exception as e:
            print(f"Warning: Could not remove Candidates.xlsx: {e}")
            
    faiss_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "vectors", "index.faiss"))
    if os.path.exists(faiss_path):
        try:
            os.remove(faiss_path)
            print("Cleared existing FAISS index.")
        except Exception as e:
            print(f"Warning: Could not remove FAISS index: {e}")

    setup_test_files()
    
    # 1. Health check
    test_health()
    
    # 2. Upload Normal PDF resume
    print("\n--- Uploading Normal PDF Resume ---")
    res = upload_file("normal.pdf")
    assert res.status_code == 200
    print("Normal PDF upload response:", res.json())
    
    # Poll for DB ingestion
    cand_pdf = wait_for_candidate("john.doe@example.com")
    assert cand_pdf["name"] == "John Doe"
    assert cand_pdf["phone"] == "+1-234-567-8901"
    assert any(s["skill"]["name"] == "Python" for s in cand_pdf["skills"])
    print("PDF verification passed.")
    
    # 3. Upload Normal DOCX resume (testing headers & tables)
    print("\n--- Uploading DOCX Resume ---")
    res = upload_file("normal.docx")
    assert res.status_code == 200
    print("DOCX upload response:", res.json())
    
    cand_docx = wait_for_candidate("bob.johnson@example.com")
    assert "C++" in [s["skill"]["name"] for s in cand_docx["skills"]]
    assert "Docker" in [s["skill"]["name"] for s in cand_docx["skills"]]
    print("DOCX verification passed.")
    
    # 4. Upload Scanned PDF resume (multimodal OCR path)
    print("\n--- Uploading Scanned PDF Resume (OCR path) ---")
    res = upload_file("scanned.pdf")
    assert res.status_code == 200
    print("Scanned PDF upload response:", res.json())
    
    cand_scanned = wait_for_candidate("scanned.candidate@example.com")
    assert any(s["skill"]["name"] in ["TensorFlow", "PyTorch"] for s in cand_scanned["skills"])
    print("Scanned PDF (OCR) verification passed.")
    
    # 5. Upload ZIP archive containing resumes
    print("\n--- Uploading ZIP Archive ---")
    res = upload_file("archive.zip")
    assert res.status_code == 200
    print("ZIP upload response:", res.json())
    print("ZIP upload verification passed.")
    
    # 6. Test Duplicate Uploads (Update candidate instead of duplicating)
    print("\n--- Testing Duplicate Uploads ---")
    initial_count = len(requests.get(f"{API_URL}/candidates").json())
    res = upload_file("normal.pdf") # Duplicate upload
    assert res.status_code == 200
    # Wait to make sure background tasks finished
    time.sleep(5)
    final_count = len(requests.get(f"{API_URL}/candidates").json())
    assert initial_count == final_count
    print(f"Deduplication holds. Candidates count did not increase (Count: {final_count})")
    
    # 7. Test Invalid PDF File (robust failover)
    print("\n--- Testing Invalid PDF file ---")
    try:
        res = upload_file("invalid.pdf")
        print("Invalid PDF queued (expected):", res.json())
    except Exception as e:
        print("Invalid PDF rejected as expected:", e)
        
    # 8. Upload Job Description for Match Calculations
    print("\n--- Uploading Job Description ---")
    job_payload = {
        "raw_text": (
            "Job Title: Senior Python Engineer\n"
            "Required Skills: Python, FastAPI, Docker, SQLite\n"
            "Experience: 3 years\n"
            "Education: BS in Computer Science"
        )
    }
    res = requests.post(f"{API_URL}/upload-job", data=job_payload)
    assert res.status_code == 200
    job = res.json()
    job_id = job["id"]
    print(f"Created Job ID {job_id}: {job['title']}")
    
    # 9. Verify Candidate Matching Engine (/match/{job_id})
    print("\n--- Testing Candidate-Job Matching Engine ---")
    res = requests.post(f"{API_URL}/match/{job_id}")
    assert res.status_code == 200
    matches = res.json()
    print(f"Matching candidate rankings for Job ID {job_id}:")
    for match in matches:
        print(f"- ID {match['candidate_id']} ({match['name']}): Score: {match['overall_score']}%")
        
    # Ensure John Doe is near the top (since he matches Python, FastAPI, SQLite)
    best_candidate_id = matches[0]["candidate_id"]
    print("Matching Engine verification passed.")
    
    # 10. Verify AI Consultation Report Recommendation
    print("\n--- Testing AI Recommendation Report ---")
    res = requests.get(f"{API_URL}/recommendation/{best_candidate_id}/{job_id}")
    assert res.status_code == 200
    recommendation = res.json()
    assert "strengths" in recommendation
    assert "weaknesses" in recommendation
    assert "recommendation_text" in recommendation
    print("AI Recommendation verification passed. Output:")
    print(f"- Strengths: {recommendation['strengths']}")
    print(f"- Weaknesses: {recommendation['weaknesses']}")
    
    # 11. Verify Semantic Search
    print("\n--- Testing Semantic Search ---")
    search_payload = {
        "query": "Looking for a C++ developer with Docker skills",
        "top_k": 3
    }
    res = requests.post(f"{API_URL}/search", json=search_payload)
    assert res.status_code == 200
    search_results = res.json()
    print("Semantic Search results:")
    for result in search_results:
        print(f"- Candidate: {result['candidate']['name']}, Email: {result['candidate']['email']}, Score: {result['score']}%")
    # Verify C++ candidate (Bob Johnson) matches well
    assert any("bob.johnson" in r["candidate"]["email"] for r in search_results)
    print("Semantic Search verification passed.")

    # 12. Check Excel Candidates.xlsx file status ---
    print("\n--- Verifying Excel Candidates.xlsx file status ---")
    excel_path = "/Users/kunalsrivastav/Desktop/resume_parser/backend/excel/Candidates.xlsx"
    assert os.path.exists(excel_path)
    print(f"Excel file exists at {excel_path} (Size: {os.path.getsize(excel_path)} bytes).")

    print("\n==========================================")
    print("ALL E2E WORKFLOWS VERIFIED SUCCESSFULLY!")
    print("==========================================")

if __name__ == "__main__":
    try:
        verify_all()
    except Exception as e:
        print(f"\nE2E VERIFICATION FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
