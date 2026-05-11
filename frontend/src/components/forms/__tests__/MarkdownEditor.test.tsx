import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkdownEditor } from "../MarkdownEditor";

describe("MarkdownEditor", () => {
  it("renders write mode with the current value and helper text", () => {
    render(<MarkdownEditor value="Hello **world**" onChange={vi.fn()} />);

    expect(screen.getByDisplayValue("Hello **world**")).toBeInTheDocument();
    expect(screen.getByText(/Supports Markdown/i)).toBeInTheDocument();
  });

  it("calls onChange when the textarea changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<MarkdownEditor value="" onChange={onChange} placeholder="Describe it" />);
    await user.type(screen.getByPlaceholderText("Describe it"), "abc");

    expect(onChange).toHaveBeenLastCalledWith("c");
  });

  it("shows rendered markdown in preview mode", async () => {
    const user = userEvent.setup();

    render(
      <MarkdownEditor
        value={"**Bold text** and [Hive](https://example.com)"}
        onChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("tab", { name: /Preview/ }));

    expect(screen.getByText("Bold text")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Hive" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows empty-state copy in preview mode when there is no value", async () => {
    const user = userEvent.setup();

    render(<MarkdownEditor value="" onChange={vi.fn()} rows={6} />);
    await user.click(screen.getByRole("tab", { name: /Preview/ }));

    expect(screen.getByText("Nothing to preview yet...")).toBeInTheDocument();
  });

  it("honors the requested textarea row count", () => {
    render(<MarkdownEditor value="bad" onChange={vi.fn()} rows={8} />);

    expect(screen.getByDisplayValue("bad")).toHaveAttribute("rows", "8");
  });
});
