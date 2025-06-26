import React from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import App from './App';

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
    expect(screen.getByText("TVGuideChatBot")).toBeInTheDocument();
    expect(screen.getByLabelText(/Message input/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/TV Guide Search/i)).toBeInTheDocument();
    expect(screen.getByText('Knowledge Graph Insights')).toBeInTheDocument();
    // Check bot greeting message present
    expect(
      screen.getByText(/I'm your TVGuideChatBot/i)
    ).toBeInTheDocument();
  });

  test('theme toggle switches theme and button text', async () => {
    await setup();
    const toggle = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(toggle).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(toggle);
      await flushPromises();
    });
    expect(
      screen.getByRole('button', { name: /switch to light mode/i })
    ).toBeInTheDocument();
  });

  test('chatbot allows user messaging, disables on loading, and bot responds', async () => {
    await setup();
    const input = screen.getByLabelText(/Message input/i);
    const sendBtn = screen.getByRole('button', { name: /send/i });

    // Initial state: input blank, send disabled
    expect(input.value).toBe('');
    expect(sendBtn).toBeDisabled();

    // Simulate user typing message, with act wrapper
    await act(async () => {
      fireEvent.change(input, { target: { value: "What's on tonight?" } });
      await Promise.resolve(); // allow onChange to finish
    });
    expect(input.value).toBe("What's on tonight?");
    expect(sendBtn).not.toBeDisabled();

    // Send message
    await act(async () => {
      fireEvent.click(sendBtn);
      await Promise.resolve();
    });

    // Message appears as "You"
    expect(await screen.findByText('You')).toBeInTheDocument();
    expect(screen.getByText("What's on tonight?")).toBeInTheDocument();

    // "…" shown while bot loading
    expect(screen.getByText('…')).toBeInTheDocument();

    // Advance all timers and microtasks for bot's fake async reply and followup effects
    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
      await flushPromises();
    });

    // Bot reply should now appear
    expect(await screen.findByText(/Let me check the current TV guide/i)).toBeInTheDocument();
  });

  test('TVGuidePanel search: input, search button, loading and no results states', async () => {
    await setup();
    const guideInput = screen.getByLabelText(/TV Guide Search/i);
    const searchBtn = screen.getByRole('button', { name: /^Search$/ });

    // Input present, button disabled initially
    expect(guideInput.value).toBe('');
    expect(searchBtn).toBeDisabled();

    await act(async () => {
      fireEvent.change(guideInput, { target: { value: 'cake' } });
      await flushPromises();
    });
    expect(searchBtn).not.toBeDisabled();

    // Start search
    await act(async () => {
      fireEvent.click(searchBtn);
      await flushPromises();
    });

    // Loading label appears
    expect(await screen.findByText(/Searching…/)).toBeInTheDocument();

    // Faking delay for fetchTVGuide mock - flush all timers/microtasks
    await act(async () => {
      jest.runOnlyPendingTimers();
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
    await setup();
    // Simulate a search with empty guide data
    const guideInput = screen.getByLabelText(/TV Guide Search/i);
    const searchBtn = screen.getByRole('button', { name: /^Search$/ });

    await act(async () => {
      fireEvent.change(guideInput, { target: { value: 'unknownshow' } });
      await flushPromises();
    });
    await act(async () => {
      fireEvent.click(searchBtn);
      await flushPromises();
    });

    // Wait for mock API delay and flush timers/promises
    await act(async () => {
      jest.runOnlyPendingTimers();
      await flushPromises();
    });
    // Should show the "No results found." label
    expect(screen.getByText(/No results found/i)).toBeInTheDocument();
  });

  test('InsightsPanel displays loading and result states', async () => {
    await setup();
    // Trigger a chatbot message that matches "insight" intent
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
    expect(await screen.findByText(/Loading insights graph/i)).toBeInTheDocument();

    // Advance timers and all async after the mock network delay (bot and insights both async)
    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
      await flushPromises();
    });

    // Insights should appear
    expect(await screen.findByText(/Did you know/i)).toBeInTheDocument();
    expect(screen.getByText(/has won 4 awards/i)).toBeInTheDocument();
    expect(screen.getByText(/Related Shows/i)).toBeInTheDocument();
  });

  test('InsightsPanel displays empty state before interaction', async () => {
    await setup();
    // Before any search or message, it shows empty state message
    expect(screen.getByText(/No insights available/i)).toBeInTheDocument();
  });

  test('Button disables and re-enables correctly on bot loading', async () => {
    await setup();
    const input = screen.getByLabelText(/Message input/i);
    const sendBtn = screen.getByRole('button', { name: /send/i });
    await act(async () => {
      fireEvent.change(input, { target: { value: 'guide' } });
      await flushPromises();
    });
    expect(sendBtn).not.toBeDisabled();
    await act(async () => {
      fireEvent.click(sendBtn);
      await flushPromises();
      // Immediately after click, bot loading disables send
      expect(sendBtn).toBeDisabled();
      jest.runOnlyPendingTimers();
      await flushPromises();
    });
    // After bot loading, should be re-enabled; ensure stabilization
    await waitFor(() => expect(sendBtn).not.toBeDisabled());
  });

  test('ChatbotPanel disables send button when input is empty or whitespace', async () => {
    await setup();
    const input = screen.getByLabelText(/Message input/i);
    const sendBtn = screen.getByRole('button', { name: /send/i });
    expect(sendBtn).toBeDisabled();
    await act(async () => {
      fireEvent.change(input, { target: { value: '   ' } });
      await flushPromises();
    });
    expect(sendBtn).toBeDisabled();
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Show me trivia!' } });
      await flushPromises();
    });
    expect(sendBtn).not.toBeDisabled();
  });

  test('TVGuidePanel disables search button on loading', async () => {
    await setup();
    const guideInput = screen.getByLabelText(/TV Guide Search/i);
    const searchBtn = screen.getByRole('button', { name: /^Search$/ });
    await act(async () => {
      fireEvent.change(guideInput, { target: { value: 'abc' } });
      fireEvent.click(searchBtn);
      await flushPromises();
    });
    expect(searchBtn).toBeDisabled();
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

    // Bot message should relate to channel, after UI updates
    expect(
      await screen.findByText(/Channel 12/i)
    ).toBeInTheDocument();

    // Advance all timers and flush for both guide API and insights response
    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
      await flushPromises();
    });

    // Both TV guide results and insights panel result should now be visible
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
