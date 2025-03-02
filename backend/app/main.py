import uuid
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import shutil
from datetime import datetime
import random

from app.utils.llm_chat import HPODiagnosisChat

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
        
        # Get file info
        file_info = {
            "original_filename": file.filename,
            "saved_as": unique_filename,
            "content_type": file.content_type,
            "size_in_bytes": os.path.getsize(file_path),
            "patient_id": patient_id,
            "additional_notes": notes
        }

        # TODO update hpo_codes_dict (see get hpo-codes for format)
        
        # Return success response with mock data
        return {
            "success": True,
            "message": f"Successfully processed clinical notes from file: {file.filename}",
            "file_info": file_info,
        }
    
    except Exception as e:
        # If anything goes wrong during upload/processing
        return {
            "success": False,
            "message": f"Error processing file: {str(e)}"
        }
    
# ___________________________ CODE FOR DIAGNOSING ___________________________

# Define a model for Diagnosis
class Diagnosis(BaseModel):
    id: int
    name: str
    probability: str
    details: str

# Define a response model for list of diagnoses
class DiagnosesResponse(BaseModel):
    diagnoses: List[Diagnosis]

# Global dictionary to store diagnoses for each patient
patient_diagnoses: Dict[str, List[Dict[str, Any]]] = {}

# Mock diagnoses data - would normally be generated from HPO codes and clinical notes
default_diagnoses = [
    {"id": 1, "name": "Ehlers-Danlos Syndrome", "probability": "65%", "details": "Connective tissue disorder"},
    {"id": 2, "name": "Marfan Syndrome", "probability": "48%", "details": "Genetic disorder affecting connective tissue"},
    {"id": 3, "name": "Pompe Disease", "probability": "32%", "details": "Rare genetic disorder causing muscle weakness"},
]

@app.get("/diagnoses", response_model=DiagnosesResponse)
async def get_diagnoses():
    # TODO (Isha)
    # use hpo_codes_dict
    return {"diagnoses": default_diagnoses}

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
    # TODO (aaron)
    # use hpo_codes_dict and diagnosis and 20 unknown phenotypes on what to do next
    return {"recommendations": sample_recommendations}


# ___________________________ CODE FOR CHAT FEATURE ___________________________
# Define chat_sessions at the module level before using it
chat_sessions: Dict[str, HPODiagnosisChat] = {}

class Message(BaseModel):
    text: str


class ChatResponse(BaseModel):
    message: str
    session_id: str

# Update the start-chat endpoint
@app.get("/start-chat", response_model=ChatResponse)
async def start_chat(session_id: Optional[str] = None):
    """
    Start or reset a chat with a welcome message.
    If session_id is provided and exists, return that session.
    If not, create a new session.
    """
    global chat_sessions
    
    # If no session_id or session doesn't exist, create a new one
    if not session_id or session_id not in chat_sessions:
        session_id = str(uuid.uuid4())
        chat_sessions[session_id] = HPODiagnosisChat()
    
    # Get the chat instance for this session
    chat_instance = chat_sessions[session_id]
    welcome_message = chat_instance.start_conversation()
    
    return ChatResponse(message=welcome_message, session_id=session_id)

# Update the send-message endpoint
@app.post("/send-message", response_model=ChatResponse)
async def send_message(request_data: dict):
    """
    Send a message to a specific chat session
    """
    message_text = request_data.get("text")
    session_id = request_data.get("session_id")
    
    if not message_text or not session_id:
        raise HTTPException(status_code=400, detail="Missing message text or session ID")
    
    if session_id not in chat_sessions:
        # Create a new session if it doesn't exist
        chat_sessions[session_id] = HPODiagnosisChat()
    
    response = chat_sessions[session_id].process_user_input(message_text)
    return ChatResponse(message=response, session_id=session_id)