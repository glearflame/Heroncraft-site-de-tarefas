# Nocturne RP Chat AI

Site completo de chat com IA para conversas em estilo personagem/RP, feito com Next.js App Router, TypeScript, Tailwind CSS e rota serverless para OpenAI.

## Stack

- Next.js com App Router
- TypeScript
- Tailwind CSS
- API route em `app/api/chat/route.ts`
- Persistencia local no navegador com `localStorage`
- Streaming de resposta via rota backend

## Como instalar

```bash
npm install
```

## Como rodar localmente

Crie um arquivo `.env.local` na raiz:

```bash
OPENAI_API_KEY=sua_chave_aqui
OPENAI_MODEL=gpt-4.1-mini
```

Depois rode:

```bash
npm run dev
```

Abra:

```text
http://localhost:3000
```

## Chave da OpenAI

A chave nunca vai para o front-end. O navegador chama apenas `/api/chat`, e a rota serverless chama a API da OpenAI no backend com:

```ts
Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
```

Na Vercel, configure `OPENAI_API_KEY` em:

```text
Project Settings -> Environment Variables
```

`OPENAI_MODEL` e opcional. Se nao for definido, o projeto usa `gpt-4.1-mini`.

## Deploy na Vercel

1. Suba o projeto para o GitHub.
2. Entre em https://vercel.com.
3. Clique em `Add New Project`.
4. Selecione o repositorio.
5. Configure `OPENAI_API_KEY` nas variaveis de ambiente.
6. Clique em `Deploy`.

## Como conectar ao GitHub

Dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "Initial AI roleplay chat"
git branch -M main
git remote add origin https://github.com/seu-usuario/ai-rp-chat.git
git push -u origin main
```

Depois conecte esse repositorio na Vercel.

## Arquitetura

```text
app/page.tsx                 tela principal
app/api/chat/route.ts        backend/serverless para OpenAI
components/ChatWindow.tsx    estado principal do chat
components/Sidebar.tsx       lista e acoes de conversa
components/MessageBubble.tsx bolhas de mensagem
lib/openai.ts                prompt, modelo e limite de contexto
lib/storage.ts               persistencia local
types/chat.ts                tipos compartilhados
```

## Memoria e contexto

O projeto separa o prompt de sistema das mensagens do usuario e da IA. A funcao `limitRecentMessages` em `lib/openai.ts` limita o numero de mensagens recentes enviadas para o modelo, deixando a estrutura pronta para uma memoria futura mais robusta.

## Observacoes

- O historico visivel fica no `localStorage` do navegador.
- O streaming e convertido no backend para texto simples, facilitando o consumo no front-end.
- O prompt base instrui o modelo a manter o personagem, preservar a imersao e nao controlar as acoes do usuario.
