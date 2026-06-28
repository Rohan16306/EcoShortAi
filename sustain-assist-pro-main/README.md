# Ecosort AI

> AI-powered sustainability platform for plastic recycling, circular economy education, and environmental impact tracking.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TanStack Start](https://img.shields.io/badge/TanStack_Start-v1-FF4154?logo=react&logoColor=white)](https://tanstack.com/start)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![AI SDK](https://img.shields.io/badge/AI_SDK-Lovable_Gateway-000000?logo=openai&logoColor=white)](https://ai-sdk.dev)

---

## Description

**Ecosort AI** is an intelligent sustainability assistant that helps users identify plastic types from photos, learn recycling best practices, explore circular economy topics, and track their environmental impact. Built with modern web technologies and powered by AI, it combines an elegant chat interface with persistent conversation history and image-based plastic identification.

---

## Live Demo

- **Preview:** https://id-preview--c0244d6c-6496-40c2-b640-456d24b83678.lovable.app
- **Published:** https://sustain-assist-pro.lovable.app

---

## Screenshots

### Chat Interface
<img src="https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/81a0dafe-9f33-4b7a-ac12-18fa876cca7f" alt="Ecosort AI Chat Interface" width="800"/>

### Authentication Page
_Elegant sign-in/sign-up with Google OAuth and email/password support, wrapped in a nature-inspired organic design._

### Plastic Photo Analysis
_Upload photos of plastic items and receive AI-powered identification with confidence levels, recyclability estimates, and disposal recommendations._

---

## Features

- **AI Chat Assistant** — Conversational interface powered by Google Gemini Flash via the Lovable AI Gateway, with a comprehensive sustainability system prompt
- **Plastic Photo Identification** — Upload images of plastic items to identify type (PET, HDPE, PVC, LDPE, PP, PS, Other), assess recyclability, and get disposal guidance
- **Persistent Chat History** — Conversations are securely stored per-user in the database with full CRUD operations
- **Suggested Prompts** — Quick-start suggestions for common recycling and sustainability questions
- **Authentication** — Secure email/password and Google OAuth sign-in via Supabase Auth
- **Responsive Design** — Fully responsive layout with a custom organic nature-inspired color palette
- **Real-time Streaming** — AI responses stream in real-time for a snappy user experience
- **Dark Mode Ready** — Complete dark mode support with semantic color tokens

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | [TanStack Start](https://tanstack.com/start) v1 — Full-stack React 19 with SSR, file-based routing, and server functions |
| **UI Library** | [React](https://react.dev) 19 + [TypeScript](https://www.typescriptlang.org) 5 |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) v4 with custom OKLCH color tokens and CSS variables |
| **Components** | [shadcn/ui](https://ui.shadcn.com) primitives built on [Radix UI](https://www.radix-ui.com) |
| **AI / LLM** | [AI SDK](https://ai-sdk.dev) v6 + [Lovable AI Gateway](https://lovable.dev) (Google Gemini 3 Flash) |
| **Backend / Auth** | [Supabase](https://supabase.com) — PostgreSQL, Auth, Row-Level Security (RLS) |
| **State & Data** | [TanStack Query](https://tanstack.com/query) v5 for server state management |
| **Animation** | [Motion](https://motion.dev) (Framer Motion successor) |
| **Icons** | [Lucide React](https://lucide.dev) |
| **Build Tool** | [Vite](https://vitejs.dev) 7 |
| **Package Manager** | [Bun](https://bun.sh) |

---

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── ai-elements/          # Custom AI chat UI primitives
│   │   │   ├── conversation.tsx   # Chat scrollable container
│   │   │   ├── message.tsx        # Message bubbles (user/assistant)
│   │   │   ├── prompt-input.tsx   # Chat input with attachments
│   │   │   └── shimmer.tsx        # Loading shimmer effect
│   │   └── ui/                    # shadcn/ui components (button, input, dialog, etc.)
│   ├── integrations/
│   │   ├── lovable/               # Lovable Cloud auth integration
│   │   └── supabase/              # Supabase client, auth middleware, server helpers
│   ├── lib/
│   │   ├── ai-gateway.server.ts   # Lovable AI Gateway provider factory
│   │   ├── chat.functions.ts      # Server functions: load/save/clear messages
│   │   ├── config.server.ts       # Server-side configuration
│   │   ├── error-page.ts          # SSR error page renderer
│   │   └── utils.ts               # Utility helpers (cn, etc.)
│   ├── routes/
│   │   ├── __root.tsx             # Root layout (head meta, fonts, providers)
│   │   ├── _authenticated/
│   │   │   ├── route.tsx          # Auth guard layout (redirects to /auth)
│   │   │   └── chat.tsx           # Main AI chat application
│   │   ├── api/
│   │   │   └── chat.ts            # Streaming AI chat API endpoint
│   │   ├── auth.tsx               # Sign in / Sign up page
│   │   └── index.tsx              # Landing page (redirects to /chat)
│   ├── styles.css                 # Global styles, design tokens, Tailwind v4 theme
│   ├── router.tsx                 # TanStack Router configuration
│   ├── server.ts                  # Server entry (SSR)
│   └── start.ts                   # TanStack Start instance with error middleware
├── supabase/
│   └── migrations/                # Database migrations
└── vite.config.ts                 # Vite configuration
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0 (or Node.js >= 20 with `npm`/`pnpm`/`yarn`)
- A [Supabase](https://supabase.com) project
- A [Lovable](https://lovable.dev) account with an AI Gateway API key

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ecosort-ai.git
cd ecosort-ai
```

### 2. Install Dependencies

```bash
bun install
# or: npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Supabase (public — used in browser)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id

# Supabase (server-side)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Lovable AI Gateway (server-side only)
LOVABLE_API_KEY=your-lovable-api-key
```

> **Security note:** Never commit the `.env` file. The service role key and Lovable API key are server-only secrets.

### 4. Set Up the Database

Run the migration in your Supabase SQL Editor:

```sql
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  parts JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX messages_user_created_idx ON public.messages(user_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own messages" ON public.messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 5. Configure Google OAuth (Optional)

In your Supabase dashboard → Authentication → Providers → Google:

1. Enable the Google provider
2. Add your client ID and secret from the [Google Cloud Console](https://console.cloud.google.com/)
3. Add your site URL to **Authorized Redirect URIs**

### 6. Start the Development Server

```bash
bun dev
# or: npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables Reference

| Variable | Required | Scope | Description |
|----------|----------|-------|-------------|
| `VITE_SUPABASE_URL` | Yes | Client | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Client | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Yes | Client | Supabase project ID |
| `SUPABASE_URL` | Yes | Server | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Yes | Server | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server | Supabase service role key (bypasses RLS) |
| `LOVABLE_API_KEY` | Yes | Server | Lovable AI Gateway API key |

---

## Database Schema

### `messages`

Stores per-user chat message history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique message ID |
| `user_id` | `uuid` | FK → `auth.users(id)`, ON DELETE CASCADE | Message owner |
| `role` | `text` | CHECK `IN ('user','assistant','system')` | Message sender role |
| `parts` | `jsonb` | NOT NULL | Message content parts (text, file attachments) |
| `created_at` | `timestamptz` | DEFAULT `now()` | Creation timestamp |

**RLS Policy:** Users can only read, insert, update, and delete their own messages.

---

## Key Architecture Decisions

### File-Based Routing (TanStack Start)
Routes are defined by files in `src/routes/`. The root layout is `__root.tsx`, authenticated routes live under `_authenticated/`, and API endpoints are in `src/routes/api/`.

### Server Functions (`createServerFn`)
All database operations go through type-safe server functions in `src/lib/chat.functions.ts`, protected by `requireSupabaseAuth` middleware. The auth header is automatically attached via `attachSupabaseAuth` in `src/start.ts`.

### Streaming AI Responses
The `/api/chat` endpoint uses `streamText` from the AI SDK with `convertToModelMessages` and returns a `UIMessageStreamResponse`, enabling real-time token streaming to the client.

### Auth Guard Pattern
The `_authenticated` layout route uses `beforeLoad` to check the Supabase session. Unauthenticated users are redirected to `/auth`. The route sets `ssr: false` to avoid SSR hydration mismatches with auth state.

---

## Deployment

This project is built with TanStack Start and deploys to edge/serverless environments.

### Lovable (Recommended)
Deploy directly from the Lovable editor — changes sync automatically.

### Self-Hosted / Vercel / Netlify
```bash
bun run build
```

The `vite build` command outputs a production bundle compatible with edge runtimes. Ensure all environment variables are configured in your hosting provider's dashboard.

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

---

## Acknowledgments

- Design system inspired by organic nature palettes — deep forest greens, sage, moss, and cream tones
- Built with [Lovable](https://lovable.dev) AI-assisted development
- AI model: [Google Gemini 3 Flash Preview](https://deepmind.google/technologies/gemini/)

---

<p align="center">
  <sub>Built with care for the planet.</sub>
</p>
