"use client";

import type { Conversation, StoredChatState } from "@/types/chat";

const STORAGE_KEY = "ai-rp-chat-state-v1";

export function loadChatState(): StoredChatState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredChatState;
    if (!Array.isArray(parsed.conversations)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveChatState(state: StoredChatState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function summarizeConversation(conversation: Conversation): string {
  const lastUserMessage = [...conversation.messages]
    .reverse()
    .find((message) => message.role === "user");

  if (lastUserMessage?.content.trim()) {
    return lastUserMessage.content.trim().slice(0, 42);
  }

  return conversation.character.name;
}
