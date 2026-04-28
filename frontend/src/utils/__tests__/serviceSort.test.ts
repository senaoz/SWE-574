import { describe, it, expect } from "vitest";
import { getServiceDistance, sortDashboardServices } from "../serviceSort";
import type { Service } from "@/types";

function makeService(overrides: Partial<Service> & { _id: string }): Service {
  return {
    user_id: "u1",
    title: "Test Service",
    description: "",
    category: "misc",
    tags: [],
    estimated_duration: 1,
    location: { latitude: 41, longitude: 29, address: "Istanbul" },
    service_type: "offer",
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    max_participants: 1,
    ...overrides,
  };
}

describe("getServiceDistance", () => {
  it("returns Infinity when userPosition is null", () => {
    const svc = makeService({ _id: "s1" });
    expect(getServiceDistance(svc, null)).toBe(Number.POSITIVE_INFINITY);
  });

  it("returns Infinity when service has no coordinates", () => {
    const svc = makeService({
      _id: "s1",
      location: { address: "Istanbul" } as any,
    });
    expect(getServiceDistance(svc, [41, 29])).toBe(Number.POSITIVE_INFINITY);
  });

  it("returns 0 when service is at the user position", () => {
    const svc = makeService({ _id: "s1", location: { latitude: 41, longitude: 29, address: "Istanbul" } });
    expect(getServiceDistance(svc, [41, 29])).toBe(0);
  });

  it("returns positive distance for different coordinates", () => {
    const svc = makeService({ _id: "s1", location: { latitude: 39.93, longitude: 32.86, address: "Ankara" } });
    const dist = getServiceDistance(svc, [41.01, 28.98]);
    expect(dist).toBeGreaterThan(300);
  });
});

describe("sortDashboardServices", () => {
  const base = [
    makeService({ _id: "a", created_at: "2026-01-03T00:00:00Z", estimated_duration: 2 }),
    makeService({ _id: "b", created_at: "2026-01-01T00:00:00Z", estimated_duration: 4 }),
    makeService({ _id: "c", created_at: "2026-01-02T00:00:00Z", estimated_duration: 1 }),
  ];

  it("sorts by newest first", () => {
    const sorted = sortDashboardServices(base, "newest", null);
    expect(sorted.map((s) => s._id)).toEqual(["a", "c", "b"]);
  });

  it("sorts by oldest first", () => {
    const sorted = sortDashboardServices(base, "oldest", null);
    expect(sorted.map((s) => s._id)).toEqual(["b", "c", "a"]);
  });

  it("sorts by hours descending", () => {
    const sorted = sortDashboardServices(base, "hours_desc", null);
    expect(sorted[0]._id).toBe("b"); // 4h
    expect(sorted[2]._id).toBe("c"); // 1h
  });

  it("sorts by hours ascending", () => {
    const sorted = sortDashboardServices(base, "hours_asc", null);
    expect(sorted[0]._id).toBe("c"); // 1h
    expect(sorted[2]._id).toBe("b"); // 4h
  });

  it("sorts by closest when userPosition is provided", () => {
    const userPos: [number, number] = [41, 29]; // Istanbul
    const services = [
      makeService({ _id: "near", location: { latitude: 41.01, longitude: 29.01, address: "Istanbul" } }),
      makeService({ _id: "far", location: { latitude: 39.93, longitude: 32.86, address: "Ankara" } }),
    ];
    const sorted = sortDashboardServices(services, "closest", userPos);
    expect(sorted[0]._id).toBe("near");
    expect(sorted[1]._id).toBe("far");
  });

  it("sorts by farthest when userPosition is provided", () => {
    const userPos: [number, number] = [41, 29];
    const services = [
      makeService({ _id: "near", location: { latitude: 41.01, longitude: 29.01, address: "Istanbul" } }),
      makeService({ _id: "far", location: { latitude: 39.93, longitude: 32.86, address: "Ankara" } }),
    ];
    const sorted = sortDashboardServices(services, "farthest", userPos);
    expect(sorted[0]._id).toBe("far");
    expect(sorted[1]._id).toBe("near");
  });

  it("does not mutate the original array", () => {
    const copy = [...base];
    sortDashboardServices(base, "oldest", null);
    expect(base.map((s) => s._id)).toEqual(copy.map((s) => s._id));
  });

  it("returns array unchanged for unknown sort key", () => {
    const sorted = sortDashboardServices(base, "unknown" as any, null);
    expect(sorted.map((s) => s._id)).toEqual(base.map((s) => s._id));
  });

  it("uses created_at as tiebreaker for hours_desc", () => {
    const tied = [
      makeService({ _id: "old", estimated_duration: 2, created_at: "2026-01-01T00:00:00Z" }),
      makeService({ _id: "new", estimated_duration: 2, created_at: "2026-01-02T00:00:00Z" }),
    ];
    const sorted = sortDashboardServices(tied, "hours_desc", null);
    expect(sorted[0]._id).toBe("new");
  });
});
