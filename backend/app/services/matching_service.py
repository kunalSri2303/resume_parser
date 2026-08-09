import json
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.models import Candidate, EmbeddingMetadata, Job
from app.database.operations import save_embedding_metadata, delete_candidate_embedding_metadata
from app.services.embedding.base_embedding import EmbeddingProvider
from app.services.vector_store import VectorStoreService
from app.utils.logger import logger

class MatchingService:
    def __init__(self, embedding_provider: EmbeddingProvider, vector_store: VectorStoreService):
        self.embedding_provider = embedding_provider
        self.vector_store = vector_store

    def _get_next_faiss_id(self, db: Session) -> int:
        """Determines the next available FAISS vector ID by querying EmbeddingMetadata."""
        max_id = db.query(func.max(EmbeddingMetadata.faiss_index_id)).scalar()
        return (max_id + 1) if max_id is not None else 0

    def index_candidate(self, db: Session, candidate: Candidate, candidate_data: dict):
        """
        Generates embeddings for all major resume sections and stores them in FAISS.
        """
        # First, delete existing vector representations for this candidate to prevent duplicates/stale links
        self.delete_candidate(db, candidate.id)

        # Build sections
        sections = {}
        
        # 1. Summary
        if candidate_data.get("summary"):
            sections["summary"] = candidate_data["summary"]
            
        # 2. Skills
        skills = candidate_data.get("skills") or candidate_data.get("categorized_skills") or {}

        all_skills = []

        for category in [
            "technical",
            "soft",
            "tools",
            "frameworks",
            "equipment",
            "standards",
            "languages",
            "methodologies"
        ]:
            all_skills.extend(skills.get(category, []))

        # Fallback to flat list of skills if empty
        if not all_skills and isinstance(candidate_data.get("skills"), list):
            all_skills = candidate_data.get("skills")

        all_skills = list(dict.fromkeys(all_skills))

        if all_skills:
            sections["skills"] = "Skills: " + ", ".join(all_skills)
            
        # 3. Experience
        exp_list = []
        for exp in candidate_data.get("experience", []):
            title = exp.get("title", "")
            comp = exp.get("company", "")
            dur = exp.get("duration", "")
            desc = exp.get("description", "")
            exp_list.append(f"Position: {title} at {comp} ({dur}). Duties: {desc}")
        if exp_list:
            sections["experience"] = "\n".join(exp_list)
            
        # 4. Projects
        proj_list = []
        for proj in candidate_data.get("projects", []):
            name = proj.get("name", "")
            desc = proj.get("description", "")
            tech = ", ".join(proj.get("technologies_used", []))
            tools = ", ".join(proj.get("tools_used", []))

            proj_list.append(
                f"""
            Project: {name}
            Description: {desc}
            Technologies: {tech}
            Tools: {tools}
            """
            )
           
        if proj_list:
            sections["projects"] = "\n".join(proj_list)
            
        # 5. Education
        edu_list = []
        for edu in candidate_data.get("education", []):
            deg = edu.get("degree", "")
            inst = edu.get("institution", "")
            field = edu.get("field_of_study", "")
            year = edu.get("graduation_year", "")
            edu_list.append(f"Degree: {deg} in {field} from {inst} ({year})")
        if edu_list:
            sections["education"] = "\n".join(edu_list)
        # 6. Profession

        profession = candidate_data.get("profession", {})

        if any([
            profession.get("category"),
            profession.get("industry"),
            profession.get("current_role"),
            profession.get("seniority"),
        ]):

            profession_text = f"""
        Category: {profession.get("category", "")}
        Industry: {profession.get("industry", "")}
        Role: {profession.get("current_role", "")}
        Seniority: {profession.get("seniority", "")}
        """

            sections["profession"] = profession_text
            
        certs = []

        for cert in candidate_data.get("certifications", []):
            if isinstance(cert, dict):
                certs.append(
                    f"{cert.get('name','')} issued by {cert.get('issuer','')}"
                )
            elif isinstance(cert, str):
                certs.append(cert)

        if certs:
            sections["certifications"] = "\n".join(certs)
            
        #Achievement 
        achievements = []

        for ach in candidate_data.get("achievements", []):
            if isinstance(ach, dict):
                achievements.append(
                    f"{ach.get('title','')} {ach.get('description','')}"
                )
            elif isinstance(ach, str):
                achievements.append(ach)

        if achievements:
            sections["achievements"] = "\n".join(achievements)            
            
        # Generate embeddings and add to FAISS
        for section_name, text in sections.items():
            if not text.strip():
                continue
                
            try:
                embedding = self.embedding_provider.get_embedding(text)
                faiss_id = self._get_next_faiss_id(db)
                
                # Insert vector
                self.vector_store.add_vectors([embedding], [faiss_id])
                
                # Save mapping to SQLite
                save_embedding_metadata(
                    db=db,
                    entity_type="candidate",
                    entity_id=candidate.id,
                    section_type=section_name,
                    faiss_id=faiss_id
                )
            except Exception as e:
                logger.error(f"Failed to generate and save embedding for candidate {candidate.id} section '{section_name}': {e}")

        logger.info(f"Successfully generated section-based embeddings for candidate {candidate.id}")

    def delete_candidate(self, db: Session, candidate_id: int):
        """Removes all candidate section vectors from FAISS and metadata table."""
        metadata = db.query(EmbeddingMetadata).filter(
            EmbeddingMetadata.entity_type == "candidate",
            EmbeddingMetadata.entity_id == candidate_id
        ).all()
        
        if not metadata:
            return
            
        faiss_ids = [m.faiss_index_id for m in metadata]
        
        # Remove from FAISS index
        self.vector_store.remove_vectors(faiss_ids)
        
        # Remove from database metadata
        delete_candidate_embedding_metadata(db, candidate_id)
        logger.info(f"Cleaned up embedding metadata for candidate {candidate_id}")

    def match_job(self, db: Session, job: Job, top_k: int = 10) -> list[dict]:
        """
        Matches a job description against all candidates using weighted section scores:
            Skills          35%
            Experience      25%
            Projects        10%
            Education       10%
            Profession      10%
            Certifications   5%
            Achievements     3%
            Summary          2%
        
        Uses FAISS to search each job section vector and scores candidates.
        """
        # Load Job properties
        job_skills = "Skills required: " + ", ".join(json.loads(job.skills or "[]"))
        job_exp = f"Experience required: {job.experience or 'Not specified'}"
        job_edu = f"Education required: {job.education or 'Not specified'}"
        
        responsibilities_list = json.loads(job.responsibilities or "[]")
        job_summary = f"Job Title: {job.title}. Responsibilities: " + "; ".join(responsibilities_list)

        # Define sections and their matching query strings
        job_sections = {
            "skills": (job_skills, 0.35),
            "experience": (job_exp, 0.25),
            "projects": (job_summary, 0.10),
            "education": (job_edu, 0.10),
            "profession": (job_summary, 0.10),
            "certifications": (job_summary, 0.05),
            "achievements": (job_summary, 0.03),
            "summary": (job_summary, 0.02),
        }

        # Initialize score board for all candidates
        # Structure: { candidate_id: { section_name: similarity_score } }
        candidate_scores = {}

        # Fetch all candidate IDs from db to initialize scores
        all_candidates = db.query(Candidate.id, Candidate.name, Candidate.email, Candidate.role).all()
        candidate_info_map = {c.id: {"name": c.name, "email": c.email, "role": c.role} for c in all_candidates}
        
        for cand_id in candidate_info_map:
            candidate_scores[cand_id] = {sec: 0.0 for sec in job_sections}

        # Query FAISS for each job section vector
        for section_name, (text, weight) in job_sections.items():
            if not text.strip():
                continue
                
            try:
                # Generate query vector
                query_vector = self.embedding_provider.get_embedding(text)
                
                # Search all vectors in FAISS index (up to 1000 to cover all candidates)
                faiss_results = self.vector_store.search(query_vector, top_k=1000)
                
                # Map FAISS index IDs back to candidate section types
                faiss_ids = [r[0] for r in faiss_results]
                scores_map = {r[0]: r[1] for r in faiss_results}
                
                if not faiss_ids:
                    continue
                    
                # Look up database metadata for these FAISS IDs
                metadata_records = db.query(EmbeddingMetadata).filter(
                    EmbeddingMetadata.faiss_index_id.in_(faiss_ids),
                    EmbeddingMetadata.entity_type == "candidate"
                ).all()
                
                for meta in metadata_records:
                    sim_score = scores_map[meta.faiss_index_id]
                    # Map to the candidate's scores
                    if meta.entity_id in candidate_scores:
                        # Save the similarity score for this section
                        # FAISS cosine scores range -1 to 1 (usually 0 to 1 for normalized text)
                        # Normalize to 0 to 1 range
                        normalized_score = max(0.0, sim_score)
                        candidate_scores[meta.entity_id][section_name] = normalized_score
                        
            except Exception as e:
                logger.error(f"Error querying FAISS during job match for section '{section_name}': {e}")

        # Compute overall weighted scores
        ranked_list = []
        for cand_id, scores in candidate_scores.items():
            overall_score = 0.0
            for section_name, (_, weight) in job_sections.items():
                overall_score += scores[section_name] * weight
            
            # Convert to percentage
            overall_percentage = overall_score * 100.0
            
            ranked_list.append({
                "candidate_id": cand_id,
                "name": candidate_info_map[cand_id]["name"],
                "email": candidate_info_map[cand_id]["email"],
                "role": candidate_info_map[cand_id]["role"],
                "overall_score": round(overall_percentage, 1),
                "section_scores": {sec: round(s * 100.0, 1) for sec, s in scores.items()}
            })

        # Sort by overall score descending
        ranked_list = sorted(ranked_list, key=lambda x: x["overall_score"], reverse=True)
        
        # Return top candidates
        return ranked_list[:top_k]
