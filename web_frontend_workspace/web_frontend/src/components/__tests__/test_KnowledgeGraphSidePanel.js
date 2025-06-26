import React from "react";
import { render, screen } from "@testing-library/react";
import KnowledgeGraphSidePanel from "../KnowledgeGraphSidePanel";

const insights = [
  { type: "node", label: "Show", properties: { name: "Supernatural", genre: "Fantasy" } },
  { type: "edge", label: "stars_in", from: "Jensen Ackles", to: "Supernatural" },
  { type: "text", text: "Jensen Ackles is a lead in the show Supernatural." }
];

describe("KnowledgeGraphSidePanel component", () => {
  it("renders loading state", () => {
    render(<KnowledgeGraphSidePanel insights={[]} loading={true} error="" active={true} />);
    expect(screen.getByText(/Loading insights/)).toBeInTheDocument();
  });

  it("renders error message", () => {
    render(<KnowledgeGraphSidePanel insights={[]} loading={false} error="Something went wrong" active={true} />);
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });

  it("renders empty message when no insights", () => {
    render(<KnowledgeGraphSidePanel insights={[]} loading={false} error="" active={true} />);
    expect(screen.getByText(/No graph insights yet/i)).toBeInTheDocument();
  });

  it("renders all insight types (node, edge, text)", () => {
    render(<KnowledgeGraphSidePanel insights={insights} loading={false} error="" active={true} />);
    expect(screen.getByText(/Show/)).toBeInTheDocument();
    expect(screen.getByText(/Jensen Ackles is a lead/)).toBeInTheDocument();
    expect(screen.getByText(/stars_in/)).toBeInTheDocument();
    expect(screen.getByText("Jensen Ackles")).toBeInTheDocument();
    expect(screen.getByText("Supernatural")).toBeInTheDocument();
  });

  it("includes correct class when active or closed", () => {
    // Open panel
    const { rerender, container } = render(
      <KnowledgeGraphSidePanel insights={[]} loading={false} error="" active={true} />
    );
    expect(container.firstChild).toHaveClass("open");
    // Closed panel
    rerender(<KnowledgeGraphSidePanel insights={[]} loading={false} error="" active={false} />);
    expect(container.firstChild).toHaveClass("closed");
  });
});
