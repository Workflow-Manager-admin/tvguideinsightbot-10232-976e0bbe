import React from "react";
import "../styles/TVGuidePanel.css";

/**
 * TVGuidePanel displays TV guide search results: shows, times, channels, etc.
 * Receives TV guide data and displays it responsively, with summary/list/tile support.
 */
// PUBLIC_INTERFACE
function TVGuidePanel({ guideResults, loading, error }) {
  if (loading)
    return (
      <div className="tv-guide-panel loading">
        <p>Loading TV Guide...</p>
      </div>
    );
  if (error)
    return (
      <div className="tv-guide-panel error">
        <p>Error loading TV guide: {error}</p>
      </div>
    );
  if (!guideResults || guideResults.length === 0)
    return (
      <div className="tv-guide-panel empty">
        <p>No TV shows found matching your query. Try a different search.</p>
      </div>
    );

  return (
    <div className="tv-guide-panel">
      <h3>TV Guide Results</h3>
      <div className="guide-list">
        {guideResults.map((item, i) => (
          <div className="tv-show-card" key={i}>
            <div className="show-info">
              <div className="show-title">{item.title}</div>
              <div className="show-details">
                <span className="channel">{item.channel}</span>
                <span className="time">{item.time}</span>
              </div>
            </div>
            <div className="show-description">{item.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TVGuidePanel;
