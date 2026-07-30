import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, getTokens, WS_BASE } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Send, ArrowLeft, Wifi, WifiOff } from "lucide-react";

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
        setMessages(history.map((m) => ({ id:m.id, sender:m.sender_username, content:m.content, timestamp:m.timestamp })));
      } catch (err) {
        setError(err.data?.detail || "Couldn't load chat history.");
        return;
      }
      const tokens = getTokens();
      ws = new WebSocket(`${WS_BASE}/ws/chat/${matchId}/?token=${tokens?.access||""}`);
      wsRef.current = ws;
      ws.onopen  = () => setConnected(true);
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
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!draft.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ content:draft.trim() }));
    setDraft("");
  };

  const fmt = (ts) => ts ? new Date(ts).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : "";

  return (
    <div className="page page-narrow">
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <Link to="/dashboard" style={{ display:"flex", alignItems:"center", gap:6, color:"#666", fontSize:".88rem" }}>
          <ArrowLeft size={15}/> Back to dashboard
        </Link>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {connected
            ? <><Wifi size={14} style={{ color:"#58d68d" }}/><span style={{ color:"#58d68d", fontSize:".8rem" }}>Connected</span></>
            : <><WifiOff size={14} style={{ color:"#888" }}/><span style={{ color:"#888", fontSize:".8rem" }}>Connecting…</span></>}
        </div>
      </div>

      <h1 style={{ marginBottom:4 }}>{t("chat")}</h1>
      <p className="subtitle">Secure, end-to-end matched conversation</p>

      {error && <div className="error-box" style={{ marginBottom:16 }}>{error}</div>}

      {/* Chat window */}
      <div className="chat-window">
        <div className="chat-messages">
          {messages.length === 0 && (
            <p style={{ color:"#444", textAlign:"center", margin:"auto", fontSize:".88rem" }}>
              No messages yet. Say hello!
            </p>
          )}
          {messages.map((m, i) => {
            const mine = m.sender === user?.username;
            return (
              <div key={m.id||i} style={{ display:"flex", flexDirection:"column", alignItems: mine?"flex-end":"flex-start", gap:2 }}>
                {!mine && <span style={{ fontSize:".72rem", color:"#555", paddingLeft:4 }}>{m.sender}</span>}
                <div className={`chat-bubble ${mine?"mine":"theirs"}`}>
                  <div>{m.content}</div>
                </div>
                {m.timestamp && <span style={{ fontSize:".68rem", color:"#444", padding:"0 4px" }}>{fmt(m.timestamp)}</span>}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form className="chat-input-row" onSubmit={send}>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={connected ? "Type a message…" : "Waiting for connection…"}
            disabled={!connected}
          />
          <button className="btn" type="submit" disabled={!connected || !draft.trim()}
            style={{ borderRadius:0, padding:"0 20px", display:"flex", alignItems:"center", gap:6 }}>
            <Send size={15}/> Send
          </button>
        </form>
      </div>
    </div>
  );
}
