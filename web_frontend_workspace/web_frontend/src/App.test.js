import React from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import App from './App';

/**
 * Helper to dump relevant DOM for diagnostics if a test fails at a testid lookup or assertion.
 */
function debugIfFail(assertion, message) {
  try {
    assertion();
  } catch (err) {
    // Output the current document
    // eslint-disable-next-line no-console
    console.log(
      "*** TEST FAILURE DEBUG OUTPUT ***",
      message,
      "\nCurrent DOM:\n",
      document.body.innerHTML
    );
    throw err; // rethrow
  }
}
/**
 * This file rigorously tests all async, timer, and UI update flows for the TVGuideChatBot app.
 * All async state changes, timers, and user interactions are properly wrapped in act().
 * Fake timers are set up before each test and restored after, guaranteeing deterministic and isolated async flows.
 * All relevant microtasks are explicitly flushed after timers.
 */

/**
 * Utility: Forces all pending timers (setTimeout, setInterval) to run instantly and flushes microtasks.
 * Use in conjunction with jest.useFakeTimers() for deterministic tests.
 */
const flushPromises = async () => {
  // Run all pending timers, then let any microtasks resolve
  await act(async () => {
    jest.runOnlyPendingTimers();
    await Promise.resolve();
  });
};

describe('TVGuideChatBot App', () => {
  beforeAll(() => {
    jest.setTimeout(10000); // Allow long test times for async flows
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all timers to fake timers, set clock for consistency
    jest.useFakeTimers().setSystemTime(new Date('2024-01-01T18:00:00Z'));
  });

  afterEach(() => {
    // Flush timers for any remaining timeouts
    act(() => {
      try {
        jest.runOnlyPendingTimers();
      } catch (e) { /* ignore if already run */ }
    });
    jest.useRealTimers();
    cleanup(); // remove any attached DOM for test isolation
  });

  // Utility: Render App - within act for async effects flush
  const setup = async () => {
    await act(async () => {
      render(<App />);
      await flushPromises();
    });
  };

  test('renders initial chatbot greeting and panel layout', async () => {
    await setup();
    // Panel presence robustly using testid:
    debugIfFail(() => expect(screen.getByTestId("chatbot-messages")).toBeInTheDocument(), "Check chatbot-messages panel exists");
    debugIfFail(() => expect(screen.getByTestId("tvguide-panel")).toBeInTheDocument(), "Check tvguide-panel exists");
    debugIfFail(() => expect(screen.getByTestId("insights-panel")).toBeInTheDocument(), "Check insights-panel exists");
    // Panel headers and greeting
    debugIfFail(() => expect(screen.getByText("TVGuideChatBot")).toBeInTheDocument(), "Check TVGuideChatBot header exists");
    debugIfFail(() => expect(screen.getByLabelText(/Message input/i)).toBeInTheDocument(), "Check chatbot input present");
    debugIfFail(() => expect(screen.getByLabelText(/TV Guide Search/i)).toBeInTheDocument(), "Check guide input present");
    debugIfFail(() => expect(screen.getByText('Knowledge Graph Insights')).toBeInTheDocument(), "Check insights panel header");
    debugIfFail(
      () => expect(screen.getByText(/I'm your TVGuideChatBot/i)).toBeInTheDocument(),
      "Check bot greeting"
    );
  });

  test('theme toggle switches theme and button text', async () => {
    await setup();
    const toggle = screen.getByRole('button', { name: /switch to dark mode/i });
    debugIfFail(() => expect(toggle).toBeInTheDocument(), "Theme toggle 'dark' presence");
    await act(async () => {
      fireEvent.click(toggle);
      await flushPromises();
    });
    debugIfFail(
      () => expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument(),
      "Theme toggle 'light' presence"
    );
  });

  test('chatbot allows user messaging, disables on loading, and bot responds', async () => {
    await setup();
    const input = screen.getByLabelText(/Message input/i);
    const sendBtn = screen.getByTestId('chatbot-send-btn');

    // Initial state: input blank, send disabled
    debugIfFail(() => expect(input.value).toBe(''), "Chatbot input should be blank");
    debugIfFail(() => expect(sendBtn).toBeDisabled(), "Chatbot sendBtn should be disabled");

    // Simulate user typing message
    await act(async () => {
      fireEvent.change(input, { target: { value: "What's on tonight?" } });
      await Promise.resolve();
    });
    debugIfFail(() => expect(input.value).toBe("What's on tonight?"), "Chatbot input value after type");
    debugIfFail(() => expect(sendBtn).not.toBeDisabled(), "Chatbot sendBtn enabled after user input");

    // Send message
    await act(async () => {
      fireEvent.click(sendBtn);
      await Promise.resolve();
    });

    // Message appears as "You"
    await waitFor(() => {
      debugIfFail(
        () => expect(screen.getByTestId('chatbot-message-user')).toHaveTextContent("What's on tonight?"),
        "User-to-bot message should appear"
      );
    });

    // "…" shown while bot loading (by testid, robust to text changes)
    debugIfFail(() => expect(screen.getByTestId('chatbot-loading')).toBeInTheDocument(), "Bot loading indicator");

    // Advance all timers for bot's fake async reply and effects
    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
      await flushPromises();
    });

    // Bot reply should now appear (using testid, robust)
    await waitFor(() => {
      debugIfFail(
        () => expect(screen.getByTestId('chatbot-message-bot')).toHaveTextContent(/Let me check the current TV guide/i),
        "Bot reply to user"
      );
    });
  });

  test('TVGuidePanel search: input, search button, loading and no results states', async () => {
    await setup();
    const guideInput = screen.getByTestId('guide-search-input');
    const searchBtn = screen.getByTestId('guide-search-btn');

    debugIfFail(() => expect(guideInput.value).toBe(''), "Guide input blank before search");
    debugIfFail(() => expect(searchBtn).toBeDisabled(), "Guide searchBtn disabled with blank input");

    await act(async () => {
      fireEvent.change(guideInput, { target: { value: 'cake' } });
      await flushPromises();
    });
    debugIfFail(() => expect(searchBtn).not.toBeDisabled(), "Guide searchBtn enabled after input");

    // Start search
    await act(async () => {
      fireEvent.click(searchBtn);
      await flushPromises();
    });

    // Loading label appears (check using findByTestId to wait for async, robust to split text)
    debugIfFail(
      async () => expect(await screen.findByTestId('guide-loading-indicator')).toBeInTheDocument(),
      "Guide loading indicator during async search"
    );

    // Simulate fetchTVGuide delay
    await act(async () => {
      jest.runOnlyPendingTimers();
      await flushPromises();
    });

    // Guide shows results (by list testid and rows)
    const list = await screen.findByTestId('guide-content-list');
    debugIfFail(() => expect(list).toBeInTheDocument(), "Guide results list appears");
    debugIfFail(
      async () => expect(await screen.findByTestId('guide-result-title-0')).toHaveTextContent(/Great Cake Bake-off/i),
      "Guide first result title"
    );
    debugIfFail(() => expect(screen.getByTestId('guide-result-title-1')).toHaveTextContent(/Late Night with Cake/i), "Guide second result title");
    debugIfFail(() => expect(screen.getByTestId('guide-result-channel-0')).toHaveTextContent(/Channel 5/i), "Guide first channel");
    debugIfFail(() => expect(screen.getByTestId('guide-result-channel-1')).toHaveTextContent(/Talk TV/i), "Guide second channel");
    debugIfFail(() => expect(screen.getByTestId('guide-result-description-0')).toHaveTextContent(/desserts/), "Guide first description");
    debugIfFail(() => expect(screen.getByTestId('guide-result-description-1')).toHaveTextContent(/guests/), "Guide second description");
  });

  test('TVGuidePanel shows "No results found." if guideData is empty', async () => {
    await setup();
    // Simulate search for no results
    const guideInput = screen.getByTestId('guide-search-input');
    const searchBtn = screen.getByTestId('guide-search-btn');

    await act(async () => {
      fireEvent.change(guideInput, { target: { value: 'unknownshow' } });
      await flushPromises();
    });
    await act(async () => {
      fireEvent.click(searchBtn);
      await flushPromises();
    });

    await act(async () => {
      jest.runOnlyPendingTimers();
      await flushPromises();
    });
    debugIfFail(() => expect(screen.getByTestId('guide-empty-state')).toBeInTheDocument(), "Guide empty state");
  });

  test('InsightsPanel displays loading and result states', async () => {
    await setup();
    // Trigger insight flow
    const input = screen.getByLabelText(/Message input/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Give an insight' } });
      await Promise.resolve();
    });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', code: 13 });
      await Promise.resolve();
    });

    // Loading label appears while fetching insights
    debugIfFail(
      async () => expect(await screen.findByTestId('insights-loading-indicator')).toBeInTheDocument(),
      "Insights loading indicator"
    );

    // Advance timers and async for loaded state
    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
      await flushPromises();
    });

    // Insights rendered (use data-testid for async robustness)
    const list = await screen.findByTestId('insights-content-list');
    debugIfFail(() => expect(list).toBeInTheDocument(), "Insights result list appears");
    debugIfFail(() => expect(screen.getByTestId('insights-result-title-0')).toHaveTextContent(/Did you know/i), "Insights title 0");
    debugIfFail(() => expect(screen.getByTestId('insights-result-detail-0')).toHaveTextContent(/has won 4 awards/i), "Insights detail 0");
    debugIfFail(() => expect(screen.getByTestId('insights-result-title-1')).toHaveTextContent(/Related Shows/i), "Insights title 1");
  });

  test('InsightsPanel displays empty state before interaction', async () => {
    await setup();
    debugIfFail(() => expect(screen.getByTestId('insights-empty-state')).toBeInTheDocument(), "Insights panel initial empty state");
  });

  test('Button disables and re-enables correctly on bot loading', async () => {
    await setup();
    const input = screen.getByLabelText(/Message input/i);
    const sendBtn = screen.getByTestId('chatbot-send-btn');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'guide' } });
      await flushPromises();
    });
    debugIfFail(() => expect(sendBtn).not.toBeDisabled(), "Chatbot sendBtn enabled before submit");
    await act(async () => {
      fireEvent.click(sendBtn);
      await flushPromises();
      // Should disable instantly during loading
      debugIfFail(() => expect(sendBtn).toBeDisabled(), "Chatbot sendBtn disables on bot loading");
      jest.runOnlyPendingTimers();
      await flushPromises();
    });
    await waitFor(() => debugIfFail(() => expect(sendBtn).not.toBeDisabled(), "Chatbot sendBtn re-enabled after loading"));
  });

  test('ChatbotPanel disables send button when input is empty or whitespace', async () => {
    await setup();
    const input = screen.getByLabelText(/Message input/i);
    const sendBtn = screen.getByTestId('chatbot-send-btn');
    debugIfFail(() => expect(sendBtn).toBeDisabled(), "Send button disabled on blank");
    await act(async () => {
      fireEvent.change(input, { target: { value: '   ' } });
      await flushPromises();
    });
    debugIfFail(() => expect(sendBtn).toBeDisabled(), "Send button disabled on whitespace");
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Show me trivia!' } });
      await flushPromises();
    });
    debugIfFail(() => expect(sendBtn).not.toBeDisabled(), "Send button enabled with non-whitespace");
  });

  test('TVGuidePanel disables search button on loading', async () => {
    await setup();
    const guideInput = screen.getByTestId('guide-search-input');
    const searchBtn = screen.getByTestId('guide-search-btn');
    await act(async () => {
      fireEvent.change(guideInput, { target: { value: 'abc' } });
      fireEvent.click(searchBtn);
      await flushPromises();
    });
    debugIfFail(() => expect(searchBtn).toBeDisabled(), "Guide searchBtn disables on loading");
  });

  test('Handles chat "channel" intent, triggers guide and insight logic', async () => {
    await setup();
    const input = screen.getByLabelText(/Message input/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Channel 12 shows' } });
      await Promise.resolve();
    });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', code: 13 });
      await Promise.resolve();
    });

    // Bot message should relate to channel
    await waitFor(() => {
      debugIfFail(
        () => expect(screen.getByTestId('chatbot-message-bot')).toHaveTextContent(/Channel 12/),
        "Bot reply contains channel"
      );
    });

    // Advance all timers and flush for both guide & insights
    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
      await flushPromises();
    });

    // TV guide panel present and populated
    await waitFor(() => {
      debugIfFail(() => expect(screen.getByTestId('tvguide-panel')).toBeInTheDocument(), "TVGuide panel present after channel query");
    });
    debugIfFail(() => expect(screen.getByTestId('insights-panel')).toBeInTheDocument(), "Insights panel present after channel query");
    await waitFor(() => {
      // Wait for results to finish loading
      debugIfFail(() =>
        expect(screen.getByTestId('guide-results-section').textContent).not.toMatch(/Searching…/),
        "Guide results should not be in loading state"
      );
    });
    debugIfFail(() => expect(screen.queryByTestId('insights-content-list')).toBeTruthy(), "Insights result present after channel query");
  });
});

/**
 * NOTE FOR MAINTAINERS:
 * - All async state logic, effects, and event triggers are wrapped in act() or waited-for using waitFor.
 * - Jest fake timers are advanced for all async delays.
 * - All async user/DOM events are used within act() and flushed with flushPromises for reliability.
 * - Any new async UI logic or network mocking added should follow this pattern for async safety in React 18+.
 */
