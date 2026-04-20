"use client";

import type { Conversation } from "@/types/chat";

type SidebarProps = {
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onClearConversation: () => void;
};

export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onClearConversation
}: SidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col border-b border-line bg-ink/95 p-4 md:w-80 md:border-b-0 md:border-r">
      <div className="mb-5 flex items-center gap-3">
        <img
          src="https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=240&q=80"
          alt="Nocturne AI"
          className="h-11 w-11 rounded-lg border border-line object-cover"
        />
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-accent">Nocturne</p>
          <h1 className="text-lg font-semibold text-zinc-50">RP Chat AI</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onNewConversation}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-ink transition hover:bg-accent/85"
        >
          nova conversa
        </button>
        <button
          type="button"
          onClick={onClearConversation}
          className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:border-rose hover:text-rose"
        >
          limpar conversa
        </button>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto pr-1">
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
          conversas
        </p>
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelectConversation(conversation.id)}
              className={`w-full rounded-lg border p-3 text-left transition ${
                activeConversationId === conversation.id
                  ? "border-accent bg-accent/10"
                  : "border-line bg-panel hover:border-zinc-500"
              }`}
            >
              <p className="truncate text-sm font-medium text-zinc-100">
                {conversation.title}
              </p>
              <p className="mt-1 truncate text-xs text-zinc-500">
                {conversation.character.name}
              </p>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
