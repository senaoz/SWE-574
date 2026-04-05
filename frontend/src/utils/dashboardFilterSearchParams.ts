import {
  defaultDashboardFilters,
  type DashboardFilters,
} from "@/components/ui/DashboardFilterBar";

const DASHBOARD_FILTER_QUERY_KEYS = {
  forYouOnly: "forYou",
  serviceType: "serviceType",
  status: "status",
  selectedTags: "tags",
  remoteFilter: "remote",
  distance: "distance",
  city: "city",
  sortBy: "sort",
  dateFilter: "availability",
} as const;

const SERVICE_TYPE_VALUES = ["all", "offer", "need"] as const;
const STATUS_VALUES = [
  "all",
  "active",
  "in_progress",
  "completed",
  "cancelled",
  "expired",
] as const;
const REMOTE_VALUES = ["all", "remote", "in_person"] as const;
const SORT_VALUES = [
  "default",
  "newest",
  "oldest",
  "hours_desc",
  "hours_asc",
  "closest",
  "farthest",
] as const;
const DATE_FILTER_VALUES = [
  "all",
  "today",
  "tomorrow",
  "this_week",
  "open_availability",
  "recurring",
] as const;

function getValidValue<T extends string>(
  value: string | null,
  allowedValues: readonly T[],
  fallback: T,
): T {
  if (value == null) return fallback;
  return allowedValues.includes(value as T) ? (value as T) : fallback;
}

function getDistanceValue(value: string | null): number | "any" {
  if (value == null || value === "any") return "any";

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : "any";
}

export function getDashboardFiltersFromSearchParams(
  searchParams: URLSearchParams,
  fallbackCity = defaultDashboardFilters.city,
): DashboardFilters {
  const city =
    searchParams.get(DASHBOARD_FILTER_QUERY_KEYS.city) ?? fallbackCity;
  const tagsParam = searchParams.get(DASHBOARD_FILTER_QUERY_KEYS.selectedTags);

  return {
    forYouOnly: ["1", "true"].includes(
      searchParams.get(DASHBOARD_FILTER_QUERY_KEYS.forYouOnly) ?? "",
    ),
    serviceType: getValidValue(
      searchParams.get(DASHBOARD_FILTER_QUERY_KEYS.serviceType),
      SERVICE_TYPE_VALUES,
      defaultDashboardFilters.serviceType,
    ),
    status: getValidValue(
      searchParams.get(DASHBOARD_FILTER_QUERY_KEYS.status),
      STATUS_VALUES,
      defaultDashboardFilters.status as (typeof STATUS_VALUES)[number],
    ),
    selectedTags: tagsParam
      ? tagsParam
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [],
    remoteFilter: getValidValue(
      searchParams.get(DASHBOARD_FILTER_QUERY_KEYS.remoteFilter),
      REMOTE_VALUES,
      defaultDashboardFilters.remoteFilter,
    ),
    distance: getDistanceValue(
      searchParams.get(DASHBOARD_FILTER_QUERY_KEYS.distance),
    ),
    city: city.trim() || defaultDashboardFilters.city,
    sortBy: getValidValue(
      searchParams.get(DASHBOARD_FILTER_QUERY_KEYS.sortBy),
      SORT_VALUES,
      defaultDashboardFilters.sortBy,
    ),
    dateFilter: getValidValue(
      searchParams.get(DASHBOARD_FILTER_QUERY_KEYS.dateFilter),
      DATE_FILTER_VALUES,
      defaultDashboardFilters.dateFilter,
    ),
  };
}

export function setDashboardFiltersInSearchParams(
  searchParams: URLSearchParams,
  filters: DashboardFilters,
): URLSearchParams {
  if (filters.forYouOnly) {
    searchParams.set(DASHBOARD_FILTER_QUERY_KEYS.forYouOnly, "1");
  } else {
    searchParams.delete(DASHBOARD_FILTER_QUERY_KEYS.forYouOnly);
  }

  if (filters.serviceType !== defaultDashboardFilters.serviceType) {
    searchParams.set(
      DASHBOARD_FILTER_QUERY_KEYS.serviceType,
      filters.serviceType,
    );
  } else {
    searchParams.delete(DASHBOARD_FILTER_QUERY_KEYS.serviceType);
  }

  if (filters.status !== defaultDashboardFilters.status) {
    searchParams.set(DASHBOARD_FILTER_QUERY_KEYS.status, filters.status);
  } else {
    searchParams.delete(DASHBOARD_FILTER_QUERY_KEYS.status);
  }

  if (filters.selectedTags.length > 0) {
    searchParams.set(
      DASHBOARD_FILTER_QUERY_KEYS.selectedTags,
      filters.selectedTags.join(","),
    );
  } else {
    searchParams.delete(DASHBOARD_FILTER_QUERY_KEYS.selectedTags);
  }

  if (filters.remoteFilter !== defaultDashboardFilters.remoteFilter) {
    searchParams.set(
      DASHBOARD_FILTER_QUERY_KEYS.remoteFilter,
      filters.remoteFilter,
    );
  } else {
    searchParams.delete(DASHBOARD_FILTER_QUERY_KEYS.remoteFilter);
  }

  if (filters.distance !== defaultDashboardFilters.distance) {
    searchParams.set(
      DASHBOARD_FILTER_QUERY_KEYS.distance,
      String(filters.distance),
    );
  } else {
    searchParams.delete(DASHBOARD_FILTER_QUERY_KEYS.distance);
  }

  if (filters.city !== defaultDashboardFilters.city) {
    searchParams.set(DASHBOARD_FILTER_QUERY_KEYS.city, filters.city);
  } else {
    searchParams.delete(DASHBOARD_FILTER_QUERY_KEYS.city);
  }

  if (filters.sortBy !== defaultDashboardFilters.sortBy) {
    searchParams.set(DASHBOARD_FILTER_QUERY_KEYS.sortBy, filters.sortBy);
  } else {
    searchParams.delete(DASHBOARD_FILTER_QUERY_KEYS.sortBy);
  }

  if (filters.dateFilter !== defaultDashboardFilters.dateFilter) {
    searchParams.set(
      DASHBOARD_FILTER_QUERY_KEYS.dateFilter,
      filters.dateFilter,
    );
  } else {
    searchParams.delete(DASHBOARD_FILTER_QUERY_KEYS.dateFilter);
  }

  return searchParams;
}
