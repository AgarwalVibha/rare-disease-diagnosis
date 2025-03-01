from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import shutil
from datetime import datetime
import random
# ___________________________ CODE FOR SETTING UP THE API ___________________________
app = FastAPI()

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    return {"Hello": "World"}


    # ___________________________ CODE FOR UPLOADING CLINICAL NOTES ___________________________
# Model for clinical notes analysis response
class ClinicalAnalysisResponse(BaseModel):
    success: bool
    message: str
    file_info: Optional[Dict[str, Any]] = None
    potential_diagnoses: Optional[List[Dict[str, Any]]] = None
    recommendations: Optional[List[Dict[str, Any]]] = None

# Ensure uploads directory exists
UPLOAD_DIR = "app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/clinical-notes", response_model=ClinicalAnalysisResponse)
async def upload_clinical_notes(
    file: UploadFile = File(...),
    patient_id: Optional[str] = Form(None),
    notes: Optional[str] = Form(None)
):
    try:
        # Generate a unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{timestamp}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save the uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Get file information
        file_info = {
            "original_filename": file.filename,
            "saved_as": unique_filename,
            "content_type": file.content_type,
            "size_in_bytes": os.path.getsize(file_path),
            "patient_id": patient_id,
            "additional_notes": notes
        }
        
        # In a real application, you would process the clinical notes here
        # For demonstration, we'll return mock diagnoses based on the file
        mock_diagnoses = [
            {"id": 1, "name": "Ehlers-Danlos Syndrome", "probability": "65%", "details": "Connective tissue disorder"},
            {"id": 2, "name": "Marfan Syndrome", "probability": "48%", "details": "Genetic disorder affecting connective tissue"},
            {"id": 3, "name": "Pompe Disease", "probability": "32%", "details": "Rare genetic disorder causing muscle weakness"},
        ]
        
        # Return success response with mock data
        return {
            "success": True,
            "message": f"Successfully processed clinical notes from file: {file.filename}",
            "file_info": file_info,
            "potential_diagnoses": mock_diagnoses,
            "recommendations": sample_recommendations
        }
    
    except Exception as e:
        # If anything goes wrong during upload/processing
        return {
            "success": False,
            "message": f"Error processing file: {str(e)}"
        }
    

# ___________________________ CODE FOR UPLOADING AND GETTING HPO TERMS ___________________________
# Add these models and global dictionary for HPO codes

# Define a model for HPO Code
class HPOCode(BaseModel):
    id: str  # HPO ID format (e.g., "HP:0001382")
    name: str  # Term name (e.g., "Joint hypermobility")
    source: Optional[str] = None  # Source of identification (e.g., "Clinical notes", "Chat")

# Define a response model for HPO codes
class HPOCodesResponse(BaseModel):
    codes: List[HPOCode]

# Global dictionary to store HPO codes
hpo_codes_dict: Dict[str, HPOCode] = {}


# TODO: Replace this with actual lookup from HPO data file
def lookup_hpo_name(hpo_id: str) -> str:
    """
    Look up the name of an HPO term based on its ID.
    
    Args:
        hpo_id: HPO ID in the format "HP:0000123"
        
    Returns:
        The name of the HPO term
    """
    # Placeholder function that returns random names
    # This will be replaced with actual lookup logic from HPO data file
    
    sample_names = [
        "Joint hypermobility",
        "Abnormal joint mobility",
        "Joint pain",
        "Fatigue",
        "Muscular hypotonia",
        "Recurrent joint dislocations",
        "Skin hyperextensibility",
        "Delayed gross motor development",
        "Poor coordination",
        "Easy bruising"
    ]
    
    return random.choice(sample_names)

# Update the add_hpo_codes endpoint to use the lookup function
@app.post("/hpo-codes", response_model=HPOCodesResponse)
async def add_hpo_codes(codes: List[HPOCode]):
    """
    Add a list of HPO codes
    """
    # Add each code to the global dictionary, using ID as key to avoid duplicates
    for code in codes:
        # Only lookup the name if it's the placeholder
        code.name = lookup_hpo_name(code.id)
        
        hpo_codes_dict[code.id] = code
    
    # Return all codes
    return {"codes": list(hpo_codes_dict.values())}

@app.get("/hpo-codes", response_model=HPOCodesResponse)
async def get_hpo_codes():
    """
    Get all HPO codes
    """
    return {"codes": list(hpo_codes_dict.values())}

# ___________________________ CODE FOR RECOMMENDATIONS ___________________________
# Define a model for Recommendation
class Recommendation(BaseModel):
    id: int
    type: str  # 'Specialist' or 'Lab Test'
    title: str
    urgency: str  # 'High', 'Medium', 'Low'

# Define a response model for list of recommendations
class RecommendationsResponse(BaseModel):
    recommendations: List[Recommendation]


# Sample recommendations data
sample_recommendations = [
    {"id": 1, "type": "Specialist", "title": "Geneticist Consultation", "urgency": "High"},
    {"id": 2, "type": "Lab Test", "title": "Advanced Genetic Panel", "urgency": "Medium"},
    {"id": 3, "type": "Specialist", "title": "Cardiologist Follow-up", "urgency": "Medium"},
]

# GET route to fetch all recommendations
@app.get("/recommendations", response_model=RecommendationsResponse)
async def get_recommendations():

    return {"recommendations": sample_recommendations}
