import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../StatusBadge";

describe("StatusBadge", () => {
  const cases = [
    { status: "active", label: "Active" },
    { status: "in_progress", label: "In Progress" },
    { status: "completed", label: "Completed" },
    { status: "cancelled", label: "Cancelled" },
    { status: "expired", label: "Expired" },
    { status: "pending", label: "Pending" },
  ] as const;

  cases.forEach(({ status, label }) => {
    it(`renders '${label}' for status '${status}'`, () => {
      render(<StatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("renders an icon alongside the label", () => {
    const { container } = render(<StatusBadge status="active" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders unknown status text as-is", () => {
    render(<StatusBadge status="unknown_state" />);
    expect(screen.getByText("unknown_state")).toBeInTheDocument();
  });
});
