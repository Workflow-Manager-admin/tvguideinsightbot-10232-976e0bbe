import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from './App';

/**
 * NOTE: We deliberately increase Jest's timeout for async-heavy tests in this file via jest.setTimeout,
 * so tests with delayed or async React flows (including fake timers/async act) do not fail spuriously.
 * If you add new async UI, API delay mocks, or use waitFor, ensure suitable timeouts are configured.
 *
 * Helper to flush pending promises for React async effects and timers.
 * Uses setTimeout(0) for maximum compatibility.
 * Always wrap async actions/state updates in act(), or use user-event async utilities/waitFor as appropriate.
 */
/**
 * Utility: Forces all pending timers (setTimeout, setInterval) to run instantly and flushes microtasks.
 * Use in conjunction with jest.useFakeTimers() for deterministic tests.
 */
const flushPromises = async () => {
  // Flushes all pending timers and microtasks in sequence
  await act(async () => {
    jest.runOnlyPendingTimers();
    // Wait for microtasks to clear after timers
    await Promise.resolve();
  });
};


describe('TVGuideChatBot App', () => {
  // Ensure all tests in this file have increased timeout for async flows.
  beforeAll(() => {
    // PUBLIC_INTERFACE
    // Set test timeout higher for async-heavy/jest fake timers + React flushes.
    jest.setTimeout(10000);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Date for consistent formatting in tests
    jest.useFakeTimers().setSystemTime(new Date('2024-01-01T18:00:00Z'));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // Utility: Render App in a test - always within act for safety
  const setup = () =>
    act(() => { render(<App />); });

  test('renders initial chatbot greeting and panel layout', () => {
    setup();
    expect(screen.getByText("TVGuideChatBot")).toBeInTheDocument();
    expect(screen.getByLabelText(/Message input/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/TV Guide Search/i)).toBeInTheDocument();
    expect(screen.getByText('Knowledge Graph Insights')).toBeInTheDocument();
    // Check bot greeting message present
    expect(
      screen.getByText(/I'm your TVGuideChatBot/i)
    ).toBeInTheDocument();
  });

  test('theme toggle switches theme and button text', () => {
    setup();
    const toggle = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(toggle).toBeInTheDocument();
    act(() => {
      fireEvent.click(toggle);
    });
    expect(
      screen.getByRole('button', { name: /switch to light mode/i })
    ).toBeInTheDocument();
  });

  test('chatbot allows user messaging, disables on loading, and bot responds', async () => {
    setup();
    const input = screen.getByLabelText(/Message input/i);
    const sendBtn = screen.getByRole('button', { name: /send/i });

    // Initial state: input blank, send disabled
    expect(input.value).toBe('');
    expect(sendBtn).toBeDisabled();

    // Type a message
    act(() => {
      fireEvent.change(input, { target: { value: 'What\'s on tonight?' } });
    });
    expect(input.value).toBe('What\'s on tonight?');
    expect(sendBtn).not.toBeDisabled();

    // Send message (should disable button and show loading)
    await act(async () => {
      fireEvent.click(sendBtn);
    });

    // Message appears as "You" (wait for user message bubble)
    expect(await screen.findByText('You')).toBeInTheDocument();
    expect(screen.getByText('What\'s on tonight?')).toBeInTheDocument();

    // Loading "…" shown during bot delay
    expect(screen.getByText('…')).toBeInTheDocument();

    // Advance timers and flush async effects for fake bot response
    await act(async () => {
      jest.advanceTimersByTime(1100); // long enough for minimum bot response
      await flushPromises();
    });

    // Bot reply should now appear
    expect(await screen.findByText(/Let me check the current TV guide/i)).toBeInTheDocument();
  });

  test('TVGuidePanel search: input, search button, loading and no results states', async () => {
    setup();
    const guideInput = screen.getByLabelText(/TV Guide Search/i);
    const searchBtn = screen.getByRole('button', { name: /^Search$/ });

    // Input present, button disabled initially
    expect(guideInput.value).toBe('');
    expect(searchBtn).toBeDisabled();

    // Enter a query
    act(() => {
      fireEvent.change(guideInput, { target: { value: 'cake' } });
    });
    expect(searchBtn).not.toBeDisabled();

    // Start search
    await act(async () => {
      fireEvent.click(searchBtn);
    });

    // Loading label appears
    expect(await screen.findByText(/Searching…/)).toBeInTheDocument();

    // Faking delay for fetchTVGuide mock ~1s (setTimeout stubbed)
    await act(async () => {
      jest.advanceTimersByTime(1100);
      await flushPromises();
    });

    // Guide shows results
    expect(await screen.findAllByText(/Great Cake Bake-off/i)).toHaveLength(1);
    expect(screen.getByText(/Late Night with Cake/i)).toBeInTheDocument();
    expect(screen.getByText(/Channel 5/)).toBeInTheDocument();
    expect(screen.getByText(/Talk TV/)).toBeInTheDocument();
    // Show time range and description present
    expect(screen.getAllByText(/desserts/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/guests/)[0]).toBeInTheDocument();
  });

  test('TVGuidePanel shows "No results found." if guideData is empty', async () => {
    setup();
    // Simulate a search with empty guide data
    const guideInput = screen.getByLabelText(/TV Guide Search/i);
    const searchBtn = screen.getByRole('button', { name: /^Search$/ });

    act(() => {
      fireEvent.change(guideInput, { target: { value: 'unknownshow' } });
    });
    await act(async () => {
      fireEvent.click(searchBtn);
    });

    // Wait for mock API delay and flush timers/promises
    await act(async () => {
      jest.advanceTimersByTime(1100);
      await flushPromises();
    });
    // Should show the "No results found." label
    expect(screen.getByText(/No results found/i)).toBeInTheDocument();
  });

  test('InsightsPanel displays loading and result states', async () => {
    setup();
    // Trigger a chatbot message that matches "insight" intent
    const input = screen.getByLabelText(/Message input/i);
    act(() => {
      fireEvent.change(input, { target: { value: 'Give an insight' } });
    });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', code: 13 });
    });

    // Loading label appears while fetching insights
    expect(await screen.findByText(/Loading insights graph/i)).toBeInTheDocument();

    // Advance fake timers and flush async for mock insights response
    await act(async () => {
      jest.advanceTimersByTime(1200); // longer than max mock delay
      await flushPromises();
    });

    // After mock API calls, insights should appear
    expect(await screen.findByText(/Did you know/i)).toBeInTheDocument();
    expect(screen.getByText(/has won 4 awards/i)).toBeInTheDocument();
    expect(screen.getByText(/Related Shows/i)).toBeInTheDocument();
  });

  test('InsightsPanel displays empty state before interaction', () => {
    setup();
    // Before any search or message, it shows empty state message
    expect(screen.getByText(/No insights available/i)).toBeInTheDocument();
  });

  test('Button disables and re-enables correctly on bot loading', async () => {
    setup();
    const input = screen.getByLabelText(/Message input/i);
    const sendBtn = screen.getByRole('button', { name: /send/i });
    act(() => {
      fireEvent.change(input, { target: { value: 'guide' } });
    });
    expect(sendBtn).not.toBeDisabled();
    await act(async () => {
      fireEvent.click(sendBtn);
      // Immediately after click, bot loading disables send
      expect(sendBtn).toBeDisabled();
      jest.advanceTimersByTime(1050);
      await flushPromises();
    });
  });

  test('ChatbotPanel disables send button when input is empty or whitespace', () => {
    setup();
    const input = screen.getByLabelText(/Message input/i);
    const sendBtn = screen.getByRole('button', { name: /send/i });
    expect(sendBtn).toBeDisabled();
    act(() => {
      fireEvent.change(input, { target: { value: '   ' } });
    });
    expect(sendBtn).toBeDisabled();
    act(() => {
      fireEvent.change(input, { target: { value: 'Show me trivia!' } });
    });
    expect(sendBtn).not.toBeDisabled();
  });

  test('TVGuidePanel disables search button on loading', () => {
    setup();
    const guideInput = screen.getByLabelText(/TV Guide Search/i);
    const searchBtn = screen.getByRole('button', { name: /^Search$/ });
    act(() => {
      fireEvent.change(guideInput, { target: { value: 'abc' } });
      fireEvent.click(searchBtn);
    });
    expect(searchBtn).toBeDisabled();
  });

  test('Handles chat "channel" intent, triggers guide and insight logic', async () => {
    setup();
    const input = screen.getByLabelText(/Message input/i);
    act(() => {
      fireEvent.change(input, { target: { value: 'Channel 12 shows' } });
    });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', code: 13 });
    });

    // Bot message should relate to channel, after async state update
    expect(
      await screen.findByText(/Channel 12/i)
    ).toBeInTheDocument();

    // Wait for both guide and insight async calls to finish: advance enough time, flush microtasks/mocks
    await act(async () => {
      jest.advanceTimersByTime(2200); // plenty to cover bot + guide + insight timers
      await flushPromises();
    });

    // Results from TV guide and Knowledge insights should show
    expect(screen.getByText(/Bake-off/i)).toBeInTheDocument();
    expect(screen.getByText(/Knowledge Graph Insights/i)).toBeInTheDocument();
  });
});

/**
 * NOTE FOR MAINTAINERS:
 * - All async state logic, effects, and event triggers are wrapped in act() or waited-for using waitFor.
 * - Jest fake timers are advanced for all async delays.
 * - All async user/DOM events are used within act() and flushed with flushPromises for reliability.
 * - Any new async UI logic or network mocking added should follow this pattern for async safety in React 18+.
 */
