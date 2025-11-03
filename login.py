from huggingface_hub import login
token = input("Enter your Hugging Face token (starts with 'hf_'): ").strip()
login(token=token)
