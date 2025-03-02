import os
import json
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set the API key
openai.api_key = os.environ.get("OPENAI_API_KEY")

class HPODiagnosisChat:
    def __init__(self):
        self.conversation_history = []
        self.identified_hpo_codes = []
        self.current_state = "initial"  # States: initial, gathering_symptoms, verifying_hpo, concluded
        
    def add_message(self, role, content):
        """Add a message to the conversation history"""
        self.conversation_history.append({"role": role, "content": content})
        
    def get_conversation_context(self):
        """Get the recent conversation history to provide as context"""
        # Use the last 10 messages to keep context manageable
        return self.conversation_history[-10:] if len(self.conversation_history) > 10 else self.conversation_history
    
    def start_conversation(self):
        """Start the diagnostic conversation"""
        welcome_message = (
            "Hello! I'm here to help identify potential rare disease phenotypes based on your symptoms. "
            "Please describe what symptoms you're experiencing in as much detail as possible."
        )
        self.add_message("assistant", welcome_message)
        self.current_state = "gathering_symptoms"
        return welcome_message
    
    def process_user_input(self, user_input):
        """Process user input and determine the next response"""
        self.add_message("user", user_input)
        
        if self.current_state == "gathering_symptoms":
            return self.analyze_symptoms(user_input)
        elif self.current_state == "verifying_hpo":
            return self.verify_hpo_codes(user_input)
        elif self.current_state == "asking_followup":
            return self.process_followup_response(user_input)
        else:
            return "I'm not sure what to do next. Could you describe your symptoms again?"
    
    def analyze_symptoms(self, symptoms_description):
        """Analyze symptoms and identify potential HPO codes"""
        context = self._create_symptom_analysis_prompt(symptoms_description)
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4-turbo",
                temperature=0.3,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are a medical assistant specializing in rare diseases and HPO classification. Your task is to identify potential HPO codes based on patient-reported symptoms."},
                    {"role": "user", "content": context}
                ]
            )
            
            result = json.loads(response.choices[0].message.content)
            self.identified_hpo_codes = result.get("identified_hpo_codes", [])
            followup_questions = result.get("follow_up_questions", [])
            
            # Create a summary response
            response_text = "Based on your description, I've identified some potential phenotypes:\n\n"
            
            for i, hpo in enumerate(self.identified_hpo_codes):
                response_text += f"{i+1}. {hpo.get('hpo_name')} ({hpo.get('hpo_code')}) - {hpo.get('confidence')} confidence\n"
                response_text += f"   Rationale: {hpo.get('rationale')}\n\n"
            
            if followup_questions:
                response_text += "\nTo narrow down further, I'd like to ask:\n"
                response_text += followup_questions[0]
                self.current_state = "asking_followup"
                self.current_followup_questions = followup_questions
                self.current_followup_index = 0
            else:
                self.current_state = "verifying_hpo"
                response_text += "\nDo any of these phenotypes seem to match your condition? Or would you like me to analyze further?"
            
            self.add_message("assistant", response_text)
            return response_text
            
        except Exception as e:
            error_msg = f"I encountered an issue analyzing your symptoms. Could you provide more details about what you're experiencing?"
            self.add_message("assistant", error_msg)
            return error_msg
    
    def process_followup_response(self, user_input):
        """Process the user's response to a follow-up question"""
        # If we have more follow-up questions, ask the next one
        if hasattr(self, 'current_followup_questions') and hasattr(self, 'current_followup_index'):
            self.current_followup_index += 1
            
            if self.current_followup_index < len(self.current_followup_questions):
                next_question = self.current_followup_questions[self.current_followup_index]
                self.add_message("assistant", next_question)
                return next_question
            else:
                # Re-analyze with all the new information
                all_symptoms = "\n".join([msg["content"] for msg in self.conversation_history if msg["role"] == "user"])
                return self.analyze_symptoms(all_symptoms)
        else:
            return self.analyze_symptoms(user_input)
    
    def verify_hpo_codes(self, user_input):
        """Verify the identified HPO codes based on user feedback"""
        lower_input = user_input.lower()
        
        # Check if the user is confirming any of the identified phenotypes
        if any(word in lower_input for word in ["yes", "correct", "that's right", "sounds like", "matches"]):
            # Ask specific verification questions for the most likely HPO
            if self.identified_hpo_codes:
                top_hpo = self.identified_hpo_codes[0]
                return self.get_hpo_verification_questions(top_hpo.get("hpo_code"), top_hpo.get("hpo_name"))
            else:
                return "I don't have enough information yet. Could you tell me more about your symptoms?"
        else:
            # User didn't confirm, go back to symptom gathering
            response = "Let's look at this differently. Could you provide more details about your symptoms, especially any changes or specific circumstances when they occur?"
            self.current_state = "gathering_symptoms"
            self.add_message("assistant", response)
            return response
    
    def get_hpo_verification_questions(self, hpo_code, hpo_name):
        """Get verification questions for a specific HPO code"""
        try:
            result = self._generate_verification_questions(hpo_code, hpo_name)
            
            response_text = f"Let's verify if {hpo_name} matches your condition.\n\n"
            response_text += f"{result.get('layman_description')}\n\n"
            
            for question in result.get("verification_questions", []):
                response_text += f"- {question}\n"
            
            self.current_state = "verifying_hpo"
            self.add_message("assistant", response_text)
            return response_text
            
        except Exception as e:
            error_msg = f"I'm having trouble generating specific questions about {hpo_name}. Could you tell me more about your symptoms instead?"
            self.add_message("assistant", error_msg)
            return error_msg
    
    def _generate_verification_questions(self, hpo_code, hpo_name):
        """Generate questions to verify if a patient has a specific HPO phenotype"""
        prompt = f"""
        I need to verify if a patient has the following HPO phenotype:
        HPO Code: {hpo_code}
        Term: {hpo_name}
        
        1. Translate this HPO term into simple, layman-friendly language
        2. Generate 1-3 specific questions to ask the patient that would help identify if they have this phenotype
        3. Return your response as a JSON object with the following structure:
        {{
            "hpo_code": "{hpo_code}",
            "hpo_name": "{hpo_name}",
            "layman_description": "Simple explanation of the condition",
            "verification_questions": [
                "Question 1?",
                "Question 2?",
                "Question 3?"
            ]
        }}
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-4-turbo",
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a medical assistant specializing in rare diseases and HPO classification. Your task is to translate medical terminology into patient-friendly language and create targeted questions."},
                {"role": "user", "content": prompt}
            ]
        )
        
        return json.loads(response.choices[0].message.content)
    
    def _create_symptom_analysis_prompt(self, symptoms_description):
        """Create a prompt for symptom analysis that includes conversation context"""
        # Get recent user messages to provide context
        recent_user_messages = [msg["content"] for msg in self.conversation_history 
                               if msg["role"] == "user"][-3:]
        combined_symptoms = "\n".join(recent_user_messages)
        
        return f"""
        The patient describes their symptoms as: 
        
        "{combined_symptoms}"
        
        1. Identify the most likely HPO codes that match these symptoms (up to 3)
        2. For each potential HPO code, provide:
           a. The HPO code
           b. The HPO term name
           c. Confidence level (high/medium/low)
           d. Brief rationale for why this HPO code matches the symptoms
        3. Suggest 1-3 follow-up questions that would help narrow down the possibilities
        4. Return your assessment as a JSON object with the following structure:
        {{
            "identified_hpo_codes": [
                {{
                    "hpo_code": "HP:XXXXXXX",
                    "hpo_name": "Term name",
                    "confidence": "high/medium/low",
                    "rationale": "Brief explanation"
                }},
                ...
            ],
            "follow_up_questions": [
                "Question 1?",
                "Question 2?",
                "Question 3?"
            ]
        }}
        """