//
// chatbotService.js - Service for interacting with chatbot API.
//
/**
 * Provides sendMessage(message) for bot backend interaction.
 */
// PUBLIC_INTERFACE
export async function sendMessage(message) {
  // Placeholder for real endpoint
  const url = `/api/chat`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(`Chatbot error (${res.status})`);
  return await res.json();
}
