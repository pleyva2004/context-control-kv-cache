from gliner import GLiNER
# 1. Define our new text
text = "Hi support, I can't log in! My account username is 'johndoe88'. Every time I try, it says 'invalid credentials'. Please reset my password. You can reach me at (555) 123-4567 or johnd@example.com"

# 2. Define the labels we're hunting for.
labels = ["email", "phone_number", "user_name"]

# 3. Load the PII model
model = GLiNER.from_pretrained("nvidia/gliner-pii")

# 4. Run the prediction at given threshold
entities = model.predict_entities(text, labels, threshold=0.5)
