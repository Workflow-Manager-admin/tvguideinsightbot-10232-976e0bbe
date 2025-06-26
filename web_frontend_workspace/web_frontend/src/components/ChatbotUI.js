import React, { useState, useRef, useEffect } from "react";
import "../styles/ChatbotUI.css";

/**
 * ChatbotUI - Chat conversation window for user-facing interaction with the TVGuideChatBot.
 * Allows sending messages, viewing bot responses, and optionally quick TV Guide or KG triggers.
 */
// PUBLIC_INTERFACE
function ChatbotUI({ onSendMessage, messages, loading }) {
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom when messages update
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // PUBLIC_INTERFACE
  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) {
      onSendMessage(trimmed);
      setInput("");
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chat-history">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-message ${msg.sender === "user" ? "from-user" : "from-bot"}`}
          >
            <span>{msg.text}</span>
          </div>
        ))}
        {loading && (
          <div className="chat-message from-bot chat-typing">
            <span>TVGuideBot is typing...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <form className="chat-input-bar" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          placeholder="Ask about TV shows, guides, or trends..."
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          autoFocus
        />
        <button type="submit" disabled={!input.trim() || loading}>
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatbotUI;
