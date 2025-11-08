from llama_cpp import Llama
import json


LLM = Llama(
    model_path="./models/Llama-3.2-3B-Instruct-Q4_K_M.gguf",
    n_ctx=4096*2,
    n_gpu_layers=32,
    verbose=False
)

file = open("text.txt", "r")
text_content = file.read()
file.close()

# Define JSON schema to force valid JSON output
json_schema = {
    "type": "object",
    "properties": {
        "spans": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "start": {"type": "integer"},
                    "end": {"type": "integer"},
                    "type": {"type": "string"}
                },
                "required": ["start", "end", "type"]
            }
        }
    },
    "required": ["spans"]
}

# Use create_chat_completion with response_format for JSON schema enforcement
response = LLM.create_chat_completion(
    messages=[
        {
            "role": "system",
            "content": (
                "You are a helpful assistant that identifies private information in text. "
                "You must respond ONLY with valid JSON in this exact format:\n"
                '{"spans": [{"start": 0, "end": 10, "type": "name"}, ...]}\n'
                "The spans should identify locations of private information like names, addresses, phone numbers, etc."
            )
        },
        {
            "role": "user",
            "content": text_content
        }
    ],
    temperature=0.4,
    top_p=0.95,
    response_format={
        "type": "json_object",
        "schema": json_schema
    }
)
raw_text = response["choices"][0]["message"]["content"]

print("Raw LLM response:")
print(raw_text)
print("\n" + "="*50 + "\n")

try:
    parsed_response = json.loads(raw_text)
except json.JSONDecodeError as e:
    print(f"Failed to parse JSON: {e}")
    print("Attempting to extract JSON from response...")
    # Try to find JSON in the response
    import re
    json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
    if json_match:
        parsed_response = json.loads(json_match.group())
    else:
        print("No JSON found in response. Exiting.")
        exit(1)


# Using the spans provided in parsed_response, remove private information from the original file content
print("Identified private information spans:")
print(json.dumps(parsed_response, indent=2))
print("\n" + "="*50 + "\n")

# New prompt for Llama: ask directly for a version of the document with private info redacted
print("Generating redacted document...")

response = LLM.create_chat_completion(
    messages=[
        {
            "role": "system",
            "content": (
                "You are a helpful assistant. Remove all private information from the document below. "
                "Where content is removed, insert '[REDACTED]'. Respond only with the sanitized document, "
                "no explanations or additional text."
            )
        },
        {
            "role": "user",
            "content": text_content
        }
    ],
    max_tokens=2048,
    temperature=0.4,
    top_p=0.95
)
redacted_doc = response["choices"][0]["message"]["content"]

print("Redacted document:\n", redacted_doc)