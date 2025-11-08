(cd backend && uvicorn app:app --reload --port 8080) &
(cd frontend && python -m http.server 5173) &
wait
