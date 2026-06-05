export function parseSseEvent(rawBlock) {
  const lines = rawBlock.split("\n");
  let eventType = "message";
  let data = "";

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventType = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      data += line.slice("data:".length).trim();
    }
  }

  if (!data) return null;

  try {
    return { type: eventType, payload: JSON.parse(data) };
  } catch {
    if (eventType === "message" || eventType === "text") {
      return { type: eventType, payload: { text: data } };
    }
    return null;
  }
}

export async function consumeSseStream(response, { onEvent, signal }) {
  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    if (signal?.aborted) break;
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() || "";

    for (const block of chunks) {
      const parsed = parseSseEvent(block);
      if (parsed) onEvent?.(parsed);
    }
  }
}
