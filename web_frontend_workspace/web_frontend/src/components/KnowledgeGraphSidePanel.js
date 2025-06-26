import React from "react";
import "../styles/KnowledgeGraphSidePanel.css";

/**
 * KnowledgeGraphSidePanel shows knowledge graph insights based on chat/TV Guide context.
 * Can show nodes, relationships, visual highlights, or textual summaries.
 */
// PUBLIC_INTERFACE
function KnowledgeGraphSidePanel({ insights, loading, error, active }) {
  return (
    <aside className={`kg-side-panel ${active ? "open" : "closed"}`}>
      <h3>Knowledge Graph Insights</h3>
      {loading && <p>Loading insights...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (!insights || insights.length === 0) && (
        <p>No graph insights yet. Engage with the chatbot or TV guide for deeper context!</p>
      )}
      <ul className="kg-list">
        {!loading &&
          !error &&
          insights &&
          insights.map((item, idx) => (
            <li key={idx} className="kg-insight">
              {item.type === "node" && (
                <div>
                  <span className="kg-node">{item.label}</span>
                  <span className="kg-props">{item.properties && JSON.stringify(item.properties)}</span>
                </div>
              )}
              {item.type === "edge" && (
                <div>
                  <span className="kg-relationship">{item.label}</span>
                  <span className="kg-edge-from">{item.from}</span>
                  <span>{" ➔ "}</span>
                  <span className="kg-edge-to">{item.to}</span>
                </div>
              )}
              {item.type === "text" && <span>{item.text}</span>}
            </li>
          ))}
      </ul>
    </aside>
  );
}
export default KnowledgeGraphSidePanel;
