import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
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
 * Utility: Forces all pending timers (setTimeout, setInterval) to run instantly and flushes microtasks.
 * Used for deterministic fake-timer-based async React/UI tests.
 */
const flushTimersAndPromises = async () => {
  // Wrap all flushes of timers/microtasks within act
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
    // Drain timers for any remaining timeouts
    try { jest.runOnlyPendingTimers(); } catch {}
    jest.useRealTimers();
    cleanup(); // DOM isolation
  });

  // Utility: Render App
  const setup = async () => {
    // Always wrap app render in act for strict async state update handling
    await act(async () => {
      render(<App />);
    });
    await flushTimersAndPromises(); // allow effects and paint
  };

  test('renders initial chatbot greeting and panel layout', async () => {
    await setup();
    await waitFor(() => expect(screen.getByTestId("chatbot-messages")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId("tvguide-panel")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId("insights-panel")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("TVGuideChatBot")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByLabelText(/Message input/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByLabelText(/TV Guide Search/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Knowledge Graph Insights')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/I'm your TVGuideChatBot/i)).toBeInTheDocument());
  });

  test('theme toggle switches theme and button text', async () => {
    await setup();
    const toggle = await screen.findByRole('button', { name: /switch to dark mode/i });
    debugIfFail(() => expect(toggle).toBeInTheDocument(), "Theme toggle 'dark' presence");
    await act(async () => {
      fireEvent.click(toggle);
      await flushTimersAndPromises();
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument()
    );
  });

  test('chatbot allows user messaging, disables on loading, and bot responds', async () => {
    await setup();
    const input = await screen.findByLabelText(/Message input/i);
    const sendBtn = await screen.findByTestId('chatbot-send-btn');

    debugIfFail(() => expect(input.value).toBe(''), "Chatbot input should be blank");
    debugIfFail(() => expect(sendBtn).toBeDisabled(), "Chatbot sendBtn should be disabled");

    await act(async () => {
      fireEvent.change(input, { target: { value: "What's on tonight?" } });
      await flushTimersAndPromises();
    });
    debugIfFail(() => expect(input.value).toBe("What's on tonight?"), "Chatbot input value after type");
    debugIfFail(() => expect(sendBtn).not.toBeDisabled(), "Chatbot sendBtn enabled after user input");

    // Send message and check
    await act(async () => {
      fireEvent.click(sendBtn);
    });

    await waitFor(() =>
      expect(screen.getByTestId('chatbot-message-user')).toHaveTextContent("What's on tonight?")
    );

    expect(await screen.findByTestId('chatbot-loading')).toBeInTheDocument();

    await flushTimersAndPromises();

    await waitFor(() =>
      expect(screen.getByTestId('chatbot-message-bot')).toHaveTextContent(/Let me check the current TV guide/i)
    );
  });

  test('TVGuidePanel search: input, search button, loading and no results states', async () => {
    await setup();
    const guideInput = await screen.findByTestId('guide-search-input');
    const searchBtn = await screen.findByTestId('guide-search-btn');

    debugIfFail(() => expect(guideInput.value).toBe(''), "Guide input blank before search");
    debugIfFail(() => expect(searchBtn).toBeDisabled(), "Guide searchBtn disabled with blank input");

    await act(async () => {
      fireEvent.change(guideInput, { target: { value: 'cake' } });
      await flushTimersAndPromises();
    });
    debugIfFail(() => expect(searchBtn).not.toBeDisabled(), "Guide searchBtn enabled after input");

    await act(async () => {
      fireEvent.click(searchBtn);
    });

    expect(await screen.findByTestId('guide-loading-indicator')).toBeInTheDocument();

    await flushTimersAndPromises();

    const list = await screen.findByTestId('guide-content-list');
    expect(list).toBeInTheDocument();
    expect(await screen.findByTestId('guide-result-title-0')).toHaveTextContent(/Great Cake Bake-off/i);
    expect(screen.getByTestId('guide-result-title-1')).toHaveTextContent(/Late Night with Cake/i);
    expect(screen.getByTestId('guide-result-channel-0')).toHaveTextContent(/Channel 5/i);
    expect(screen.getByTestId('guide-result-channel-1')).toHaveTextContent(/Talk TV/i);
    expect(screen.getByTestId('guide-result-description-0')).toHaveTextContent(/desserts/);
    expect(screen.getByTestId('guide-result-description-1')).toHaveTextContent(/guests/);
  });

  test('TVGuidePanel shows "No results found." if guideData is empty', async () => {
    await setup();
    const guideInput = await screen.findByTestId('guide-search-input');
    const searchBtn = await screen.findByTestId('guide-search-btn');

    await act(async () => {
      fireEvent.change(guideInput, { target: { value: 'unknownshow' } });
      await flushTimersAndPromises();
      fireEvent.click(searchBtn);
    });

    await flushTimersAndPromises();
    expect(await screen.findByTestId('guide-empty-state')).toBeInTheDocument();
  });

  test('InsightsPanel displays loading and result states', async () => {
    await setup();
    const input = await screen.findByLabelText(/Message input/i);

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Give an insight' } });
      await flushTimersAndPromises();
      fireEvent.keyDown(input, { key: 'Enter', code: 13 });
    });

    expect(await screen.findByTestId('insights-loading-indicator')).toBeInTheDocument();

    await flushTimersAndPromises();

    const list = await screen.findByTestId('insights-content-list');
    expect(list).toBeInTheDocument();
    expect(screen.getByTestId('insights-result-title-0')).toHaveTextContent(/Did you know/i);
    expect(screen.getByTestId('insights-result-detail-0')).toHaveTextContent(/has won 4 awards/i);
    expect(screen.getByTestId('insights-result-title-1')).toHaveTextContent(/Related Shows/i);
  });

  test('InsightsPanel displays empty state before interaction', async () => {
    await setup();
    expect(await screen.findByTestId('insights-empty-state')).toBeInTheDocument();
  });

  test('Button disables and re-enables correctly on bot loading', async () => {
    await setup();
    const input = await screen.findByLabelText(/Message input/i);
    const sendBtn = await screen.findByTestId('chatbot-send-btn');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'guide' } });
      await flushTimersAndPromises();
      expect(sendBtn).not.toBeDisabled();
      fireEvent.click(sendBtn);
    });
    expect(sendBtn).toBeDisabled();
    await flushTimersAndPromises();
    await waitFor(() => expect(sendBtn).not.toBeDisabled());
  });

  test('ChatbotPanel disables send button when input is empty or whitespace', async () => {
    await setup();
    const input = await screen.findByLabelText(/Message input/i);
    const sendBtn = await screen.findByTestId('chatbot-send-btn');
    expect(sendBtn).toBeDisabled();
    await act(async () => {
      fireEvent.change(input, { target: { value: '   ' } });
      await flushTimersAndPromises();
      expect(sendBtn).toBeDisabled();
      fireEvent.change(input, { target: { value: 'Show me trivia!' } });
      await flushTimersAndPromises();
      expect(sendBtn).not.toBeDisabled();
    });
  });

  test('TVGuidePanel disables search button on loading', async () => {
    await setup();
    const guideInput = await screen.findByTestId('guide-search-input');
    const searchBtn = await screen.findByTestId('guide-search-btn');
    await act(async () => {
      fireEvent.change(guideInput, { target: { value: 'abc' } });
      fireEvent.click(searchBtn);
      await flushTimersAndPromises();
    });
    expect(searchBtn).toBeDisabled();
  });

  test('Handles chat "channel" intent, triggers guide and insight logic', async () => {
    await setup();
    const input = await screen.findByLabelText(/Message input/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Channel 12 shows' } });
      await flushTimersAndPromises();
      fireEvent.keyDown(input, { key: 'Enter', code: 13 });
    });

    await waitFor(() =>
      expect(screen.getByTestId('chatbot-message-bot')).toHaveTextContent(/Channel 12/)
    );

    await flushTimersAndPromises();

    await waitFor(() => expect(screen.getByTestId('tvguide-panel')).toBeInTheDocument());
    expect(screen.getByTestId('insights-panel')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId('guide-results-section').textContent).not.toMatch(/Searching…/)
    );
    expect(screen.queryByTestId('insights-content-list')).toBeTruthy();
  });
});

// NOTE: All async state/UI assertions use waitFor or findBy* for async DOM, and all major async flows use flushTimersAndPromises.
// This eliminates act() overlap/race issues and uses strict React Testing Library best practices.
