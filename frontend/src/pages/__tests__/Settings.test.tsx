import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { Settings } from "../Settings";

vi.mock("@/components/ui/SettingsPanel", () => ({
  SettingsPanel: () => <div>Mock settings panel</div>,
}));

describe("Settings page", () => {
  it("renders the settings heading and panel", () => {
    render(
      <Theme>
        <Settings />
      </Theme>,
    );

    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("Mock settings panel")).toBeInTheDocument();
  });
});
