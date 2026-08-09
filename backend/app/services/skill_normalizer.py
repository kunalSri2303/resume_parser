import json
from pathlib import Path
from app.utils.logger import logger

class SkillNormalizer:
    def __init__(self):
        self.mapping_file = Path(__file__).resolve().parent.parent / "utils" / "skills_mapping.json"
        self.aliases = {}
        self.load_mapping()

    def load_mapping(self):
        """Loads the aliases mapping configuration from json file."""
        try:
            if self.mapping_file.exists():
                with open(self.mapping_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.aliases = data.get("aliases", {})
                logger.info(f"Loaded {len(self.aliases)} skill alias mappings.")
            else:
                logger.warning(f"Skills mapping file not found at {self.mapping_file}. Using empty mapping.")
        except Exception as e:
            logger.error(f"Error loading skill alias mapping: {e}")
            self.aliases = {}

    def normalize_skill(self, skill_name: str) -> str:
        """Normalizes a single skill name to its canonical form."""
        if not skill_name:
            return ""
        
        # Clean the input name
        cleaned_name = skill_name.strip().lower()
        
        # 1. Exact match in aliases mapping
        if cleaned_name in self.aliases:
            return self.aliases[cleaned_name]
        
        # 2. String cleaning replacements (e.g. removing dashes/spaces and checking again)
        simplified = cleaned_name.replace(" ", "").replace("-", "").replace(".", "")
        if simplified in self.aliases:
            return self.aliases[simplified]
            
        # 3. Capitalize words as fallback for unknown skills
        cleaned_fallback = skill_name.replace("-", " ").replace("_", " ")
        words = cleaned_fallback.split()
        capitalized = " ".join(w.capitalize() for w in words)
        return capitalized

    def normalize_skills(self, skills: list[str]) -> list[str]:
        """Normalizes a list of skill strings, removing duplicates and empty values."""
        if not skills:
            return []
        
        normalized_set = set()
        for skill in skills:
            normalized = self.normalize_skill(skill)
            if normalized:
                normalized_set.add(normalized)
                
        return sorted(list(normalized_set))
