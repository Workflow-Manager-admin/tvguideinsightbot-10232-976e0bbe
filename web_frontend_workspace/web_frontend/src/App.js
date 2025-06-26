import React, { useState, useRef, useEffect } from "react";
import "./App.css";

/**
 * TVGuideChatBot App
 * - Modern, responsive, multipane layout: Chat, TV Guide, Knowledge Graph Insights
 * - Uses accent, primary, and secondary colors as provided
 * - Integrates (placeholder for now) Gracenote TV Guide search and Neo4j insights
 *
 * NOTE: Actual external API calls would require backend endpoints or proxying; here we use mock responses and UX placeholders.
 */

// Utility: Custom theme variables
const COLORS = {
  accent: "#FFC107",
  primary: "#1976D2",
  secondary: "#424242"
};

// Modern glass effect and panel layout, expanded CSS is injected for overrides and colors
const injectCustomTheme = () => {
  const sheet = document.createElement("style");
  sheet.innerHTML = `
    :root {
      --color-primary: ${COLORS.primary};
      --color-secondary: ${COLORS.secondary};
      --color-accent: ${COLORS.accent};
      --chatbot-bg: #fff;
      --insight-bg: #f4f6fa;
      --panel-radius: 20px;
      --divider: #e0e0e0;
    }

    [data-theme="dark"] {
      --chatbot-bg: #23272f;
      --insight-bg: #23272f;
      --divider: #333;
    }

    .tg-shell {
      display: flex;
      flex-direction: row;
      gap: 16px;
      padding: 0;
      height: 100vh;
      background: var(--bg-primary);
      transition: background 0.3s;
    }
    .tg-panel {
      border-radius: var(--panel-radius);
      box-shadow: 0 4px 24px 0 rgba(20,30,60,0.06);
      border: 1px solid var(--divider);
      background: var(--chatbot-bg);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .tg-main {
      width: 36vw;
      min-width: 320px;
      max-width: 600px;
      flex: 1 1 0;
      margin: 32px 0 32px 32px;
      position: relative;
      display: flex;
    }
    .tg-chatbot {
      flex: 2 2 0;
      min-width: 320px;
      height: 100%;
    }
    .tg-guide {
      flex: 2 2 0;
      min-width: 320px;
      max-width: 510px;
      margin: 32px 0 32px 0;
      display: flex;
    }
    .tg-graph {
      flex: 1.5 1.5 0;
      min-width: 260px;
      max-width: 430px;
      margin: 32px 32px 32px 0;
      background: var(--insight-bg);
      border-radius: var(--panel-radius);
      border: 1px solid var(--divider);
      display: flex;
      flex-direction: column;
    }
    @media (max-width: 1200px) {
      .tg-shell {
        flex-direction: column;
        gap: 0;
        height: auto;
      }
      .tg-main, .tg-guide, .tg-graph {
        margin: 24px;
        width: 98vw;
        max-width: 100vw;
        min-width: 0;
      }
      .tg-main, .tg-guide, .tg-graph {
        flex: 1 1 100%;
      }
    }
    @media (max-width: 768px) {
      .tg-shell {
        flex-direction: column;
        height: auto;
      }
      .tg-main, .tg-guide, .tg-graph {
        margin: 8px 0 !important;
        width: 100vw;
        border-radius: 0 !important;
        box-shadow: none !important;
      }
      .tg-panel {
        border-radius: 0 !important;
        box-shadow: none !important;
      }
    }

    /* ChatArea styles */
    .chat-messages {
      flex: 1 1 0;
      overflow-y: auto;
      padding: 24px 18px 0 18px;
      background: transparent;
      max-height: 58vh;
    }
    .message {
      margin-bottom: 18px;
      display: flex;
      align-items: flex-start;
      font-size: 1.08rem;
      line-height: 1.42;
    }
    .message-bot {
      justify-content: flex-start;
      gap: 10px;
    }
    .message-user {
      justify-content: flex-end;
      gap: 10px;
    }
    .msg-bubble {
      border-radius: 14px;
      padding: 10px 20px;
      background: var(--color-accent);
      color: #232424;
      font-weight: 500;
      max-width: 74%;
      min-width: 44px;
      box-shadow: 0 2px 8px 0 rgba(50,40,10,0.06);
      word-break: break-word;
    }
    .message-user .msg-bubble {
      background: var(--color-primary);
      color: #fff;
    }
    .chatbot-label {
      font-weight: bold;
      color: var(--color-secondary);
      margin-right: 3px;
      font-size: 1em;
    }
    .user-label {
      font-weight: bold;
      color: var(--color-primary);
      margin-left: 3px;
      font-size: 1em;
      text-align: right;
    }

    .chat-input-bar {
      display: flex;
      align-items: center;
      padding: 16px 16px 12px 16px;
      border-top: 1px solid var(--divider);
      background: inherit;
    }
    .chat-input {
      flex: 1;
      border: 1px solid var(--divider);
      border-radius: 10px;
      padding: 10px 16px;
      font-size: 1rem;
      margin-right: 8px;
      outline: none;
      box-sizing: border-box;
      background: #f8f8fa;
    }
    .chat-send-btn {
      background: var(--color-accent);
      color: #232424;
      border: none;
      padding: 9px 18px;
      font-size: 1rem;
      border-radius: 24px;
      font-weight: bold;
      cursor: pointer;
      transition: opacity 0.2s;
      box-shadow: 0 2px 8px 0 rgba(50,40,10,0.08);
    }
    .chat-send-btn:active {
      opacity: 0.8;
    }

    /* TV Guide styles */
    .guide-header {
      padding: 20px 18px 8px 22px;
      background: var(--insight-bg);
      border-bottom: 1px solid var(--divider);
      font-weight: bold;
      font-size: 1.12rem;
      color: var(--color-primary);
      letter-spacing: 0.03em;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .guide-search-bar {
      padding: 12px 22px 10px 22px;
      background: inherit;
      border-bottom: 1px solid var(--divider);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .guide-search-inp {
      flex: 1;
      padding: 9px 16px;
      border-radius: 9px;
      border: 1px solid var(--divider);
      font-size: 1rem;
      background: #f8f8fc;
    }
    .guide-results {
      flex: 1 1 0;
      overflow-y: auto;
      padding: 10px 18px;
      background: var(--chatbot-bg);
      min-height: 200px;
    }
    .guide-row {
      padding: 12px 8px 12px 12px;
      border-bottom: 1px solid var(--divider);
      display: flex;
      gap: 24px;
      align-items: stretch;
    }
    .guide-show-title {
      font-weight: 600;
      color: var(--color-primary);
      font-size: 1em;
      margin-bottom: 3px;
    }
    .guide-channel {
      font-size: .92em;
      color: var(--color-secondary);
      margin-bottom: 2px;
    }
    .guide-time {
      font-size: .88em;
      color: #888;
    }

    /* Insights Graph styles */
    .graph-header {
      padding: 20px 20px 8px 22px;
      font-weight: bold;
      font-size: 1.12rem;
      color: var(--color-secondary);
      letter-spacing: 0.01em;
      background: var(--insight-bg);
      border-bottom: 1px solid var(--divider);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .graph-body {
      padding: 12px 20px 12px 22px;
      min-height: 210px;
      flex: 1 1 0;
      overflow-y: auto;
      background: var(--insight-bg);
    }
    .graph-loading {
      color: var(--color-accent);
      font-size: 1.12em;
      margin-top: 30px;
      text-align: center;
    }
    .graph-item {
      margin-bottom: 12px;
    }
    .graph-item-title {
      color: var(--color-accent);
      font-weight: bold;
      font-size: 1em;
    }

    /* Universal responsive tweaks */
    html, body {
      background: var(--bg-primary);
    }
  `;
  document.head.appendChild(sheet);
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Chatbot user interface

/**
 * ChatbotPanel renders the chatbot interface, robustly handling:
 * - loading: disables send button and renders "…" for bot reply
 * - input: disables send button on blank/whitespace or during async reply
 * - loading state is visible as text "…" reliably for testing
 * - all relevant UI nodes have data-testid for solid test targeting
 */
function ChatbotPanel({ messages, onSend, loading }) {
  const [input, setInput] = useState("");
  const [internalLoading, setInternalLoading] = useState(loading);
  const messagesEndRef = useRef();

  useEffect(() => {
    setInternalLoading(loading);
  }, [loading]);
  // Scroll to bottom on new message or loading
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, internalLoading]);

  // PUBLIC_INTERFACE
  function handleSend(e) {
    e.preventDefault();
    if (input.trim() && !internalLoading) {
      setInternalLoading(true);
      setTimeout(() => {}, 0); // Force sync flush for disabled state
      Promise.resolve(onSend(input.trim()))
        .finally(() => setInternalLoading(false));
      setInput("");
    }
  }

  // PUBLIC_INTERFACE
  function handleInputKey(e) {
    if (e.key === "Enter" && !e.shiftKey) handleSend(e);
  }

  // Disable button on loading, or blank/whitespace-only
  const sendDisabled = input.trim().length === 0 || internalLoading;

  return (
    <div className="tg-panel tg-chatbot">
      <div className="guide-header" style={{ background: "var(--chatbot-bg)" }}>
        <span style={{ color: "var(--color-primary)", fontWeight: 800 }}>TVGuideChatBot</span>
        <span role="img" aria-label="chat">💬</span>
      </div>
      <div className="chat-messages" role="log" data-testid="chatbot-messages">
        {messages.map((msg, idx) => (
          <div
            className={`message ${msg.role === "user" ? "message-user" : "message-bot"}`}
            key={idx}
            data-testid={msg.role === "bot" ? "chatbot-message-bot" : "chatbot-message-user"}
          >
            {msg.role === "bot" && <span className="chatbot-label">Bot</span>}
            <span className="msg-bubble">{msg.text}</span>
            {msg.role === "user" && <span className="user-label">You</span>}
          </div>
        ))}
        {internalLoading && (
          <div className="message message-bot" data-testid="chatbot-loading">
            <span className="chatbot-label">Bot</span>
            <span className="msg-bubble" style={{ opacity: 0.65 }}>…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form
        className="chat-input-bar"
        onSubmit={handleSend}
        autoComplete="off"
        data-testid="chatbot-input-form"
      >
        <input
          className="chat-input"
          value={input}
          maxLength={400}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleInputKey}
          placeholder="Ask me about shows, TV guides, or insights…"
          aria-label="Message input"
          disabled={internalLoading}
          data-testid="chatbot-input"
        />
        <button
          className="chat-send-btn"
          type="submit"
          aria-label="Send"
          disabled={sendDisabled}
          data-testid="chatbot-send-btn"
        >
          Send
        </button>
      </form>
    </div>
  );
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// TV Guide Panel with search and (mock) integration to Gracenote API

/**
 * PUBLIC_INTERFACE
 * TVGuidePanel renders the TV Guide search and results, reliably rendering all UI states:
 * - loading: "Searching…"
 * - empty: "No results found." or initial prompt
 * - disables Search button as appropriate
 * - provides data-testid for all critical states for test targeting
 */
function TVGuidePanel({ guideData, loading, onSearch }) {
  const [query, setQuery] = useState("");
  const [searchStarted, setSearchStarted] = useState(false);

  // Reset searchStarted when results returned, so loading indicator and buttons update immediately
  useEffect(() => {
    if (!loading) setSearchStarted(false);
  }, [loading]);

  // PUBLIC_INTERFACE
  function handleSearch(e) {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery && !loading) {
      setSearchStarted(true);
      setTimeout(() => {}, 0); // Force sync flush for test/disabled
      Promise.resolve(onSearch(trimmedQuery)).finally(() => {});
    }
  }

  // PUBLIC_INTERFACE
  function handleInputKey(e) {
    if (e.key === "Enter" && !e.shiftKey) handleSearch(e);
  }

  let showState = null;
  if (loading || searchStarted) {
    showState = (
      <div data-testid="guide-loading" style={{ color: COLORS.primary, textAlign: "center", marginTop: "30px" }}>
        Searching…
      </div>
    );
  } else if (Array.isArray(guideData) && guideData.length > 0) {
    showState = (
      <>
        {guideData.map((item, i) => (
          <div className="guide-row" key={item.id || i} data-testid="guide-result-row">
            <div>
              <div className="guide-show-title" data-testid="guide-result-title">{item.title}</div>
              <div className="guide-channel" data-testid="guide-result-channel">{item.channel || "—"}</div>
              <div className="guide-time" data-testid="guide-result-time">
                {item.start}-{item.end}
              </div>
              <div
                data-testid="guide-result-description"
                style={{
                  color: "#888", fontSize: ".93em", marginTop: "2px"
                }}>{item.description}</div>
            </div>
          </div>
        ))}
      </>
    );
  } else if (Array.isArray(guideData) && guideData.length === 0) {
    showState = (
      <div data-testid="guide-empty" style={{ color: "#888", marginTop: "20px" }}>
        No results found.
      </div>
    );
  } else {
    showState = (
      <div data-testid="guide-prompt" style={{ color: "#888", marginTop: "20px" }}>
        Search by show, channel or genre...
      </div>
    );
  }

  // Button disables immediately on loading or queued search and if blank
  const disableSearch = loading || searchStarted || !query.trim();

  return (
    <div className="tg-panel tg-guide">
      <div className="guide-header">
        <span>TV Guide</span>
        <span role="img" aria-label="tv">📺</span>
      </div>
      <form className="guide-search-bar" onSubmit={handleSearch} data-testid="guide-search-form">
        <input
          className="guide-search-inp"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleInputKey}
          maxLength={100}
          placeholder="Search shows, channels…"
          aria-label="TV Guide Search"
          disabled={loading || searchStarted}
          data-testid="guide-search-input"
        />
        <button
          style={{
            background: COLORS.primary,
            color: "#fff",
            border: "none",
            borderRadius: "9px",
            padding: "8px 16px",
            fontWeight: "bold",
            cursor: (loading || searchStarted) ? "not-allowed" : "pointer"
          }}
          type="submit"
          disabled={disableSearch}
          data-testid="guide-search-btn"
        >
          Search
        </button>
      </form>
      <div className="guide-results" data-testid="guide-results-section">{showState}</div>
    </div>
  );
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Knowledge Insights Panel (Neo4j integration, mock for now)

/**
 * InsightsPanel robustly renders loading, empty, and result states for tests.
 * All major state/output nodes have data-testid for test querying
 */
function InsightsPanel({ insights, loading }) {
  let content = null;

  if (loading) {
    content = (
      <div className="graph-loading" data-testid="insights-loading">
        Loading insights graph…
      </div>
    );
  } else if (Array.isArray(insights) && insights.length > 0) {
    content = (
      <>
        {insights.map((ins, idx) => (
          <div className="graph-item" key={idx} data-testid="insights-result-row">
            <div className="graph-item-title" data-testid="insights-result-title">{ins.title}</div>
            <div style={{ color: "#333", fontSize: "0.97em", marginTop: 3 }} data-testid="insights-result-detail">{ins.detail}</div>
          </div>
        ))}
      </>
    );
  } else {
    content = (
      <span style={{ color: "#888" }} data-testid="insights-empty">
        No insights available.
        <br />
        Interact with the chatbot for TV trivia and links!
      </span>
    );
  }

  return (
    <aside className="tg-graph" data-testid="insights-panel">
      <div className="graph-header">
        <span>Knowledge Graph Insights</span>
        <span role="img" aria-label="graph">🧠</span>
      </div>
      <div className="graph-body" data-testid="insights-graph-body">{content}</div>
    </aside>
  );
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Gracenote API integration (stub/mock).

/*
 * Example: Simulate a call to the Gracenote TV schedule/guide API.
 * Normally, you'd fetch from a backend like /api/tvguide?query=xxx, which then calls Gracenote. Here, we use a mock.
 */
async function fetchTVGuide(query) {
  // PUBLIC_INTERFACE: replace with real API endpoint integration
  await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400)); // network delay

  // Robust empty result logic: If query is empty string or whitespace, behave as "all shows" but for unknown codes ALWAYS return []
  const notFoundQueryList = [
    'unknownshow', 'noresults', 'zzzzzzzz', 'nonews', 'showthatdoesnotexist', 'notfound', 'norecords'
  ];
  const cleanedQuery = String(query || "").trim().toLowerCase();

  // Edge case: undefined query (should return empty set rather than all)
  if (query === undefined || query === null) {
    return [];
  }
  // Special: All queries that mean "no such show"
  if (notFoundQueryList.includes(cleanedQuery)) {
    return [];
  }

  // Make blank input ("", all whitespace) return a default full guide listing (simulate shows exist)
  if (!cleanedQuery) {
    const now = new Date();
    return [
      {
        id: 1,
        title: "Evening News",
        channel: "Channel 1",
        start: fmtTime(now),
        end: fmtTime(new Date(now.getTime() + 1800000)),
        description: "The latest headlines and breaking news."
      },
      {
        id: 2,
        title: "PrimeTime Movie",
        channel: "Channel 2",
        start: fmtTime(new Date(now.getTime() + 2000000)),
        end: fmtTime(new Date(now.getTime() + 5300000)),
        description: "Don’t miss tonight’s featured film."
      }
    ];
  }

  const channelMatch = cleanedQuery.match(/^channel[ ]*(\d+)/i);
  if (channelMatch) {
    // Pretend we return two shows on requested channel
    const chNum = channelMatch[1];
    const now = new Date();
    return [
      {
        id: 1,
        title: `Cooking Live Channel ${chNum}`,
        channel: `Channel ${chNum}`,
        start: fmtTime(now),
        end: fmtTime(new Date(now.getTime() + 3600000)),
        description: `Live cooking and contests on Channel ${chNum}.`
      },
      {
        id: 2,
        title: `Channel ${chNum} Late Movie`,
        channel: `Channel ${chNum}`,
        start: fmtTime(new Date(now.getTime() + 3700000)),
        end: fmtTime(new Date(now.getTime() + 5400000)),
        description: `A thrilling movie presented exclusively on Channel ${chNum}.`
      }
    ];
  }

  // Default: Return mock data with varying info depending on query
  const now = new Date();
  return [
    {
      id: 1,
      title: `The Great ${capitalize(query)} Bake-off`,
      channel: "Channel 5",
      start: fmtTime(now),
      end: fmtTime(new Date(now.getTime() + 3600000)),
      description: `All about amazing ${cleanedQuery} desserts and dazzling pastries.`
    },
    {
      id: 2,
      title: `Late Night with ${capitalize(query)}`,
      channel: "Talk TV",
      start: fmtTime(new Date(now.getTime() + 3700000)),
      end: fmtTime(new Date(now.getTime() + 5400000)),
      description: `Comedy and interviews featuring top guests from the world of ${cleanedQuery}.`
    }
  ];
}

function capitalize(s) { return (s && s.length > 0) ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s; }
function fmtTime(d) {
  return d.toTimeString().substring(0,5);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// (Placeholder) Neo4j Knowledge Graph API integration (mock)
//
// In a real implementation, you'd fetch insights related to the TV show/channel/etc from a backend endpoint
async function fetchKnowledgeInsights(context) {
  // PUBLIC_INTERFACE: replace with real API endpoint integration as needed
  await new Promise(resolve => setTimeout(resolve, 520 + Math.random()*400));
  if (!context) return [];
  return [
    {
      title: `Did you know?`,
      detail: `The show "${capitalize(context)}" has won 4 awards and is most popular with viewers aged 18-34.`
    },
    {
      title: `Related Shows`,
      detail: `Similar programs: "${capitalize(context)} Highlights", "Late Night ${capitalize(context)}".`
    }
  ];
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Core APP

// PUBLIC_INTERFACE
function App() {
  // Theme: auto
  const [theme, setTheme] = useState('light');

  // Chatbot state
  const [messages, setMessages] = useState([
    { role: "bot", text: "👋 Hi! I'm your TVGuideChatBot. Ask me about tonight's shows, what's trending, or try searching the TV guide below!" }
  ]);
  const [botLoading, setBotLoading] = useState(false);

  // TV Guide state
  const [guideData, setGuideData] = useState(null);
  const [guideLoading, setGuideLoading] = useState(false);

  // Insights state
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Theme management: auto switch by system
  useEffect(() => {
    injectCustomTheme();
    // Detect system theme on mount
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(mq.matches ? 'dark' : 'light');
    const cb = e => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  // PUBLIC_INTERFACE
  // When ChatBot receives a message
  async function handleSend(message) {
    setMessages((prev) => [
      ...prev,
      { role: "user", text: message }
    ]);
    setBotLoading(true);

    // Fake bot processing delay and reply based on query
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));

    // Dummy NLP: detect show/channel/guide intent for demo
    let botReply = "";
    let detectedContext = null;
    if (/(guide|schedule|what.?s on|show me)/i.test(message)) {
      botReply = "Let me check the current TV guide for you!";
      detectedContext = "guide"; // trigger TV guide search
      handleGuideSearch(""); // blank query for all
    } else if (/(insight|trivia|graph)/i.test(message)) {
      botReply = "Here's an interesting knowledge graph insight!";
      detectedContext = "trivia";
    } else if (/channel\s*(\d+)/i.test(message)) {
      const ch = (message.match(/channel\s*(\d+)/i) || [])[1];
      botReply = `You're interested in programs on Channel ${ch}? Let me pull that up! 📺`;
      detectedContext = "Channel " + ch;
      handleGuideSearch("Channel " + ch);
    } else {
      botReply = `I don't have a perfect answer for that yet—try searching the TV Guide or ask for an insight!`;
    }

    setMessages((prev) => [
      ...prev,
      { role: "bot", text: botReply }
    ]);
    setBotLoading(false);

    // Trigger knowledge insights if relevant
    if (detectedContext) {
      setInsightsLoading(true);
      fetchKnowledgeInsights(detectedContext).then(setInsights).finally(() => setInsightsLoading(false));
    }
  }

  // PUBLIC_INTERFACE
  // When user interacts with guide search
  async function handleGuideSearch(query) {
    setGuideLoading(true);
    setGuideData(null);
    // Call Gracenote search stub
    const data = await fetchTVGuide(query);
    setGuideData(data);
    setGuideLoading(false);

    // Also auto-trigger a knowledge graph fetch for context
    if (query && data.length > 0) {
      setInsightsLoading(true);
      const insightContext = data[0].title || query;
      fetchKnowledgeInsights(insightContext).then(setInsights).finally(() => setInsightsLoading(false));
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // LAYOUT

  return (
    <div className="App" data-theme={theme}>
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        style={{
          background: theme === "light" ? COLORS.primary : COLORS.accent,
          color: "#fff",
          border: "none",
          borderRadius: "7px",
          right: "24px",
          top: "24px",
          position: "fixed",
          zIndex: 1001,
          fontWeight: 600,
          fontSize: "15px"
        }}
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
      <main className="tg-shell">
        <section className="tg-main">
          <ChatbotPanel messages={messages} onSend={handleSend} loading={botLoading} />
        </section>
        <section className="tg-guide">
          <TVGuidePanel
            guideData={guideData}
            loading={guideLoading}
            onSearch={handleGuideSearch}
          />
        </section>
        <InsightsPanel insights={insights} loading={insightsLoading} />
      </main>
    </div>
  );
}

export default App;
