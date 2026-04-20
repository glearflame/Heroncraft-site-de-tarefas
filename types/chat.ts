export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

export type CharacterProfile = {
  name: string;
  description: string;
  openingMessage: string;
};

export type Conversation = {
  id: string;
  title: string;
  character: CharacterProfile;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

export type ChatRequestBody = {
  character: CharacterProfile;
  messages: ChatMessage[];
};

export type StoredChatState = {
  activeConversationId: string;
  conversations: Conversation[];
};
