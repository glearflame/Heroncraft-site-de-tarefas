"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { MessageBubble } from "@/components/MessageBubble";
import { Sidebar } from "@/components/Sidebar";
import { loadChatState, saveChatState, summarizeConversation } from "@/lib/storage";
import type { CharacterProfile, ChatMessage, Conversation } from "@/types/chat";

const defaultCharacter: CharacterProfile = {
  name: "Mira Vale",
  description:
    "Uma investigadora de mundos paralelos, carismatica, atenta aos detalhes e com humor seco. Ela gosta de cenas intimistas, misterio urbano e conversas que misturam tensao e cuidado.",
  openingMessage:
    "A chuva risca a janela do apartamento enquanto Mira fecha um arquivo holografico. Ela olha para voce com um sorriso leve. 'Chegou bem na hora. Eu encontrei algo estranho, e acho que voce vai querer ver.'"
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createAssistantMessage(content: string): ChatMessage {
  return {
    id: createId(),
    role: "assistant",
    content,
    createdAt: Date.now()
  };
}

function createConversation(character: CharacterProfile = defaultCharacter): Conversation {
  const now = Date.now();

  return {
    id: createId(),
    title: "Nova cena",
    character,
    messages: [createAssistantMessage(character.openingMessage)],
    createdAt: now,
    updatedAt: now
  };
}

export function ChatWindow() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId),
    [activeConversationId, conversations]
  );

  useEffect(() => {
    const stored = loadChatState();

    if (stored?.conversations.length) {
      setConversations(stored.conversations);
      setActiveConversationId(stored.activeConversationId || stored.conversations[0].id);
      return;
    }

    const firstConversation = createConversation();
    setConversations([firstConversation]);
    setActiveConversationId(firstConversation.id);
  }, []);

  useEffect(() => {
    if (!conversations.length || !activeConversationId) {
      return;
    }

    saveChatState({ conversations, activeConversationId });
  }, [activeConversationId, conversations]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeConversation?.messages, isLoading]);

  function updateActiveConversation(updater: (conversation: Conversation) => Conversation) {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === activeConversationId ? updater(conversation) : conversation
      )
    );
  }

  function patchCharacter(field: keyof CharacterProfile, value: string) {
    updateActiveConversation((conversation) => ({
      ...conversation,
      character: {
        ...conversation.character,
        [field]: value
      },
      updatedAt: Date.now()
    }));
  }

  function startNewConversation() {
    const next = createConversation(activeConversation?.character || defaultCharacter);
    setConversations((current) => [next, ...current]);
    setActiveConversationId(next.id);
    setInput("");
    setError("");
  }

  function clearActiveConversation() {
    updateActiveConversation((conversation) => ({
      ...conversation,
      messages: [createAssistantMessage(conversation.character.openingMessage)],
      title: "Nova cena",
      updatedAt: Date.now()
    }));
    setError("");
  }

  function deleteMessage(messageId: string) {
    updateActiveConversation((conversation) => ({
      ...conversation,
      messages: conversation.messages.filter((message) => message.id !== messageId),
      updatedAt: Date.now()
    }));
  }

  async function requestAssistantResponse(messagesForContext: ChatMessage[]) {
    if (!activeConversation || isLoading) {
      return;
    }

    const assistantId = createId();
    const now = Date.now();

    setIsLoading(true);
    setError("");

    updateActiveConversation((conversation) => ({
      ...conversation,
      messages: [
        ...messagesForContext,
        { id: assistantId, role: "assistant", content: "", createdAt: now }
      ],
      title:
        conversation.title === "Nova cena"
          ? summarizeConversation({ ...conversation, messages: messagesForContext })
          : conversation.title,
      updatedAt: now
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: activeConversation.character,
          messages: messagesForContext
        })
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Nao consegui gerar uma resposta agora.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });

        setConversations((current) =>
          current.map((conversation) => {
            if (conversation.id !== activeConversationId) {
              return conversation;
            }

            return {
              ...conversation,
              messages: conversation.messages.map((message) =>
                message.id === assistantId
                  ? { ...message, content: message.content + chunk }
                  : message
              ),
              updatedAt: Date.now()
            };
          })
        );
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Erro inesperado no chat.";
      setError(message);
      deleteMessage(assistantId);
    } finally {
      setIsLoading(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeConversation || !input.trim() || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: input.trim(),
      createdAt: Date.now()
    };
    const nextMessages = [...activeConversation.messages, userMessage];

    setInput("");
    updateActiveConversation((conversation) => ({
      ...conversation,
      messages: nextMessages,
      updatedAt: Date.now()
    }));

    await requestAssistantResponse(nextMessages);
  }

  async function regenerateLastResponse() {
    if (!activeConversation || isLoading) {
      return;
    }

    const messagesWithoutLastAssistant = [...activeConversation.messages];

    for (let index = messagesWithoutLastAssistant.length - 1; index >= 0; index -= 1) {
      if (messagesWithoutLastAssistant[index].role === "assistant") {
        messagesWithoutLastAssistant.splice(index, 1);
        break;
      }
    }

    updateActiveConversation((conversation) => ({
      ...conversation,
      messages: messagesWithoutLastAssistant,
      updatedAt: Date.now()
    }));

    await requestAssistantResponse(messagesWithoutLastAssistant);
  }

  if (!activeConversation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink text-zinc-100">
        Carregando...
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-ink text-zinc-100 md:flex-row">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewConversation={startNewConversation}
        onClearConversation={clearActiveConversation}
      />

      <section className="flex min-h-0 flex-1 flex-col">
        <header className="border-b border-line bg-panel/90 px-4 py-4 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <img
                src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=240&q=80"
                alt={activeConversation.character.name}
                className="h-16 w-16 rounded-lg border border-line object-cover"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-accent">
                  personagem ativo
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-zinc-50">
                  {activeConversation.character.name}
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
                  {activeConversation.character.description}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={regenerateLastResponse}
              disabled={isLoading}
              className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
            >
              regenerar ultima resposta
            </button>
          </div>
        </header>

        <div className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 gap-4 overflow-hidden px-4 py-4 lg:grid-cols-[1fr_320px]">
          <div className="flex min-h-[62vh] flex-col rounded-lg border border-line bg-panel shadow-glow">
            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
              {activeConversation.messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onDelete={deleteMessage}
                />
              ))}

              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-rose [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-gold [animation-delay:240ms]" />
                  <span className="ml-2">escrevendo...</span>
                </div>
              ) : null}

              <div ref={endRef} />
            </div>

            {error ? (
              <p className="border-t border-rose/30 bg-rose/10 px-4 py-3 text-sm text-rose">
                {error}
              </p>
            ) : null}

            <form onSubmit={sendMessage} className="border-t border-line p-3 sm:p-4">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="Fale com o personagem..."
                  rows={2}
                  className="min-h-12 flex-1 resize-none rounded-lg border border-line bg-ink px-3 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="rounded-lg bg-accent px-5 py-3 text-sm font-bold text-ink transition hover:bg-accent/85 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  enviar
                </button>
              </div>
            </form>
          </div>

          <aside className="rounded-lg border border-line bg-panel p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              editar personagem
            </p>
            <label className="mt-4 block text-sm text-zinc-300">
              nome
              <input
                value={activeConversation.character.name}
                onChange={(event) => patchCharacter("name", event.target.value)}
                className="mt-2 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-zinc-100 outline-none focus:border-accent"
              />
            </label>
            <label className="mt-4 block text-sm text-zinc-300">
              descricao/prompt
              <textarea
                value={activeConversation.character.description}
                onChange={(event) => patchCharacter("description", event.target.value)}
                rows={6}
                className="mt-2 w-full resize-none rounded-lg border border-line bg-ink px-3 py-2 text-sm leading-6 text-zinc-100 outline-none focus:border-accent"
              />
            </label>
            <label className="mt-4 block text-sm text-zinc-300">
              mensagem inicial
              <textarea
                value={activeConversation.character.openingMessage}
                onChange={(event) => patchCharacter("openingMessage", event.target.value)}
                rows={5}
                className="mt-2 w-full resize-none rounded-lg border border-line bg-ink px-3 py-2 text-sm leading-6 text-zinc-100 outline-none focus:border-accent"
              />
            </label>
            <p className="mt-4 text-xs leading-5 text-zinc-500">
              O contexto enviado ao modelo usa o prompt do personagem e apenas as mensagens
              recentes, mantendo a conversa leve para deploy serverless.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
