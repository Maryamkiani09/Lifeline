import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, getTokens, WS_BASE } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function ChatRoom() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    let ws;

    async function setup() {
      try {
        const history = await api.get(`/api/chat/${matchId}/history/`);
        setMessages(history.map((m) => ({ id: m.id, sender: m.sender_username, content: m.content, timestamp: m.timestamp })));
      } catch (err) {
        setError(err.data?.detail || "Couldn't load chat history.");
        return;
      }

      const tokens = getTokens();
      ws = new WebSocket(`${WS_BASE}/ws/chat/${matchId}/?token=${tokens?.access || ""}`);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      ws.onerror = () => setError("Chat connection lost. You can still see history above; try reloading.");
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
      };
    }

    setup();
    return () => ws?.close();
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!draft.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ content: draft.trim() }));
    setDraft("");
  };

  return (
    <div className="page page-narrow">
      <Link to="/dashboard">← Back to dashboard</Link>
      <h1>{t("chat")}</h1>
      {error && <div className="error-box">{error}</div>}
      {!connected && !error && <div className="info-box">Connecting…</div>}

      <div className="chat-window">
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={m.id || i} className={`chat-bubble ${m.sender === user?.username ? "mine" : "theirs"}`}>
              <div>{m.content}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form className="chat-input-row" onSubmit={send}>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            disabled={!connected}
          />
          <button className="btn" type="submit" disabled={!connected}>Send</button>
        </form>
      </div>
    </div>
  );
}
