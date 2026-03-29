import { type DashboardFilters } from "@/components/ui/DashboardFilterBar";
import { Service } from "@/types";
import { calculateDistance } from "@/utils/utils";

export function getServiceDistance(
  service: Service,
  userPosition: [number, number] | null,
): number {
  if (!userPosition) return Number.POSITIVE_INFINITY;

  const latitude = service.location?.latitude;
  const longitude = service.location?.longitude;
  if (latitude == null || longitude == null) return Number.POSITIVE_INFINITY;

  return calculateDistance(userPosition[0], userPosition[1], latitude, longitude);
}

export function sortDashboardServices(
  services: Service[],
  sortBy: DashboardFilters["sortBy"],
  userPosition: [number, number] | null,
): Service[] {
  const sorted = [...services];

  if (sortBy === "newest") {
    return sorted.sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    );
  }

  if (sortBy === "oldest") {
    return sorted.sort(
      (left, right) =>
        new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
    );
  }

  if (sortBy === "hours_desc") {
    return sorted.sort((left, right) => {
      const durationDiff =
        (right.estimated_duration ?? 0) - (left.estimated_duration ?? 0);
      if (durationDiff !== 0) return durationDiff;
      return (
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      );
    });
  }

  if (sortBy === "hours_asc") {
    return sorted.sort((left, right) => {
      const durationDiff =
        (left.estimated_duration ?? 0) - (right.estimated_duration ?? 0);
      if (durationDiff !== 0) return durationDiff;
      return (
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      );
    });
  }

  if (sortBy === "closest") {
    return sorted.sort((left, right) => {
      const leftDistance = getServiceDistance(left, userPosition);
      const rightDistance = getServiceDistance(right, userPosition);
      if (leftDistance !== rightDistance) return leftDistance - rightDistance;
      return (
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      );
    });
  }

  if (sortBy === "farthest") {
    return sorted.sort((left, right) => {
      const leftDistance = getServiceDistance(left, userPosition);
      const rightDistance = getServiceDistance(right, userPosition);
      if (leftDistance !== rightDistance) return rightDistance - leftDistance;
      return (
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      );
    });
  }

  return sorted;
}