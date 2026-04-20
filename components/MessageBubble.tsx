"use client";

import type { ChatMessage } from "@/types/chat";

type MessageBubbleProps = {
  message: ChatMessage;
  onDelete: (messageId: string) => void;
};

export function MessageBubble({ message, onDelete }: MessageBubbleProps) {
  const isUser = message.role === "user";

  async function copyMessage() {
    await navigator.clipboard.writeText(message.content);
  }

  return (
    <article className={`group flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-lg border px-4 py-3 shadow-sm sm:max-w-[76%] ${
          isUser
            ? "border-accent/40 bg-accent/10 text-zinc-50"
            : "border-line bg-panelSoft text-zinc-100"
        }`}
      >
        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-zinc-400">
          <span>{isUser ? "Voce" : "Personagem"}</span>
          <div className="flex gap-2 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
            <button
              type="button"
              onClick={copyMessage}
              className="rounded-md border border-line px-2 py-1 text-zinc-300 transition hover:border-accent hover:text-accent"
            >
              copiar
            </button>
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              className="rounded-md border border-line px-2 py-1 text-zinc-300 transition hover:border-rose hover:text-rose"
            >
              apagar
            </button>
          </div>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-6 sm:text-[15px]">
          {message.content}
        </p>
      </div>
    </article>
  );
}
