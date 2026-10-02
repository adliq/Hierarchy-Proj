import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ChatPage.css"; // ← NEW

async function fetchMessagesFor(selectedChatId, token, setMessages, setLoading, listRef) {
  if (!selectedChatId) {
    setMessages([]);
    return;
  }
  try {
    setLoading(true);
    const res = await axios.get(
      `http://localhost:3000/api/chat/messages/${selectedChatId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setMessages(Array.isArray(res.data) ? res.data : []);
  } catch {
    setMessages([]);
  } finally {
    setLoading(false);
    setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }, 0);
  }
}

export default function ChatPage() {
  const { userId } = useParams(); // optional: /chat/:userId
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [convos, setConvos] = useState([]);
  const [filter, setFilter] = useState("");
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const listRef = useRef(null);

  const auth = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/users/me", auth);
        setMe(res.data);
      } catch {}
    })();
  }, [token]);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/chat/conversations", auth);
        const rows = Array.isArray(res.data) ? res.data : [];
        setConvos(rows);

        if (rows.length === 0) {
          setSelectedChatId(null);
          return;
        }

        if (userId) {
          const found = rows.find((c) => c.user?._id === userId);
          if (found) {
            const ndaId = found.nda?._id || found.nda;
            setSelectedChatId(`${ndaId}_${found.user._id}`);
            return;
          }
        }

        const first = rows[0];
        const ndaId = first.nda?._id || first.nda;
        setSelectedChatId(`${ndaId}_${first.user._id}`);
      } catch (err) {
        console.error("Error fetching conversations:", err.response?.data || err.message);
        setConvos([]);
      }
    })();
  }, [token, userId]);

  const filteredConvos = useMemo(() => {
    if (!filter.trim()) return convos;
    const q = filter.toLowerCase();
    return convos.filter((c) => {
      const name = (c.user?.name || "").toLowerCase();
      const email = (c.user?.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [convos, filter]);

  const currentPartner = useMemo(() => {
    if (!selectedChatId) return null;
    const found = convos.find((c) => `${(c.nda?._id || c.nda)}_${c.user?._id}` === selectedChatId);
    return found?.user || null;
  }, [convos, selectedChatId]);

  useEffect(() => {
    fetchMessagesFor(selectedChatId, token, setMessages, setLoading, listRef);
    const id = setInterval(() => {
      fetchMessagesFor(selectedChatId, token, setMessages, setLoading, listRef);
    }, 4000);
    return () => clearInterval(id);
  }, [selectedChatId, token]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChatId) return;

    const [ndaId, recipientId] = selectedChatId.split("_");

    try {
      const res = await axios.post(
        "http://localhost:3000/api/chat/send",
        { recipientId, text: messageText, ndaId },
        auth
      );

      const saved = res.data.data;
      setMessages((prev) => [...prev, saved]);
      setConvos((prev) =>
        prev.map((c) => {
          const key = `${(c.nda?._id || c.nda)}_${c.user._id}`;
          if (key === selectedChatId) {
            return {
              ...c,
              lastMessageText: saved.text,
              lastMessageAt: saved.createdAt,
              hasMessages: true,
            };
          }
          return c;
        })
      );

      setMessageText("");
      setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      }, 0);
    } catch (err) {
      console.error("Error sending message:", err.response?.data || err.message);
    }
  };

  const onSelectConversation = (c) => {
    const ndaId = c.nda?._id || c.nda;
    const key = `${ndaId}_${c.user._id}`;
    setSelectedChatId(key);
    navigate(`/chat/${c.user._id}`, { replace: true });
  };

  return (
    <div className="chat-layout"> {/* grid, full height */}
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <button onClick={() => navigate("/home")} className="btn btn-secondary">
            ← Home
          </button>
          <h2>Chats</h2>
        </div>

        <div className="chat-search">
          <input
            type="text"
            placeholder="Search users…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        {filteredConvos.length === 0 ? (
          <p className="empty">No NDA‑signed chats yet.</p>
        ) : (
          <ul className="chat-list">
            {filteredConvos.map((c) => {
              const ndaId = c.nda?._id || c.nda;
              const key = `${ndaId}_${c.user._id}`;
              const active = selectedChatId === key;
              return (
                <li
                  key={key}
                  className={`chat-list-item ${active ? "active" : ""}`}
                  onClick={() => onSelectConversation(c)}
                >
                  <div className="chat-avatar">
                    <div className="avatar-circle">{(c.user.name || c.user.email || "?")[0]}</div>
                  </div>
                  <div className="chat-meta">
                    <div className="chat-name">{c.user.name || c.user.email}</div>
                    <div className="chat-preview">
                      {c.lastMessageText ? c.lastMessageText : "No messages yet"}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* Right pane */}
      <section className="chat-pane">
        <header className="chat-header">
          {currentPartner ? (
            <>
              <div className="chat-header-title">{currentPartner.name || currentPartner.email}</div>
              <div className="chat-header-sub">{currentPartner.email}</div>
            </>
          ) : (
            <div className="chat-header-title">Chat</div>
          )}
        </header>

        <div ref={listRef} className="chat-messages">
          {loading ? (
            <p className="muted">Loading messages…</p>
          ) : messages.length === 0 ? (
            <p className="muted">No messages yet.</p>
          ) : (
            messages.map((m) => {
              const mine = me && m.sender?._id === me._id;
              return (
                <div key={m._id} className={`bubble-row ${mine ? "me" : "them"}`}>
                  <div className={`bubble ${mine ? "bubble-me" : "bubble-them"}`}>
                    <div className="bubble-text">{m.text}</div>
                    <div className="bubble-time">
                      {new Date(m.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {selectedChatId && (
          <form onSubmit={sendMessage} className="chat-composer">
            <input
              type="text"
              placeholder="Type your message…"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">Send</button>
          </form>
        )}
      </section>
    </div>
  );
}
