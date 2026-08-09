import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.database import get_db
from app.database.models import Candidate, EmbeddingMetadata
from app.schemas.schemas import SearchQuerySchema, SearchResultSchema
from app.api.resume import format_candidate_response
from app.services.embedding.sentence_transformer import SentenceTransformersProvider
from app.services.vector_store import VectorStoreService
from app.utils.logger import logger

router = APIRouter(prefix="", tags=["Search"])

embedding_provider = SentenceTransformersProvider()
vector_store = VectorStoreService()

def parse_experience_filter(query: str) -> int:
    """Helper to detect experience numbers in natural language query (e.g., '3+ years')."""
    # Matches '3+ years', '3+ yr', '3 years', '5 years experience'
    match = re.search(r'(\d+)\+?\s*(?:years?|yrs?|yr)', query, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None

@router.post("/search", response_model=list[SearchResultSchema])
def search_candidates(
    search_payload: SearchQuerySchema,
    db: Session = Depends(get_db)
):
    """
    Performs a hybrid semantic search with metadata filters:
    1. Parse natural language queries for filters like experience years.
    2. Convert query to vector embedding.
    3. Retrieve relevant FAISS vector matches.
    4. Fetch candidates, apply SQL metadata filters, and return candidates ranked by similarity.
    """
    query_text = search_payload.query
    logger.info(f"Natural language candidate search requested: '{query_text}'")
    
    # 1. Detect experience metadata filter
    min_exp = parse_experience_filter(query_text)
    
    # Detect location names (basic heuristics for common locations, or let semantic search handle it)
    # If the user searches "Lucknow", we also add a soft keyword search on candidate location
    location_filter = None
    location_match = re.search(r'(?:in|from|at|around)\s+([a-zA-Z\s]+)', query_text, re.IGNORECASE)
    if location_match:
        location_filter = location_match.group(1).strip()

    # 2. Get query embedding
    try:
        query_vector = embedding_provider.get_embedding(query_text)
    except Exception as e:
        logger.error(f"Failed to generate query embedding: {e}")
        raise HTTPException(status_code=500, detail="Error generating search embedding vector.")

    # 3. Retrieve matches from FAISS
    # Query up to 1000 items to filter dynamically
    faiss_matches = vector_store.search(query_vector, top_k=1000)
    if not faiss_matches:
        return []

    faiss_ids = [r[0] for r in faiss_matches]
    scores_map = {r[0]: r[1] for r in faiss_matches}

    # Fetch metadata mappings
    metadata_records = db.query(EmbeddingMetadata).filter(
        EmbeddingMetadata.faiss_index_id.in_(faiss_ids),
        EmbeddingMetadata.entity_type == "candidate"
    ).all()

    # Aggregate scores by Candidate ID (taking max similarity score among its sections)
    candidate_scores = {}
    for meta in metadata_records:
        score = scores_map[meta.faiss_index_id]
        cand_id = meta.entity_id
        if cand_id not in candidate_scores or score > candidate_scores[cand_id]:
            candidate_scores[cand_id] = max(0.0, score)

    # 4. Fetch Candidates applying metadata filters
    candidate_query = db.query(Candidate).filter(Candidate.id.in_(candidate_scores.keys()))
    
    if min_exp is not None:
        logger.info(f"Applying experience filter: >= {min_exp} years")
        candidate_query = candidate_query.filter(Candidate.experience_years >= min_exp)
        
    if location_filter:
        logger.info(f"Applying location filter: '{location_filter}'")
        candidate_query = candidate_query.filter(
            or_(
                Candidate.location.like(f"%{location_filter}%"),
                Candidate.preferred_location.like(f"%{location_filter}%")
            )
        )

    candidates = candidate_query.all()

    # Format results sorted by similarity score
    results = []
    for cand in candidates:
        results.append({
            "candidate": format_candidate_response(cand),
            "score": round(candidate_scores[cand.id] * 100.0, 1) # Convert to percentage
        })

    # Sort descending by score
    results = sorted(results, key=lambda x: x["score"], reverse=True)
    return results[:search_payload.top_k]
