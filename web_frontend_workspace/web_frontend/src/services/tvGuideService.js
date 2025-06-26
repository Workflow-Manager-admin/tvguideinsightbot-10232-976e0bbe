//
// tvGuideService.js - Service to communicate with backend TV Guide/Gracenote APIs for schedule/search.
//
/**
 * Service API for TVGuideChatBot frontend.
 * Includes: fetchTVGuide(query), fetchKnowledgeGraph(context).
 */
// PUBLIC_INTERFACE
export async function fetchTVGuide(query) {
  // Placeholder: Replace with real API endpoint.
  const url = `/api/tvguide/search?q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TV Guide search failed (${res.status})`);
  return await res.json();
}

// PUBLIC_INTERFACE
export async function fetchKnowledgeGraph(context) {
  // Placeholder: Replace with real endpoint.
  const url = `/api/kg/insights?context=${encodeURIComponent(context)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Knowledge Graph fetch failed (${res.status})`);
  return await res.json();
}
