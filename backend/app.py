from dataclasses import dataclass, asdict
from typing import Tuple, List, Dict, Any
from time import time
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from llama_cpp import Llama


LLM = Llama(
    model_path="../models/Llama-3.2-3B-Instruct-Q4_K_M.gguf",
    n_ctx=4096,
    n_gpu_layers=32,
    verbose=False
)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@dataclass(frozen=True)
class Message:
    text: str
    tokens: Tuple[int, ...]
    spans: Tuple[Tuple[int, int], ...]
    created: float
    kv_state: bytes  # serialized KV-cache snapshot

MESSAGE_STORE: Dict[str, Dict[str, Any]] = {}



class ChatRequest(BaseModel):
    system: str = (
        "You are a helpful tutor focused on helping undergrads understand "
        "concepts intuitively with concise examples."
    )
    user: str
    history: List[str] = []  # list of message_ids (optional context chain)


class FocusRequest(BaseModel):
    message_id: str
    char_start: int
    char_end: int
    followup: str
    system: str = "You are a helpful, concise assistant focused on the provided excerpt."



def _sse(data: Dict[str, Any]):
    return json.dumps(data) + "\n"



@app.post("/generate")
async def generate(req: ChatRequest):
    """
    Generates a new root or continuation message.
    Stores its KV-cache so we can later branch/focus from it.
    """

    # Construct the conversation prompt
    system = req.system
    user = req.user
    prompt = f"<|system|>\n{system}\n<|user|>\n{user}\n<|assistant|>\n"

    acc_text, tokens, spans = [], [], []
    curr_len = 0

    def stream():
        nonlocal curr_len
        start_time = time()

        for out in LLM.create_completion(
            prompt=prompt,
            max_tokens=768,
            temperature=0.4,
            top_p=0.95,
            stream=True,
        ):
            choice = out["choices"][0]
            piece = choice.get("text", "")
            if not piece:
                continue

            acc_text.append(piece)
            start = curr_len
            curr_len += len(piece.encode("utf-8"))
            end = curr_len
            spans.append((start, end))
            tokens.append(choice.get("token", -1))

            yield _sse({
                "piece": piece,
                "pos": [start, end],
                "elapsed_ms": int(1000 * (time() - start_time))
            })

        # Done
        full_text = "".join(acc_text)
        message_id = f"m_{int(time() * 1000)}"

        # Save KV state AFTER generation (preserves the full conversation context)
        kv_state = LLM.save_state()

        MESSAGE_STORE[message_id] = asdict(Message(
            text=full_text,
            tokens=tuple(tokens),
            spans=tuple(spans),
            created=time(),
            kv_state=kv_state,
        ))

        yield _sse({
            "done": True,
            "message_id": message_id,
            "full_text": full_text
        })

    return StreamingResponse(stream(), media_type="text/event-stream")


@app.post("/focus")
async def focus(req: FocusRequest):
    """
    Loads the KV-cache of a prior message, then continues from that context
    with a focused follow-up prompt.
    """
    rec = MESSAGE_STORE.get(req.message_id)
    if not rec:
        return JSONResponse({"error": "unknown message_id"}, status_code=404)

    # Restore prior KV cache to continue seamlessly
    LLM.load_state(rec["kv_state"])

    # Extract the focused text
    excerpt = rec["text"][req.char_start:req.char_end].strip()
    if not excerpt:
        return JSONResponse({"error": "empty excerpt"}, status_code=400)

    # Build new prompt (branch)
    prompt = (
        f"<|system|>\n{req.system}\n"
        f"<|context|>\n{excerpt}\n"
        f"<|user|>\n{req.followup}\n"
        f"<|assistant|>\n"
    )

    acc_text, tokens, spans = [], [], []
    curr_len = 0

    def stream():
        nonlocal curr_len
        start_time = time()
        for out in LLM.create_completion(
            prompt=prompt,
            max_tokens=512,
            stream=True,
            temperature=0.3,
            top_p=0.95,
        ):
            piece = out["choices"][0].get("text", "")
            if not piece:
                continue
            
            acc_text.append(piece)
            start = curr_len
            curr_len += len(piece.encode("utf-8"))
            end = curr_len
            spans.append((start, end))
            tokens.append(out["choices"][0].get("token", -1))

            yield _sse({
                "piece": piece,
                "elapsed_ms": int(1000 * (time() - start_time))
            })

        # Save the focused message
        full_text = "".join(acc_text)
        message_id = f"m_{int(time() * 1000)}"
        kv_state = LLM.save_state()

        MESSAGE_STORE[message_id] = asdict(Message(
            text=full_text,
            tokens=tuple(tokens),
            spans=tuple(spans),
            created=time(),
            kv_state=kv_state,
        ))
        MESSAGE_STORE[message_id]["parent_id"] = req.message_id

        yield _sse({
            "done": True,
            "message_id": message_id,
            "full_text": full_text
        })

    return StreamingResponse(stream(), media_type="text/event-stream")


@app.post("/continue")
async def continue_conversation(req: ChatRequest):

    # Last message in history determines where to continue from
    if not req.history:
        return JSONResponse({"error": "history missing or empty"}, status_code=400)

    parent_id = req.history[-1]
    rec = MESSAGE_STORE.get(parent_id)
    if not rec:
        return JSONResponse({"error": "unknown message_id"}, status_code=404)

    # Restore prior KV state
    LLM.load_state(rec["kv_state"])

    # Append new user turn
    user_turn = f"\n<|user|>\n{req.user}\n<|assistant|>\n"

    acc_text, tokens, spans = [], [], []
    curr_len = 0

    def stream():
        nonlocal curr_len
        start_time = time()

        # Evaluate the new turn
        user_ids = LLM.tokenize(user_turn.encode("utf-8"), add_bos=False)
        LLM.eval(user_ids)

        # Stream model completion
        # Use empty string since we've already evaluated the user turn into KV cache
        for out in LLM.create_completion(
            prompt="",   # Empty prompt = continue from current KV state (user turn already evaluated)
            max_tokens=768,
            temperature=0.4,
            top_p=0.95,
            stream=True,
        ):
            piece = out["choices"][0].get("text", "")
            if not piece:
                continue

            acc_text.append(piece)
            start = curr_len
            curr_len += len(piece.encode("utf-8"))
            end = curr_len
            spans.append((start, end))
            tokens.append(out["choices"][0].get("token", -1))

            yield json.dumps({
                "piece": piece,
                "pos": [start, end],
                "elapsed_ms": int(1000 * (time() - start_time))
            }) + "\n"

        # Save the continuation as a new message node
        full_text = "".join(acc_text)
        message_id = f"m_{int(time() * 1000)}"
        kv_state = LLM.save_state()

        MESSAGE_STORE[message_id] = asdict(Message(
            text=full_text,
            tokens=tuple(tokens),
            spans=tuple(spans),
            created=time(),
            kv_state=kv_state,
        ))
        MESSAGE_STORE[message_id]["parent_id"] = parent_id  # for tree view

        yield json.dumps({
            "done": True,
            "message_id": message_id,
            "full_text": full_text
        }) + "\n"

    return StreamingResponse(stream(), media_type="text/event-stream")
