import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WelcomeStep } from "../WelcomeStep";

describe("WelcomeStep", () => {
  it("renders the welcome heading", () => {
    render(<WelcomeStep />);
    expect(screen.getByText("Welcome to The Hive!")).toBeInTheDocument();
  });

  it("renders 'Offer your skills' feature", () => {
    render(<WelcomeStep />);
    expect(screen.getByText("Offer your skills")).toBeInTheDocument();
  });

  it("renders 'Request help' feature", () => {
    render(<WelcomeStep />);
    expect(screen.getByText("Request help")).toBeInTheDocument();
  });

  it("renders 'Earn time credits' feature", () => {
    render(<WelcomeStep />);
    expect(screen.getByText("Earn time credits")).toBeInTheDocument();
  });

  it("renders setup prompt text", () => {
    render(<WelcomeStep />);
    expect(
      screen.getByText(/set up your profile/i),
    ).toBeInTheDocument();
  });
});
