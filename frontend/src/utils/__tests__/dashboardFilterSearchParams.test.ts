import {
  defaultDashboardFilters,
  type DashboardFilters,
} from "@/components/ui/DashboardFilterBar";
import {
  getDashboardFiltersFromSearchParams,
  setDashboardFiltersInSearchParams,
} from "@/utils/dashboardFilterSearchParams";
import { describe, expect, it } from "vitest";

describe("dashboardFilterSearchParams", () => {
  it("returns defaults when params are empty", () => {
    const filters = getDashboardFiltersFromSearchParams(
      new URLSearchParams(),
      "Ankara",
    );

    expect(filters).toEqual({
      ...defaultDashboardFilters,
      city: "Ankara",
    });
  });

  it("parses known filter values from query params", () => {
    const filters = getDashboardFiltersFromSearchParams(
      new URLSearchParams(
        "forYou=1&serviceType=offer&status=completed&tags=Q1,Q2&remote=remote&distance=25&city=Istanbul&sort=closest&availability=tomorrow",
      ),
    );

    expect(filters).toEqual<DashboardFilters>({
      forYouOnly: true,
      serviceType: "offer",
      status: "completed",
      selectedTags: ["Q1", "Q2"],
      remoteFilter: "remote",
      distance: 25,
      city: "Istanbul",
      sortBy: "closest",
      dateFilter: "tomorrow",
    });
  });

  it("falls back to defaults for invalid values", () => {
    const filters = getDashboardFiltersFromSearchParams(
      new URLSearchParams(
        "forYou=maybe&serviceType=invalid&status=unknown&tags=Q1,,Q2&remote=somewhere&distance=abc&sort=random&availability=later",
      ),
    );

    expect(filters).toEqual({
      ...defaultDashboardFilters,
      selectedTags: ["Q1", "Q2"],
    });
  });

  it("serializes only non-default filters and preserves unrelated params", () => {
    const params = new URLSearchParams("tag=Q42&status=expired");

    setDashboardFiltersInSearchParams(params, {
      forYouOnly: true,
      serviceType: "need",
      status: "all",
      selectedTags: ["Q1", "Q2"],
      remoteFilter: "in_person",
      distance: 10,
      city: "Izmir",
      sortBy: "hours_desc",
      dateFilter: "this_week",
    });

    expect(params.get("tag")).toBe("Q42");
    expect(params.get("forYou")).toBe("1");
    expect(params.get("serviceType")).toBe("need");
    expect(params.get("status")).toBe("all");
    expect(params.get("tags")).toBe("Q1,Q2");
    expect(params.get("remote")).toBe("in_person");
    expect(params.get("distance")).toBe("10");
    expect(params.get("city")).toBe("Izmir");
    expect(params.get("sort")).toBe("hours_desc");
    expect(params.get("availability")).toBe("this_week");
  });

  it("removes filter params again when filters are reset", () => {
    const params = new URLSearchParams(
      "tag=Q42&forYou=1&serviceType=offer&tags=Q1&distance=5&availability=today",
    );

    setDashboardFiltersInSearchParams(params, defaultDashboardFilters);

    expect(params.toString()).toBe("tag=Q42");
  });
});
