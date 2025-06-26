import React, { useState, useEffect } from "react";
import "./App.css";
import ChatbotUI from "./components/ChatbotUI";
import TVGuidePanel from "./components/TVGuidePanel";
import KnowledgeGraphSidePanel from "./components/KnowledgeGraphSidePanel";
import { sendMessage } from "./services/chatbotService";

/**
 * App - Main UI component composing chatbot, TV Guide, and Knowledge Graph insight side panel.
 * Handles state sharing between panels and ensures a responsive, modern layout.
 */
function App() {
  // Theme
  const [theme, setTheme] = useState("light");

  // Chat related state
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Welcome to TVGuideBot! Ask me about TV schedules, trending shows, or actors.",
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // TV Guide data state
  const [guideResults, setGuideResults] = useState([]);
  const [guideLoading] = useState(false); // TVGuidePanel loading stub (expand if fetching TV Guide directly)
  const [guideError] = useState(""); // TVGuidePanel error stub

  // Knowledge Graph insights state
  const [kgInsights, setKGInsights] = useState([]);
  const [kgLoading] = useState(false); // Knowledge graph loading stub (expand if fetching directly)
  const [kgError] = useState(""); // Knowledge Graph error stub
  const [kgPanelActive, setKGPanelActive] = useState(false);

  // Apply chosen theme to root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  // PUBLIC_INTERFACE
  const handleSendMessage = async (userInput) => {
    setMessages((msgs) => [...msgs, { sender: "user", text: userInput }]);
    setChatLoading(true);
    try {
      // Send user input, receive bot reply and (optionally) TV guide/insight data.
      const resp = await sendMessage(userInput);
      // resp = { reply, guideResults, kgInsights }
      if (resp.reply)
        setMessages((msgs) => [...msgs, { sender: "bot", text: resp.reply }]);
      if (resp.guideResults) setGuideResults(resp.guideResults);
      if (resp.kgInsights) setKGInsights(resp.kgInsights);
      setKGPanelActive(!!resp.kgInsights && resp.kgInsights.length > 0);
    } catch (e) {
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: "Sorry, there was a technical problem. Try again soon." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Responsive flexbox layout: Main column, TV/chat left, graph panel right (collapsible)
  return (
    <div className="App">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
      <h1 className="title" style={{ marginBottom: 6, marginTop: 16 }}>
        TVGuideChatBot
      </h1>
      <p className="subtitle" style={{ color: "var(--text-secondary)", margin: 0 }}>
        Your smart assistant for TV schedules, shows, and graph-powered recommendations!
      </p>
      {/* Main layout row: TV Guide/chat (left), KG panel (right, collapsible on small screens) */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          width: "100%",
          marginTop: 18,
          alignItems: "stretch",
          justifyContent: "center",
          minHeight: 420,
        }}
      >
        {/* Main panels column */}
        <div
          style={{
            flex: "2 1 480px",
            maxWidth: 670,
            minWidth: 0,
            marginLeft: 0,
            marginRight: 24,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <ChatbotUI
            onSendMessage={handleSendMessage}
            messages={messages}
            loading={chatLoading}
          />
          <TVGuidePanel
            guideResults={guideResults}
            loading={guideLoading}
            error={guideError}
          />
        </div>
        {/* KnowledgeGraph Side Panel */}
        <KnowledgeGraphSidePanel
          insights={kgInsights}
          loading={kgLoading}
          error={kgError}
          active={kgPanelActive}
        />
      </div>
      <footer
        style={{
          marginTop: 36,
          color: "var(--text-secondary)",
          fontSize: "0.96rem",
        }}
      >
        &copy; {new Date().getFullYear()} TVGuideChatBot &middot; Powered by Gracenote and KG
      </footer>
    </div>
  );
}

export default App;
