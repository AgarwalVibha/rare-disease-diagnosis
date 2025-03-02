import uuid
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import shutil
import logging
from datetime import datetime
import random
from app.utils.extraction import parse_note_to_hpo
from app.utils.diagnosing import diagnose_helper
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
    hpo_codes_to_names = {
        "HP:0001065": "Atrophic scarring",
        "HP:0011675":"Arrhythmia",
        "HP:0001382": "Joint hypermobility",
    }
    
    # sample_names = [
    #     "Joint hypermobility",
    #     "Abnormal joint mobility",
    #     "Joint pain",
    #     "Fatigue",
    #     "Muscular hypotonia",
    #     "Recurrent joint dislocations",
    #     "Skin hyperextensibility",
    #     "Delayed gross motor development",
    #     "Poor coordination",
    #     "Easy bruising"
    # ]
    
    # return random.choice(sample_names)
    return hpo_codes_to_names[hpo_id]

# Update the add_hpo_codes endpoint to use the lookup function
@app.post("/hpo-codes", response_model=HPOCodesResponse)
async def add_hpo_codes(codes: List[HPOCode]):
    """
    Add a list of HPO codes
    """
    # Add each code to the global dictionary, using ID as key to avoid duplicates
    global hpo_codes_dict
    print(codes)
    for code in codes:
        # Only lookup the name if it's the placeholder
        print(code)
        code.name = lookup_hpo_name(code.id)
        print(code)
        
        hpo_codes_dict[code.id] = code
    
    # Return all codes
    return {"codes": list(hpo_codes_dict.values())}

logger = logging.getLogger(__name__)

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
    # update hpo_codes_dict 
    try:
        # Reset the global dictionary for each new upload
        hpo_codes_dict.clear()

        # Read and decode the uploaded file
        contents = await file.read()
        text = contents.decode("utf-8")

        
        # Extract HPO terms using the parse_note_to_hpo function which returns a dict
        extracted_hpo = parse_note_to_hpo(user_input_text=text)

        # # Debugging: Print extracted HPO terms
        # print("Extracted HPO terms:", extracted_hpo)
        
        # Update the global hpo_codes_dict with the extracted HPO terms
        for hpo_id, hpo_data in extracted_hpo.items():
            hpo_codes_dict[hpo_id] = hpo_data
        
        # # Debugging: Print updated hpo_codes_dict
        # print("Updated hpo_codes_dict:", hpo_codes_dict)
        
        return {
            "success": True,
            "message": "Clinical notes processed successfully.",
            "file_info": {"filename": file.filename, "size": len(contents)},
            "extracted_hpo": [{"id": hpo_id, "name": hpo_data["name"]} for hpo_id, hpo_data in extracted_hpo.items()]
        }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Error processing file: {str(e)}",
            "file_info": None
        }
    
# ___________________________ CODE FOR DIAGNOSING ___________________________

# Enhanced diagnoses model with additional useful columns
class Diagnosis(BaseModel):
    id: int
    name: str
    probability: str
    details: str
    symptoms: str
    orpha_code: str
    inheritance: str
    prevalence: str
    specialist: str
    key_tests: str


# Define a response model for list of diagnoses
class DiagnosesResponse(BaseModel):
    diagnoses: List[Diagnosis]

# Global dictionary to store diagnoses for each patient
patient_diagnoses: Dict[str, List[Dict[str, Any]]] = {}

# Mock diagnoses data - would normally be generated from HPO codes and clinical notes
default_diagnoses_demo = [
    {
        "id": 1, 
        "name": "Ehlers-Danlos Syndrome (Hypermobility Type)", 
        "probability": "87%", 
        "details": "Connective tissue disorder affecting collagen production",
        "symptoms": "Joint hypermobility, skin elasticity, easy bruising",
        "orpha_code": "ORPHA98249",
        "inheritance": "Autosomal dominant",
        "prevalence": "1-5/10,000",
        "specialist": "Geneticist, Rheumatologist",
        "key_tests": "Genetic panel, Beighton score, skin biopsy"
    },
    {
        "id": 2, 
        "name": "Gaucher Disease (Type 1)", 
        "probability": "76%", 
        "details": "Lysosomal storage disorder with glucocerebroside accumulation",
        "symptoms": "Hepatosplenomegaly, bone pain, thrombocytopenia",
        "orpha_code": "ORPHA355",
        "inheritance": "Autosomal recessive",
        "prevalence": "1/40,000 - 1/60,000",
        "specialist": "Hematologist, Geneticist",
        "key_tests": "Glucocerebrosidase enzyme assay, GBA gene test"
    },
    {
        "id": 3, 
        "name": "Fabry Disease", 
        "probability": "65%", 
        "details": "X-linked lysosomal storage disorder affecting glycosphingolipid metabolism",
        "symptoms": "Neuropathic pain, angiokeratomas, renal dysfunction",
        "orpha_code": "ORPHA324",
        "inheritance": "X-linked",
        "prevalence": "1/40,000 - 1/117,000",
        "specialist": "Cardiologist, Nephrologist",
        "key_tests": "α-galactosidase A activity, GLA gene test"
    },
    {
        "id": 4, 
        "name": "Marfan Syndrome", 
        "probability": "58%", 
        "details": "Genetic disorder affecting the body's connective tissue and fibrillin-1 protein",
        "symptoms": "Tall stature, aortic dilation, lens dislocation",
        "orpha_code": "ORPHA558",
        "inheritance": "Autosomal dominant",
        "prevalence": "1/5,000",
        "specialist": "Cardiologist, Ophthalmologist",
        "key_tests": "Echocardiogram, FBN1 gene test, eye exam"
    },
    {
        "id": 5, 
        "name": "Stiff Person Syndrome", 
        "probability": "42%", 
        "details": "Rare autoimmune neurological disorder affecting GABAergic neurons",
        "symptoms": "Muscle rigidity, painful spasms, heightened startle",
        "orpha_code": "ORPHA3198",
        "inheritance": "Acquired (autoimmune)",
        "prevalence": "< 1/1,000,000",
        "specialist": "Neurologist, Immunologist",
        "key_tests": "Anti-GAD65 antibody test, EMG, lumbar puncture"
    }
]

@app.get("/diagnoses", response_model=DiagnosesResponse)
async def get_diagnoses():
    """Diagnose based on the uploaded HPO terms using the Phrank algorithm."""

    # Convert the stored HPO dictionary into a list of phenotype IDs
    phenotype_list = list(hpo_codes_dict.keys())

    if not phenotype_list:
        return {"diagnoses": []}

    # diagnose using Phrank scoring
    # diagnoses = diagnose_helper(phenotype_list)
    
    diagnoses = default_diagnoses_demo # for demo

    return {"diagnoses": diagnoses}

# ___________________________ CODE FOR RECOMMENDATIONS ___________________________
# Define a model for Recommendation
class Recommendation(BaseModel):
    id: int
    type: str  # 'Specialist', 'Lab Test', 'Imaging', or 'Genetic'
    title: str
    urgency: str  # 'High', 'Medium', 'Low'
    details: str
    related_diagnosis: Optional[str] = None
    estimated_cost: Optional[str] = None
    insurance_notes: Optional[str] = None

# Define a response model for list of recommendations
class RecommendationsResponse(BaseModel):
    recommendations: List[Recommendation]


# Enhanced recommendations data with more details and aligned with our rare disease diagnoses
sample_recommendations = [
    {
        "id": 1, 
        "type": "Specialist", 
        "title": "Geneticist Consultation", 
        "urgency": "High",
        "details": "Comprehensive evaluation to assess for connective tissue disorders including Ehlers-Danlos and Marfan syndromes",
        "related_diagnosis": "Ehlers-Danlos Syndrome (Hypermobility Type)",
        "estimated_cost": "$300-500",
        "insurance_notes": "Requires referral for most insurance plans"
    },
    {
        "id": 2, 
        "type": "Genetic", 
        "title": "Connective Tissue Gene Panel", 
        "urgency": "Medium",
        "details": "Comprehensive genetic testing for mutations in COL5A1, COL5A2, FBN1, and other genes related to connective tissue disorders",
        "related_diagnosis": "Ehlers-Danlos Syndrome (Hypermobility Type), Marfan Syndrome",
        "estimated_cost": "$1,500-3,000",
        "insurance_notes": "May require pre-authorization and genetic counseling"
    },
    {
        "id": 3, 
        "type": "Imaging", 
        "title": "Echocardiogram", 
        "urgency": "High",
        "details": "Evaluate for aortic root dilation, mitral valve prolapse, and other cardiac abnormalities associated with connective tissue disorders",
        "related_diagnosis": "Marfan Syndrome, Ehlers-Danlos Syndrome (Hypermobility Type)",
        "estimated_cost": "$1,000-2,500",
        "insurance_notes": "Generally covered with appropriate diagnosis codes"
    }
]

# GET route to fetch all recommendations
@app.get("/recommendations", response_model=RecommendationsResponse)
async def get_recommendations():
    """Return recommendations based on the HPO terms in the system.
    Will only return recommendations if there are HPO terms entered (similar to diagnoses)
    """
    # Check if there are any HPO codes in the system
    if not hpo_codes_dict:
        # No HPO codes entered yet, return empty list
        return {"recommendations": []}
    
    # Return only the top 3 recommendations
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
