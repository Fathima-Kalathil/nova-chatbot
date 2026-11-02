"use client";

import { useEffect, useRef, useState } from "react";

const SUGGESTIONS = [
  "Explain React hooks simply",
  "Help me prepare for a frontend interview",
  "Write a friendly email asking for feedback",
];

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.reply) {
        setMessages([
          ...next,
          { role: "assistant", content: data.error || "No reply received. Please try again.", error: true },
        ]);
      } else {
        setMessages([...next, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "Could not reach the server. Check your connection and try again.", error: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app">
      <header className="header">
        <span className="logo" aria-hidden="true">✦</span>
        <h1>Nova</h1>
        {messages.length > 0 && (
          <button className="clear" onClick={() => setMessages([])}>
            New chat
          </button>
        )}
      </header>

      <section className="chat" aria-live="polite">
        {messages.length === 0 && (
          <div className="empty">
            <p className="empty-title">Hi, I'm Nova. What can I help with?</p>
            <div className="chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`row ${m.role}`}>
            <div className={`bubble ${m.error ? "error" : ""}`}>{m.content}</div>
          </div>
        ))}

        {loading && (
          <div className="row assistant">
            <div className="bubble typing" aria-label="Nova is typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </section>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message Nova"
          aria-label="Message Nova"
          maxLength={4000}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </main>
  );
}
