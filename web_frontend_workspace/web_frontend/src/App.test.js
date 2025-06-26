import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from './App';

/**
 * Helper to flush pending promises in test environments.
 * Uses setTimeout 0 for maximum compatibility instead of setImmediate.
 */
// For API mocks
const flushPromises = () =>
  act(() => new Promise(resolve => setTimeout(resolve, 0)));

describe('TVGuideChatBot App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Date for consistent formatting in tests
    jest.useFakeTimers().setSystemTime(new Date('2024-01-01T18:00:00Z'));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // Utility: Render App in a test
  const setup = () => render(<App />);

  test('renders initial chatbot greeting and panel layout', () => {
    setup();
    expect(screen.getByText("TVGuideChatBot")).toBeInTheDocument();
    expect(screen.getByLabelText(/Message input/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/TV Guide Search/i)).toBeInTheDocument();
    expect(screen.getByText('Knowledge Graph Insights')).toBeInTheDocument();
    // Bot greeting message present
    expect(
      screen.getByText(/I'm your TVGuideChatBot/i)
    ).toBeInTheDocument();
  });

  test('theme toggle switches theme and button text', () => {
    setup();
    const toggle = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(toggle).toBeInTheDocument();
    fireEvent.click(toggle);
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
    fireEvent.change(input, { target: { value: 'What\'s on tonight?' } });
    expect(input.value).toBe('What\'s on tonight?');
    expect(sendBtn).not.toBeDisabled();

    // Send message
    fireEvent.click(sendBtn);

    // Message appears as "You"
    expect(await screen.findByText('You')).toBeInTheDocument();
    expect(screen.getByText('What\'s on tonight?')).toBeInTheDocument();

    // Loading "…" shown
    expect(screen.getByText('…')).toBeInTheDocument();

    // After fake bot delay, bot reply should appear
    await waitFor(() =>
      expect(
        screen.getByText(/Let me check the current TV guide/i)
      ).toBeInTheDocument(),
      { timeout: 2500 }
    );
  });

  test('TVGuidePanel search: input, search button, loading and no results states', async () => {
    setup();
    const guideInput = screen.getByLabelText(/TV Guide Search/i);
    const searchBtn = screen.getByRole('button', { name: /^Search$/ });

    // Input present, button disabled initially
    expect(guideInput.value).toBe('');
    expect(searchBtn).toBeDisabled();

    // Enter a query
    fireEvent.change(guideInput, { target: { value: 'cake' } });
    expect(searchBtn).not.toBeDisabled();

    // Start search
    fireEvent.click(searchBtn);

    // Loading label appears
    expect(await screen.findByText(/Searching…/)).toBeInTheDocument();

    // Faking delay for fetchTVGuide mock ~1s (setTimeout stubbed)
    await act(async () => {
      jest.advanceTimersByTime(1050);
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

    fireEvent.change(guideInput, { target: { value: 'unknownshow' } });
    fireEvent.click(searchBtn);

    // Wait for API to resolve and check empty state
    await act(async () => {
      jest.advanceTimersByTime(1050);
      await flushPromises();
    });
    // Should show the specific "No results found." label
    expect(screen.getByText(/No results found/i)).toBeInTheDocument();
  });

  test('InsightsPanel displays loading and result states', async () => {
    setup();
    // Trigger a chatbot message that matches "insight" intent
    const input = screen.getByLabelText(/Message input/i);
    fireEvent.change(input, { target: { value: 'Give an insight' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 13 });

    // Loading label appears in insights
    expect(await screen.findByText(/Loading insights graph/i)).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(1050);
      await flushPromises();
    });

    // After API calls, insights appear
    expect(
      await screen.findByText(/Did you know/i, undefined, { timeout: 2500 })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/has won 4 awards/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Related Shows/i)
    ).toBeInTheDocument();
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
    fireEvent.change(input, { target: { value: 'guide' } });
    expect(sendBtn).not.toBeDisabled();
    fireEvent.click(sendBtn);
    expect(sendBtn).toBeDisabled(); // Bot loading disables send
    await act(async () => {
      jest.advanceTimersByTime(1050);
      await flushPromises();
    });
  });

  test('ChatbotPanel disables send button when input is empty or whitespace', () => {
    setup();
    const input = screen.getByLabelText(/Message input/i);
    const sendBtn = screen.getByRole('button', { name: /send/i });
    expect(sendBtn).toBeDisabled();
    fireEvent.change(input, { target: { value: '   ' } });
    expect(sendBtn).toBeDisabled();
    fireEvent.change(input, { target: { value: 'Show me trivia!' } });
    expect(sendBtn).not.toBeDisabled();
  });

  test('TVGuidePanel disables search button on loading', () => {
    setup();
    const guideInput = screen.getByLabelText(/TV Guide Search/i);
    const searchBtn = screen.getByRole('button', { name: /^Search$/ });
    fireEvent.change(guideInput, { target: { value: 'abc' } });
    fireEvent.click(searchBtn);
    expect(searchBtn).toBeDisabled();
  });

  test('Handles chat "channel" intent, triggers guide and insight logic', async () => {
    setup();
    const input = screen.getByLabelText(/Message input/i);
    fireEvent.change(input, { target: { value: 'Channel 12 shows' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 13 });

    // Expect a bot message relating to channel
    expect(
      await screen.findByText(/Channel 12/i, undefined, { timeout: 3000 })
    ).toBeInTheDocument();

    // Guide and insights should be triggered for this
    await act(async () => {
      jest.advanceTimersByTime(2050);
      await flushPromises();
    });

    // The mock API will provide results appropriately
    expect(screen.getByText(/Bake-off/i)).toBeInTheDocument();
    expect(screen.getByText(/Knowledge Graph Insights/i)).toBeInTheDocument();
  });
});
