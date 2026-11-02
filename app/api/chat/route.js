import OpenAI from "openai";

const client = new OpenAI({
  baseURL: process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1",
  apiKey: process.env.LLM_API_KEY || "missing",
});

const MODEL = process.env.LLM_MODEL || "openai/gpt-oss-120b";
const SYSTEM_PROMPT =
  "You are Nova, a friendly and helpful AI assistant. Keep answers clear and concise.";

// Simple in-memory rate limit: 20 messages per IP per hour.
// (Resets when the server restarts; fine for a small demo.)
const hits = new Map();
const LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000;

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export async function POST(req) {
  if (!process.env.LLM_API_KEY) {
    return Response.json(
      { error: "Server is missing LLM_API_KEY. Add it to your environment variables." },
      { status: 500 }
    );
  }

  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  if (rateLimited(ip)) {
    return Response.json(
      { error: "Message limit reached. Please try again in an hour." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const cleaned = messages
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim()
    )
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  if (cleaned.length === 0) {
    return Response.json({ error: "Please type a message." }, { status: 400 });
  }

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...cleaned],
      max_tokens: 1000,
    });
    const reply = completion.choices?.[0]?.message?.content || "";
    return Response.json({ reply });
  } catch (err) {
    console.error("LLM error:", err?.status, err?.message);
    const msg =
      err?.status === 429
        ? "Nova is busy right now (free-tier limit). Try again in a minute."
        : "Something went wrong talking to the model. Check your API key and model name.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
