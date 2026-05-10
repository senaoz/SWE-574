import { type ForumEvent } from "@/types";

export function eventHasMapLocation(event: ForumEvent): boolean {
  return event.latitude != null && event.longitude != null;
}

export function isUpcomingEvent(
  event: Pick<ForumEvent, "event_at">,
  now = new Date(),
): boolean {
  const eventTime = Date.parse(event.event_at);
  return Number.isFinite(eventTime) && eventTime >= now.getTime();
}

export function getUpcomingMapEvents(
  events: ForumEvent[],
  now = new Date(),
): ForumEvent[] {
  return events
    .filter(eventHasMapLocation)
    .filter((event) => isUpcomingEvent(event, now));
}
