import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { ServiceStatusBar } from "../ServiceStatusBar";

function renderStatus(status: Parameters<typeof ServiceStatusBar>[0]["status"]) {
  return render(
    <Theme>
      <ServiceStatusBar status={status} />
    </Theme>,
  );
}

describe("ServiceStatusBar", () => {
  it("renders the normal service progression labels", () => {
    renderStatus("completed");

    expect(screen.getByText("Service Status")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("marks the interrupted step as cancelled", () => {
    renderStatus("cancelled");

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("marks the interrupted step as expired", () => {
    renderStatus("expired");

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Expired")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });
});
