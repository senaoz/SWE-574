import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompleteStep } from "../CompleteStep";

vi.mock("@/components/ui/InterestChip", () => ({
  InterestChip: ({ name }: { name: string }) => (
    <span data-testid="interest-chip">{name}</span>
  ),
}));

describe("CompleteStep", () => {
  it("renders the completion heading", () => {
    render(<CompleteStep interests={[]} />);
    expect(screen.getByText("You're all set!")).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<CompleteStep interests={[]} />);
    expect(screen.getByText(/start exploring services/i)).toBeInTheDocument();
  });

  it("does not render interests section when empty", () => {
    render(<CompleteStep interests={[]} />);
    expect(screen.queryByText("Your interests")).not.toBeInTheDocument();
    expect(screen.queryByTestId("interest-chip")).not.toBeInTheDocument();
  });

  it("renders interests when provided", () => {
    render(<CompleteStep interests={["cooking", "music"]} />);
    expect(screen.getByText("Your interests")).toBeInTheDocument();
    expect(screen.getAllByTestId("interest-chip")).toHaveLength(2);
    expect(screen.getByText("cooking")).toBeInTheDocument();
    expect(screen.getByText("music")).toBeInTheDocument();
  });

  it("renders footer tip about updating profile", () => {
    render(<CompleteStep interests={[]} />);
    expect(screen.getByText(/update your profile/i)).toBeInTheDocument();
  });
});
