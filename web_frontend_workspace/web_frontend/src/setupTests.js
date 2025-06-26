// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
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
