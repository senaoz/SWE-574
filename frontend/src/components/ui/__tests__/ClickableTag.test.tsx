import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ClickableTag } from "../ClickableTag";

function renderTag(props: Partial<Parameters<typeof ClickableTag>[0]> & { tag: Parameters<typeof ClickableTag>[0]["tag"] }) {
  return render(
    <MemoryRouter>
      <ClickableTag {...props} />
    </MemoryRouter>,
  );
}

describe("ClickableTag", () => {
  it("renders string tag label", () => {
    renderTag({ tag: "music" });
    expect(screen.getByText("music")).toBeInTheDocument();
  });

  it("renders TagEntity label", () => {
    renderTag({ tag: { entityId: "Q1", label: "Photography", description: "" } });
    expect(screen.getByText("Photography")).toBeInTheDocument();
  });

  it("links to dashboard with entityId as tag param", () => {
    renderTag({ tag: { entityId: "Q42", label: "Cooking", description: "" } });
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/dashboard?tag=Q42");
  });

  it("links to dashboard with encoded label when no entityId", () => {
    renderTag({ tag: "music & arts" });
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toContain("music");
  });

  it("stops propagation on click when stopPropagation is true", async () => {
    const user = userEvent.setup();
    const outerClick = vi.fn();
    render(
      <MemoryRouter>
        <div onClick={outerClick}>
          <ClickableTag tag="music" stopPropagation />
        </div>
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("link"));
    expect(outerClick).not.toHaveBeenCalled();
  });

  it("does not stop propagation by default", async () => {
    const user = userEvent.setup();
    const outerClick = vi.fn();
    render(
      <MemoryRouter>
        <div onClick={outerClick}>
          <ClickableTag tag="music" />
        </div>
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("link"));
    expect(outerClick).toHaveBeenCalled();
  });
});
