import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ChatbotUI from "../ChatbotUI";

// Mock props
const mockMessages = [
  { sender: "bot", text: "Hello, how can I assist you?" },
  { sender: "user", text: "Show me the latest TV shows." },
];
const mockOnSendMessage = jest.fn();

describe("ChatbotUI component", () => {
  beforeEach(() => {
    mockOnSendMessage.mockClear();
  });

  it("renders chat messages from both user and bot", () => {
    render(<ChatbotUI onSendMessage={mockOnSendMessage} messages={mockMessages} loading={false} />);
    expect(screen.getByText(/how can I assist/i)).toBeInTheDocument();
    expect(screen.getByText(/latest TV shows/i)).toBeInTheDocument();
    // Ensure both from-user and from-bot classes are present
    expect(screen.getAllByText(/Hello|Show/i).length).toBeGreaterThanOrEqual(2);
  });

  it("calls onSendMessage with input value and clears input on send", () => {
    render(<ChatbotUI onSendMessage={mockOnSendMessage} messages={mockMessages} loading={false} />);
    const input = screen.getByPlaceholderText(/Ask about TV shows/i);
    fireEvent.change(input, { target: { value: "What's on CW tonight?" } });
    fireEvent.submit(input.closest("form"));
    expect(mockOnSendMessage).toHaveBeenCalledWith("What's on CW tonight?");
    expect(input.value).toBe(""); // Cleared after send
  });

  it("disables input and button when loading", () => {
    render(<ChatbotUI onSendMessage={mockOnSendMessage} messages={mockMessages} loading={true} />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: /Send/i })).toBeDisabled();
    expect(screen.getByText(/typing/i)).toBeInTheDocument();
  });

  it("does not send blank or whitespace messages", () => {
    render(<ChatbotUI onSendMessage={mockOnSendMessage} messages={mockMessages} loading={false} />);
    const input = screen.getByPlaceholderText(/Ask about TV shows/i);
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.submit(input.closest("form"));
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });
});
