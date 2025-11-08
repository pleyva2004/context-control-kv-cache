const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamChunk {
  choices: Array<{
    delta: {
      content?: string;
    };
  }>;
  slot_id?: number;
  error?: {
    message: string;
  };
}

export async function streamChatCompletion(
  messages: ChatMessage[],
  onChunk: (chunk: StreamChunk) => void,
  onDone: () => void,
  onError: (error: string) => void
) {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onDone();
            continue;
          }

          try {
            const chunk = JSON.parse(data) as StreamChunk;
            
            if (chunk.error) {
              onError(chunk.error.message || JSON.stringify(chunk.error));
              return;
            }
            
            onChunk(chunk);
          } catch (e) {
            console.error('Error parsing chunk:', e, data);
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function streamBranch(
  parentSlotId: number,
  branchMode: 'reuse_kv' | 'fresh',
  textExcerpt: string,
  contextWindow: number,
  prompt: string,
  onChunk: (chunk: StreamChunk) => void,
  onDone: () => void,
  onError: (error: string) => void
) {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/chat/branch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent_slot_id: parentSlotId,
        branch_mode: branchMode,
        text_excerpt: textExcerpt,
        context_window: contextWindow,
        prompt: prompt,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onDone();
            continue;
          }

          try {
            const chunk = JSON.parse(data) as StreamChunk;
            
            if (chunk.error) {
              onError(chunk.error.message || JSON.stringify(chunk.error));
              return;
            }
            
            onChunk(chunk);
          } catch (e) {
            console.error('Error parsing chunk:', e, data);
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Unknown error');
  }
}

