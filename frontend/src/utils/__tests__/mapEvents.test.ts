import { describe, expect, it } from "vitest";
import { ForumEvent } from "@/types";
import {
  eventHasMapLocation,
  getUpcomingMapEvents,
  isUpcomingEvent,
} from "@/utils/mapEvents";

function event(overrides: Partial<ForumEvent>): ForumEvent {
  return {
    _id: "event-1",
    user_id: "user-1",
    title: "Event",
    description: "Description",
    event_at: "2026-05-06T12:00:00.000Z",
    latitude: 41,
    longitude: 29,
    is_remote: false,
    tags: [],
    created_at: "2026-05-01T12:00:00.000Z",
    updated_at: "2026-05-01T12:00:00.000Z",
    comment_count: 0,
    attendee_ids: [],
    attendee_count: 0,
    upvote_count: 0,
    is_pinned: false,
    ...overrides,
  };
}

describe("mapEvents", () => {
  const now = new Date("2026-05-05T12:00:00.000Z");

  it("recognizes events with map coordinates", () => {
    expect(eventHasMapLocation(event({ latitude: 41, longitude: 29 }))).toBe(
      true,
    );
    expect(eventHasMapLocation(event({ latitude: undefined }))).toBe(false);
    expect(eventHasMapLocation(event({ longitude: null as never }))).toBe(
      false,
    );
  });

  it("shows only events that have not happened yet", () => {
    expect(
      isUpcomingEvent(event({ event_at: "2026-05-05T12:00:00.000Z" }), now),
    ).toBe(true);
    expect(
      isUpcomingEvent(event({ event_at: "2026-05-05T11:59:59.000Z" }), now),
    ).toBe(false);
    expect(isUpcomingEvent(event({ event_at: "not-a-date" }), now)).toBe(
      false,
    );
  });

  it("filters map markers to upcoming located events", () => {
    const upcomingLocated = event({ _id: "upcoming" });
    const pastLocated = event({
      _id: "past",
      event_at: "2026-05-04T12:00:00.000Z",
    });
    const upcomingRemote = event({ _id: "remote", latitude: undefined });

    expect(
      getUpcomingMapEvents([upcomingLocated, pastLocated, upcomingRemote], now),
    ).toEqual([upcomingLocated]);
  });
});
