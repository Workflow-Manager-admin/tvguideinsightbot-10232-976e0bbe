// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
if (typeof setImmediate === 'undefined') {
  // Polyfill setImmediate using setTimeout for environments like jsdom/Jest that lack it
  global.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
}
import '@testing-library/jest-dom';

// Mock scrollIntoView (jsdom does not implement it)
if (typeof window.HTMLElement !== "undefined" && !window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = function() {};
}

// Mock window.matchMedia for theme and responsive tests
if (typeof window.matchMedia !== "function") {
  window.matchMedia = function() {
    return {
      matches: false,
      addEventListener: function() {},
      removeEventListener: function() {},
      addListener: function() {},
      removeListener: function() {},
      dispatchEvent: function() {},
    };
  };
}

// --- Fast artificial delay mocks for test environment ---
// Many API stubs in App.js use "await new Promise(resolve => setTimeout(resolve, X))" to simulate artificial delay.
// To make all such test flows (fetchTVGuide, fetchKnowledgeInsights, and fake bot delay) run instantly in tests,
// we patch global setTimeout in test scope to resolve immediately if the call stack includes these API mocks.
const IS_JEST = typeof jest !== "undefined";
if (IS_JEST) {
  // Save the real setTimeout and patch global setTimeout so `setTimeout(fn, ...)` with a function from an async
  // mock (like in App.js) will resolve quickly.
  const realSetTimeout = global.setTimeout;
  global.setTimeout = (fn, ms, ...args) => {
    // If inside a test, avoid long delays in fake API or mock reactions; always run instantly (ms=0).
    // Some async utilities (e.g., in flushPromises) rely on zero-delay setTimeout, so that's preserved.
    if (typeof ms === "number" && ms > 10 && ms < 3000 && (
      // Heuristic: This covers the artificial delays in App.js fetchTVGuide, fetchKnowledgeInsights, fake bot answer.
      (new Error().stack ?? "").includes("fetchTVGuide") ||
      (new Error().stack ?? "").includes("fetchKnowledgeInsights") ||
      (new Error().stack ?? "").includes("handleSend") ||
      (new Error().stack ?? "").includes("App.test.js")
    )) {
      return realSetTimeout(fn, 0, ...args);
    }
    return realSetTimeout(fn, ms, ...args);
  };
}
