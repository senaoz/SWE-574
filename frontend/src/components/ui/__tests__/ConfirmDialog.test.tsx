import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "../ConfirmDialog";

function renderDialog(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  return render(
    <ConfirmDialog
      open={true}
      onOpenChange={vi.fn()}
      title="Delete this item?"
      description="This action cannot be undone."
      onConfirm={vi.fn()}
      {...overrides}
    />,
  );
}

describe("ConfirmDialog", () => {
  it("renders title and description", () => {
    renderDialog();
    expect(screen.getByText("Delete this item?")).toBeInTheDocument();
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
  });

  it("shows default confirm and cancel labels", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("shows custom labels when provided", () => {
    renderDialog({ confirmLabel: "Yes, delete", cancelLabel: "No, keep it" });
    expect(screen.getByRole("button", { name: "Yes, delete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No, keep it" })).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onConfirm });
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it("calls onOpenChange(false) when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) after confirm resolves", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ onConfirm: vi.fn().mockResolvedValue(undefined), onOpenChange });
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("does not render when open is false", () => {
    renderDialog({ open: false });
    expect(screen.queryByText("Delete this item?")).not.toBeInTheDocument();
  });
});
