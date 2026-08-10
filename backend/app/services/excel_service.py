from datetime import datetime
import pandas as pd
from app.config import settings
from app.utils.logger import logger

class ExcelService:
    def __init__(self):
        self.file_path = settings.excel_file_path
        self.columns = [
            "Candidate ID",
            "Name",
            "Email",
            "Phone",
            "Location",

            "Profession",
            "Industry",
            "Seniority",

            "Experience (Years)",

            "Technical Skills",
            "Soft Skills",
            "Tools",
            "Frameworks",
            "Equipment",
            "Standards",
            "Languages",
            "Methodologies",

            "Education",

            "Current Company",
            "Role",

            "Search Keywords",

            "Resume Summary",

            "Resume Path",
            "Upload Date"
        ]
    def sync_candidate(self, candidate_id: int, candidate_data: dict, resume_path: str):
        """
        Appends or updates a candidate record in Candidates.xlsx.
        Matches by Email to prevent duplicates.
        """
        try:
            # Ensure the directory exists
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Prepare row data
            # Format skills list as comma-separated
            pi = candidate_data.get("personal_information") or {}
            profession = candidate_data.get("profession") or {}
            skills = candidate_data.get("skills") or candidate_data.get("categorized_skills") or {}
            technical_skills = ", ".join(dict.fromkeys(skills.get("technical", [])))
            soft_skills = ", ".join(dict.fromkeys(skills.get("soft", [])))
            tools = ", ".join(dict.fromkeys(skills.get("tools", [])))
            frameworks = ", ".join(dict.fromkeys(skills.get("frameworks", [])))
            equipment = ", ".join(dict.fromkeys(skills.get("equipment", [])))
            standards = ", ".join(dict.fromkeys(skills.get("standards", [])))
            languages = ", ".join(dict.fromkeys(skills.get("languages", [])))
            methodologies = ", ".join(dict.fromkeys(skills.get("methodologies", [])))
            
            # Format education summary
            edu_list = []
            for edu in candidate_data.get("education") or []:
                deg = edu.get("degree", "")
                inst = edu.get("institution", "")
                if deg or inst:
                    edu_list.append(f"{deg} from {inst}")
            edu_str = " | ".join(edu_list)

            row_data = {
                "Candidate ID": candidate_id,
                "Name": pi.get("name") or candidate_data.get("name") or "",
                "Email": pi.get("email") or candidate_data.get("email") or "",
                "Phone": pi.get("phone") or candidate_data.get("phone") or "",
                "Location": pi.get("location") or candidate_data.get("location") or "",

                "Profession": profession.get("category", ""),
                "Industry": profession.get("industry", ""),
                "Seniority": profession.get("seniority", ""),

                "Experience (Years)": profession.get("experience_years", 0),

                "Technical Skills": technical_skills,
                "Soft Skills": soft_skills,
                "Tools": tools,
                "Frameworks": frameworks,
                "Equipment": equipment,
                "Standards": standards,
                "Languages": languages,
                "Methodologies": methodologies,

                "Education": edu_str,

                "Current Company": profession.get("current_company", ""),
                "Role": profession.get("current_role", ""),

                "Search Keywords": ", ".join(
                    candidate_data.get("search_keywords") or []
                ),

                "Resume Summary": candidate_data.get("summary") or "",
                "Resume Path": resume_path,

                "Upload Date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            df_new_row = pd.DataFrame([row_data])

            if self.file_path.exists():
                # Read existing Excel file
                # Add newly introduced columns if opening an old Excel file
                df = pd.read_excel(self.file_path)
                for col in self.columns:
                    if col not in df.columns:
                        df[col] = ""
                    elif col not in ["Candidate ID", "Experience (Years)"]:
                        # Force column to string to prevent float64 dtype issues for empty columns
                        df[col] = df[col].astype(str).replace("nan", "")
                
                # Force columns to proper datatypes to avoid type collisions when updating values
                if "Experience (Years)" in df.columns:
                    df["Experience (Years)"] = (
                        pd.to_numeric(
                            df["Experience (Years)"],
                            errors="coerce"
                        )
                        .fillna(0)
                    )

                if "Candidate ID" in df.columns:
                    df["Candidate ID"] = (
                        pd.to_numeric(
                            df["Candidate ID"],
                            errors="coerce"
                        )
                        .fillna(0)
                        .astype(int)
                    )
                # Check if email exists
                email = row_data["Email"]
                if email and email in df["Email"].values:
                    # Update existing record
                    idx = df[df["Email"] == email].index[0]
                    for col in self.columns:
                        df.at[idx, col] = row_data[col]
                    logger.info(f"Updating candidate {email} in Candidates.xlsx")
                else:
                    # Append new record
                    df = pd.concat([df, df_new_row], ignore_index=True)
                    logger.info(f"Appending new candidate {email} to Candidates.xlsx")
                
                # Save to Excel
                df = df[self.columns]
                df.to_excel(self.file_path, index=False)
            else:
                # Create new spreadsheet
                logger.info(f"Creating Candidates.xlsx at {self.file_path}")
                df_new_row.to_excel(self.file_path, index=False)
                
        except Exception as e:
            logger.error(f"Failed to sync candidate to Excel sheet: {e}")
            # Do not raise error to avoid breaking the background task pipeline
        finally:
            import gc
            if 'df' in locals():
                del df
            if 'df_new_row' in locals():
                del df_new_row
            gc.collect()
