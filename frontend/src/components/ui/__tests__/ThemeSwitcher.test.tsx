import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeSwitcher } from "../ThemeSwitcher";

describe("ThemeSwitcher", () => {
  it("labels the dark-mode button as switching to light mode", () => {
    render(<ThemeSwitcher appearance="dark" onToggle={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "Switch to light mode" }),
    ).toBeInTheDocument();
  });

  it("labels light and inherited appearances as switching to dark mode", () => {
    const { rerender } = render(
      <ThemeSwitcher appearance="light" onToggle={vi.fn()} />,
    );

    expect(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    ).toBeInTheDocument();

    rerender(<ThemeSwitcher appearance="inherit" onToggle={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    ).toBeInTheDocument();
  });

  it("calls onToggle when clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(<ThemeSwitcher appearance="light" onToggle={onToggle} />);
    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
