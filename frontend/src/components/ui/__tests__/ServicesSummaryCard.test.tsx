import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Theme } from "@radix-ui/themes";
import type { Service } from "@/types";
import { ServicesSummaryCard } from "../ServicesSummaryCard";

const baseService: Service = {
  _id: "service-1",
  user_id: "owner-1",
  title: "Piano lessons",
  description: "Music practice",
  category: "education",
  tags: [{ label: "Music", entityId: "Q638", description: "music" }],
  estimated_duration: 2,
  location: { latitude: 41.01, longitude: 29.01, address: "Kadikoy" },
  service_type: "offer",
  status: "active",
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  max_participants: 1,
};

describe("ServicesSummaryCard", () => {
  it("summarizes given and taken services and exposes search", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const services: Service[] = [
      baseService,
      {
        ...baseService,
        _id: "service-2",
        title: "Bike repair",
        service_type: "need",
        status: "completed",
        estimated_duration: 3,
        tags: [{ label: "Repair", entityId: "Q131502", description: "repair" }],
      },
    ];
    const takenServices: Service[] = [
      {
        ...baseService,
        _id: "service-3",
        title: "Cooking help",
        status: "completed",
        estimated_duration: 1,
      },
    ];

    render(
      <Theme>
        <ServicesSummaryCard
          services={services}
          takenServices={takenServices}
          searchQuery=""
          onSearchChange={onSearchChange}
        />
      </Theme>,
    );

    expect(screen.getByText("Services Given")).toBeInTheDocument();
    expect(screen.getByText(/5 Hours/)).toBeInTheDocument();
    expect(screen.getByText("Active (1)")).toBeInTheDocument();
    expect(screen.getAllByText("Completed (1)")).toHaveLength(2);
    expect(screen.getByText("Music")).toBeInTheDocument();
    expect(screen.getByText("Repair")).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Search services by title, description or tag..."),
      "b",
    );

    expect(onSearchChange).toHaveBeenLastCalledWith("b");
  });
});
