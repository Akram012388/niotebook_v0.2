# Niotebook

A free, open-source learning companion for CS50 students. Watch lectures, write
and run code, and chat with Nio — an AI tutor that knows exactly where you are
in the course.

Built by someone six months into learning to program. The git history is the story.

## What It Does

- Embedded YouTube player synced to a code editor and AI chat
- Multi-language code execution: JavaScript, Python, C, HTML/CSS, SQL, R
- Nio AI chat — context-aware, transcript-grounded, bring your own API key
- Progress sync across devices via Convex
- Niotepad — a floating notepad that captures your thoughts and AI insights

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Backend | Convex (serverless, real-time) |
| Auth | Clerk (email OTP, free tier) |
| Runtime | Bun |
| Code execution | Pyodide (Python), Wasmer (C), native JS |

## Local Setup

### Prerequisites

- [Bun](https://bun.sh) 1.1.x
- [Convex account](https://convex.dev) (free)
- [Clerk account](https://clerk.com) (free)

### Steps

```bash
git clone https://github.com/your-username/niotebook
cd niotebook
bun install
cp .env.example .env.local
```

Fill in `.env.local` with your Convex and Clerk credentials (see table below).

```bash
# Terminal 1
bun run dev:convex

# Terminal 2
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex dashboard |
| `CONVEX_URL` | Yes | Same as above |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk dashboard |
| `CLERK_SECRET_KEY` | Yes | Clerk dashboard |
| `NIOTEBOOK_ADMIN_EMAILS` | Yes | Comma-separated list |
| `NIOTEBOOK_KEY_ENCRYPTION_SECRET` | Yes | `openssl rand -base64 32` |

See `.env.example` for the full list with descriptions.

## AI (Bring Your Own Key)

Nio AI chat requires users to supply their own API key. The app supports:

- **Google Gemini** — free tier available at [aistudio.google.com](https://aistudio.google.com)
- **OpenAI** — [platform.openai.com](https://platform.openai.com)
- **Anthropic** — [console.anthropic.com](https://console.anthropic.com)

Keys are stored encrypted (AES-256-GCM) in Convex. The raw key is never returned
to the client after saving. Users without a key can use all other features freely.

## Self-Hosting

1. Deploy Convex: `npx convex deploy`
2. Deploy to Vercel (or any Next.js host)
3. Set all env vars from `.env.example` in your deployment

### Content Licensing Notice

CS50 course content (transcripts, video metadata) is sourced from Harvard's CS50
courses and licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
(non-commercial, share-alike). The Niotebook codebase is MIT-licensed, but the
course content carries its own license. Self-hosters who ingest CS50 content are
responsible for compliance — specifically the **non-commercial restriction**.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
