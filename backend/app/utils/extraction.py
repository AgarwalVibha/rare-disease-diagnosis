import subprocess
import tempfile
import os


def parse_note_to_hpo(user_input_text=None, file_path=None, original_hpo_dict=None):
    """
    Uses ClinPhen to extract HPO terms from either:
    - A clinical note provided as a text string.
    - A .txt file uploaded by the user.

    :param user_input_text: Optional string containing user-typed input.
    :param file_path: Optional path to a .txt file uploaded by the user.
    :param original_hpo_dict: Optional dictionary to accumulate extracted HPO terms.
    :return: A dictionary of extracted HPO codes and their corresponding details.
    """
    if original_hpo_dict is None:
        original_hpo_dict = {}
    if not user_input_text and not file_path:
        raise ValueError("Either user_input_text or file_path must be provided.")

    if file_path:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                user_input_text = f.read()
        except Exception as e:
            print(f"Error reading file: {e}")
            return {}

    with tempfile.NamedTemporaryFile(delete=False, mode='w', suffix=".txt") as temp_file:
        temp_file.write(user_input_text)
        temp_file_path = temp_file.name  

    clinphen_cmd = ["clinphen", temp_file_path]
    process = subprocess.Popen(
        clinphen_cmd,
        stdout=subprocess.PIPE,  
        stderr=subprocess.PIPE,  
        text=True
    )

    stdout, stderr = process.communicate()

    # # Debugging: Print ClinPhen output
    # print("ClinPhen stdout:", stdout)
    # print("ClinPhen stderr:", stderr)

    os.remove(temp_file_path)

    if process.returncode != 0:
        print("ClinPhen Error:", stderr)
        return {}

    # Process each line of output to extract HPO terms
    for line in stdout.split("\n"):
        if line.startswith("HP:"):  
            parts = line.split("\t")  
            if len(parts) >= 2:  
                hpo_id = parts[0].strip()
                symptom_name = parts[1].strip()
                original_hpo_dict[hpo_id] = {
                    "id": hpo_id,
                    "name": symptom_name,
                    "source": "Clinical notes"
                }

    return original_hpo_dict



# ===================================
# 🧪 LOCAL TEST CASES
# ===================================
# if __name__ == "__main__":
#     print("\n🔹 Running Local Tests for parse_note_to_hpo...\n")

#     # Test 1: Simulate User Input from the Chat
#     user_text = "The patient experiences severe headaches and blurred vision."
#     print("📝 Test Case 1: User Input")
#     hpo_results_text = parse_note_to_hpo(user_input_text=user_text)
#     print("Extracted HPO Codes and Symptoms:", hpo_results_text)
#     print("\n" + "="*50 + "\n")

#     # Test 2: Simulate Uploaded File Input
#     test_file_path = "test_clinical_notes.txt"
#     with open(test_file_path, "w", encoding="utf-8") as f:
#         f.write("Patient has chronic joint pain and muscle weakness.")

#     print("📂 Test Case 2: File Upload")
#     hpo_results_file = parse_note_to_hpo(file_path=test_file_path)
#     print("Extracted HPO Codes and Symptoms:", hpo_results_file)

#     # Cleanup test file
#     os.remove(test_file_path)

#     print("\n✅ All Local Tests Completed Successfully!\n")