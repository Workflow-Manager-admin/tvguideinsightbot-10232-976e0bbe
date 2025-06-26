import React from "react";
import { render, screen } from "@testing-library/react";
import TVGuidePanel from "../TVGuidePanel";

const mockResults = [
  {
    title: "Supernatural",
    channel: "CW",
    time: "8:00 PM",
    description: "Sam and Dean hunt supernatural entities threatening the world."
  },
  {
    title: "Planet Earth II",
    channel: "BBC America",
    time: "9:30 PM",
    description: "Documentary series exploring wildlife across the globe."
  }
];

describe("TVGuidePanel component", () => {
  it("renders loading state", () => {
    render(<TVGuidePanel guideResults={[]} loading={true} error={""} />);
    expect(screen.getByText(/Loading TV Guide/i)).toBeInTheDocument();
  });

  it("renders error message", () => {
    render(<TVGuidePanel guideResults={[]} loading={false} error="Some error" />);
    expect(screen.getByText(/Error loading TV guide/i)).toBeInTheDocument();
    expect(screen.getByText(/Some error/)).toBeInTheDocument();
  });

  it("renders empty message if no results", () => {
    render(<TVGuidePanel guideResults={[]} loading={false} error={""} />);
    expect(screen.getByText(/No TV shows found/i)).toBeInTheDocument();
  });

  it("renders TV show cards for each result", () => {
    render(<TVGuidePanel guideResults={mockResults} loading={false} error={""} />);
    expect(screen.getByText(/Supernatural/)).toBeInTheDocument();
    expect(screen.getByText(/Sam and Dean/)).toBeInTheDocument();
    expect(screen.getByText(/Planet Earth II/)).toBeInTheDocument();
    expect(screen.getAllByText(/BBC America|CW/).length).toBe(2);
  });
});
