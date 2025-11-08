from transformers import pipeline
gen = pipeline("token-classification", "lakshyakh93/deberta_finetuned_pii", device=-1)

text = "My name is John and I live in California."
output = gen(text, aggregation_strategy="first")
