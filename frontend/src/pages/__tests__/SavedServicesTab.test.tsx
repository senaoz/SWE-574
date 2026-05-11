import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import type { Service } from "@/types";
import { SavedServicesTab } from "../SavedServicesTab";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/components/ui/StatusBadge", () => ({
  StatusBadge: ({ status }: any) => <span>Status: {status}</span>,
}));

const savedService: Service = {
  _id: "service-1",
  user_id: "user-1",
  title: "Piano lessons",
  description: "Learn **piano** after work.",
  category: "education",
  tags: [],
  estimated_duration: 2,
  location: { latitude: 41.01, longitude: 29.01, address: "Kadikoy" },
  service_type: "offer",
  status: "active",
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  max_participants: 1,
  is_remote: true,
};

function renderTab(services: Service[], onUnsave = vi.fn()) {
  return {
    onUnsave,
    ...render(
      <Theme>
        <MemoryRouter>
          <SavedServicesTab services={services} onUnsave={onUnsave} />
        </MemoryRouter>
      </Theme>,
    ),
  };
}

describe("SavedServicesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("navigates from the empty state to the dashboard", async () => {
    const user = userEvent.setup();
    renderTab([]);

    expect(
      screen.getByText("You haven't saved any services yet."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Browse Services" }));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("renders saved services, opens detail, and unsaves without navigating", async () => {
    const user = userEvent.setup();
    const onUnsave = vi.fn().mockResolvedValue(undefined);
    renderTab([savedService], onUnsave);

    expect(screen.getByText("Piano lessons")).toBeInTheDocument();
    expect(screen.getByText("Remote")).toBeInTheDocument();

    await user.click(screen.getByRole("button"));
    expect(onUnsave).toHaveBeenCalledWith("service-1");
    expect(mockNavigate).not.toHaveBeenCalled();

    await user.click(screen.getByText("Piano lessons"));
    expect(mockNavigate).toHaveBeenCalledWith("/service/service-1");
  });
});
