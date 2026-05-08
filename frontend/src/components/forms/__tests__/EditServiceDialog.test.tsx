import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditServiceDialog } from "../EditServiceDialog";
import { Service } from "@/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock OfferNeedForm to isolate EditServiceDialog tests
vi.mock("../OfferNeedForm", () => ({
  OfferNeedForm: (props: any) => (
    <div data-testid="offer-need-form">
      <span data-testid="form-service-type">{props.serviceType}</span>
      <span data-testid="form-initial-title">
        {props.initialService?.title ?? "none"}
      </span>
      <button data-testid="form-submit" onClick={props.onSuccess}>
        Save
      </button>
      <button data-testid="form-cancel" onClick={props.onClose}>
        Cancel
      </button>
    </div>
  ),
}));

const mockService: Service = {
  _id: "svc-1",
  user_id: "user-1",
  title: "Test Service",
  description: "A test service description",
  category: "test",
  tags: [{ label: "cooking", entityId: "Q123", description: "cooking" }],
  estimated_duration: 2,
  location: { latitude: 41.0, longitude: 29.0, address: "Istanbul" },
  service_type: "offer",
  status: "active",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  max_participants: 3,
  scheduling_type: "open",
  open_availability: "Weekends",
  is_remote: false,
};

function renderDialog(props: Partial<Parameters<typeof EditServiceDialog>[0]> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <EditServiceDialog
        open={true}
        onOpenChange={vi.fn()}
        service={mockService}
        {...props}
      />
    </QueryClientProvider>,
  );
}

describe("EditServiceDialog", () => {
  it("renders dialog with 'Edit Service' title when open", () => {
    renderDialog();
    expect(screen.getByText("Edit Service")).toBeInTheDocument();
  });

  it("passes initialService to OfferNeedForm", () => {
    renderDialog();
    expect(screen.getByTestId("form-initial-title")).toHaveTextContent(
      "Test Service",
    );
  });

  it("passes correct serviceType to OfferNeedForm", () => {
    renderDialog();
    expect(screen.getByTestId("form-service-type")).toHaveTextContent("offer");
  });

  it("passes 'need' serviceType for need services", () => {
    renderDialog({ service: { ...mockService, service_type: "need" } });
    expect(screen.getByTestId("form-service-type")).toHaveTextContent("need");
  });

  it("calls onOpenChange(false) and onSuccess on form submit", async () => {
    const onOpenChange = vi.fn();
    const onSuccess = vi.fn();
    renderDialog({ onOpenChange, onSuccess });

    await userEvent.click(screen.getByTestId("form-submit"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSuccess).toHaveBeenCalled();
  });

  it("calls onOpenChange(false) on form cancel", async () => {
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    await userEvent.click(screen.getByTestId("form-cancel"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not render form content when dialog is closed", () => {
    renderDialog({ open: false });
    expect(screen.queryByTestId("offer-need-form")).not.toBeInTheDocument();
  });
});
