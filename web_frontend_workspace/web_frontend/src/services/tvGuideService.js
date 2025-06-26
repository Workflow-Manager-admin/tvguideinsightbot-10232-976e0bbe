//
// tvGuideService.js - Service to communicate with backend TV Guide/Gracenote APIs for schedule/search.
//
// MOCK/STUB IMPLEMENTATION
// Replace all mock logic and endpoint URLs with real Gracenote integration for production.
// Clearly documented for easy future expansion.
//

/**
 * PUBLIC_INTERFACE
 * Fetch TV Guide search results for a given query.
 * @param {string} query - Search query, e.g., show name, channel, time.
 * @returns {Promise<Array>} Resolves with an array of schedule/show result objects.
 *
 * Integration note:
 * - Replace mock logic with a real backend call to Gracenote APIs or your backend's TV schedule endpoint.
 * - Real usage: Add Gracenote credentials (API key, etc.) and endpoint details as required.
 */
export async function fetchTVGuide(query) {
  // MOCK IMPLEMENTATION: Replace with real API endpoint for production.
  // Example production usage (to be implemented):
  // const url = `https://data.tmsapi.com/v1.1/programs/search?api_key=YOUR_GRACENOTE_API_KEY&query=${encodeURIComponent(query)}`
  // const res = await fetch(url);
  // Integrate proper API credentials, backend proxy, error handling, etc.

  // Stub/mock: Return static sample data.
  return [
    {
      title: "Supernatural",
      channel: "CW",
      time: "8:00 PM",
      description: "Sam and Dean hunt supernatural entities threatening the world."
    },
    {
      title: "Planet Earth II",
      channel: "BBC America",
      time: "9:30 PM",
      description: "Documentary series exploring wildlife across the globe."
    }
  ];
}

/**
 * PUBLIC_INTERFACE
 * [DEPRECATED for direct KG, now in neo4jService.js]
 * Fetch knowledge graph insights (legacy stub).
 * @param {string} context - Query or context for knowledge graph (e.g., show, actor).
 * @returns {Promise<Array>} Resolves with an array, empty in this stub.
 *
 * Integration note:
 * - This was used as a pass-through for knowledge graph; recommend migrating all KG calls to neo4jService.js.
 */
export async function fetchKnowledgeGraph(context) {
  // DEPRECATED: Use neo4jService.js for actual knowledge graph access.
  return [];
}
