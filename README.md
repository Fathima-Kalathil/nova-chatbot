# Nova chatbot

A simple AI chatbot built with Next.js and a free LLM API (Groq by default). Deploys free on Vercel.

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env.local` and paste your API key:
   `LLM_API_KEY=your_key_here`
3. `npm run dev`, then open http://localhost:3000

## Deploy on Vercel (free)
1. Push this repo to GitHub.
2. In Vercel: Add New -> Project -> import the repo.
3. Under Environment Variables add `LLM_API_KEY` with your key.
4. Click Deploy.

## Change provider or model
Set `LLM_BASE_URL` and `LLM_MODEL` in your environment variables. Any OpenAI-compatible
provider works (Groq, Google Gemini, OpenRouter).

## Notes
- The API key stays on the server (`app/api/chat/route.js`) and is never sent to the browser.
- A basic per-IP limit (20 messages/hour) protects your free quota.
