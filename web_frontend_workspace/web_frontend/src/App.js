import React, { useState, useEffect } from "react";
import "./App.css";
import ChatbotUI from "./components/ChatbotUI";
import TVGuidePanel from "./components/TVGuidePanel";
import KnowledgeGraphSidePanel from "./components/KnowledgeGraphSidePanel";
import { sendMessage } from "./services/chatbotService";
import { fetchTVGuide, fetchKnowledgeGraph } from "./services/tvGuideService";

function App() {
  const [theme, setTheme] = useState("light");
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Welcome to TVGuideBot! Ask me about TV schedules, trending shows, or actors." },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // TV Guide and Knowledge Graph (stub state)
  const [guideResults, setGuideResults] = useState([]);
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideError, setGuideError] = useState("");
  const [kgInsights, setKGInsights] = useState([]);
  const [kgLoading, setKGLoading] = useState(false);
  const [kgError, setKGError] = useState("");
  const [kgPanelActive, setKGPanelActive] = useState(false);

  // Effect to apply theme to document element
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
      // Example: Send user message to API and get bot reply, guide matches, and insights.
      const resp = await sendMessage(userInput);
      // resp: { reply, guideResults, kgInsights }
      if (resp.reply)
        setMessages((msgs) => [...msgs, { sender: "bot", text: resp.reply }]);
      if (resp.guideResults) setGuideResults(resp.guideResults);
      if (resp.kgInsights) setKGInsights(resp.kgInsights);
      setGuideError("");
      setKGError("");
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

  return (
    <div className="App">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
      <h1 className="title" style={{ marginBottom: 6, marginTop: 16 }}>TVGuideChatBot</h1>
      <p className="subtitle" style={{ color: "var(--text-secondary)", margin: 0 }}>
        Your smart assistant for TV schedules, shows, and graph-powered recommendations!
      </p>
      <div style={{
        display: "flex",
        width: "100%",
        marginTop: 18,
        alignItems: "stretch",
        justifyContent: "center"
      }}>
        <div style={{
          flex: "2 1 520px",
          maxWidth: 670,
          marginLeft: 0,
          marginRight: 24
        }}>
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
        <KnowledgeGraphSidePanel
          insights={kgInsights}
          loading={kgLoading}
          error={kgError}
          active={kgPanelActive}
        />
      </div>
      <footer style={{
        marginTop: 36,
        color: "var(--text-secondary)",
        fontSize: "0.96rem"
      }}>
        &copy; {new Date().getFullYear()} TVGuideChatBot &middot; Powered by Gracenote and KG
      </footer>
    </div>
  );
}

export default App;
