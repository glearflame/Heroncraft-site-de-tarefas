import { CHAT_MODEL, extractChatCompletionDelta, toOpenAIMessages } from "@/lib/openai";
import type { ChatRequestBody } from "@/types/chat";

export const runtime = "edge";

function isValidBody(body: unknown): body is ChatRequestBody {
  if (!body || typeof body !== "object") {
    return false;
  }

  const candidate = body as ChatRequestBody;
  return Boolean(
    candidate.character?.name &&
      candidate.character?.description &&
      Array.isArray(candidate.messages)
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY nao foi configurada no ambiente do backend." },
      { status: 500 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corpo da requisicao invalido." }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return Response.json({ error: "Dados do chat incompletos." }, { status: 400 });
  }

  const openAIMessages = toOpenAIMessages(body.character, body.messages);

  const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: openAIMessages,
      temperature: 0.85,
      stream: true,
      stream_options: {
        include_usage: false,
        include_obfuscation: false
      }
    })
  });

  if (!openAIResponse.ok || !openAIResponse.body) {
    let message = "Erro ao chamar a OpenAI.";

    try {
      const errorBody = (await openAIResponse.json()) as { error?: { message?: string } };
      message = errorBody.error?.message || message;
    } catch {
      message = `${message} Status ${openAIResponse.status}.`;
    }

    return Response.json({ error: message }, { status: openAIResponse.status || 500 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = openAIResponse.body.getReader();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      let isClosed = false;

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const event of events) {
            const dataLine = event
              .split("\n")
              .find((line) => line.startsWith("data: "));

            if (!dataLine) {
              continue;
            }

            const data = dataLine.replace("data: ", "").trim();

            if (data === "[DONE]") {
              isClosed = true;
              controller.close();
              return;
            }

            try {
              const delta = extractChatCompletionDelta(JSON.parse(data));
              if (delta) {
                controller.enqueue(encoder.encode(delta));
              }
            } catch {
              // Ignore malformed intermediary chunks and keep streaming.
            }
          }
        }
      } catch (error) {
        isClosed = true;
        controller.error(error);
      } finally {
        reader.releaseLock();
        if (!isClosed) {
          controller.close();
        }
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform"
    }
  });
}
