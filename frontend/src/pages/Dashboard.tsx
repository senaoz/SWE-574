import {
  ServiceMap,
  applyMapFilters,
  defaultMapFilters,
  type MapFilters,
} from "@/components/map/ServiceMap";
import { OfferListingCard } from "@/components/ui/OfferListingCard";
import {
  DashboardFilterBar,
  type DashboardFilters,
} from "@/components/ui/DashboardFilterBar";
import { servicesApi, forumApi, usersApi } from "@/services/api";
import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Heading,
  Text,
  Callout,
} from "@radix-ui/themes";
import {
  Crosshair1Icon,
  HandIcon,
  PlusIcon,
  SunIcon,
} from "@radix-ui/react-icons";
import { OfferNeedForm } from "@/components/forms/OfferNeedForm";
import { useFilters } from "@/contexts/FilterContext";
import { useUser } from "@/contexts/UserContext";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ForumEvent,
  RecommendedServiceItem,
  Service,
  TagEntity,
} from "@/types";
import {
  getDashboardFiltersFromSearchParams,
  setDashboardFiltersInSearchParams,
} from "@/utils/dashboardFilterSearchParams";

const RECOMMENDATION_PAGE_SIZE = 10;
const MAX_RECOMMENDATION_POSTS = 30;

function distanceKmBetween(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function getServiceDistance(
  service: Service,
  userPosition: [number, number] | null,
): number {
  if (!userPosition) return Number.POSITIVE_INFINITY;

  const latitude = service.location?.latitude;
  const longitude = service.location?.longitude;
  if (latitude == null || longitude == null) return Number.POSITIVE_INFINITY;

  return distanceKmBetween(
    userPosition[0],
    userPosition[1],
    latitude,
    longitude,
  );
}

function sortDashboardServices(
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

export function Dashboard() {
  const { currentUserId } = useUser();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const { searchQuery, selectedCity, setSelectedCity } = useFilters();
  const [searchParams, setSearchParams] = useSearchParams();
  const tagParam = searchParams.get("tag");
  const dashFilters = useMemo(
    () => getDashboardFiltersFromSearchParams(searchParams, selectedCity),
    [searchParams, selectedCity],
  );
  const [mapFilters, setMapFilters] = useState<MapFilters>(() => ({
    ...defaultMapFilters,
    serviceType: dashFilters.serviceType,
    distance: dashFilters.distance,
  }));
  const [userPosition, setUserPosition] = useState<[number, number] | null>(
    null,
  );
  const [recommendedPage, setRecommendedPage] = useState(1);
  const [loadedRecommendedServices, setLoadedRecommendedServices] = useState<
    RecommendedServiceItem[]
  >([]);
  const { data: timebankData } = useQuery({
    queryKey: ["timebank"],
    queryFn: () => usersApi.getTimeBank().then((res) => res.data),
    enabled: !!localStorage.getItem("access_token"),
    retry: false,
  });
  const [forumEvents, setForumEvents] = useState<ForumEvent[]>([]);

  const availableTags = useMemo<TagEntity[]>(() => {
    const seen = new Set<string>();
    const tags: TagEntity[] = [];
    for (const service of services) {
      for (const tag of service.tags ?? []) {
        if (typeof tag === "string") continue;
        const id = tag.entityId || tag.label;
        if (!seen.has(id)) {
          seen.add(id);
          tags.push(tag);
        }
      }
    }
    return tags.sort((left, right) => left.label.localeCompare(right.label));
  }, [services]);

  const remoteRecommendationFilter =
    dashFilters.remoteFilter === "remote"
      ? true
      : dashFilters.remoteFilter === "in_person"
        ? false
        : undefined;
  const activeCity = dashFilters.city;

  useEffect(() => {
    if (selectedCity === activeCity) return;
    setSelectedCity(activeCity);
  }, [activeCity, selectedCity, setSelectedCity]);

  useEffect(() => {
    setMapFilters((prev) => {
      if (
        prev.serviceType === dashFilters.serviceType &&
        prev.distance === dashFilters.distance
      ) {
        return prev;
      }

      return {
        ...prev,
        serviceType: dashFilters.serviceType,
        distance: dashFilters.distance,
      };
    });
  }, [dashFilters.distance, dashFilters.serviceType]);

  useEffect(() => {
    setRecommendedPage(1);
    setLoadedRecommendedServices([]);
  }, [
    currentUserId,
    dashFilters.forYouOnly,
    searchQuery,
    activeCity,
    dashFilters.serviceType,
    dashFilters.status,
    dashFilters.selectedTags,
    dashFilters.remoteFilter,
    dashFilters.distance,
    dashFilters.dateFilter,
    userPosition?.[0],
    userPosition?.[1],
  ]);

  const { data: recommendedServicesData, isFetching: isRecommendationsLoading } =
    useQuery({
      queryKey: [
        "dashboard-recommendations",
        currentUserId,
        recommendedPage,
        searchQuery,
        activeCity,
        dashFilters.serviceType,
        dashFilters.status,
        dashFilters.selectedTags,
        dashFilters.remoteFilter,
        dashFilters.distance,
        dashFilters.dateFilter,
        userPosition?.[0],
        userPosition?.[1],
      ],
      queryFn: () =>
        servicesApi
          .getRecommendedServices({
            page: recommendedPage,
            limit: RECOMMENDATION_PAGE_SIZE,
            q: searchQuery?.trim() || undefined,
            service_type:
              dashFilters.serviceType !== "all"
                ? dashFilters.serviceType
                : undefined,
            status:
              dashFilters.status !== "all" ? dashFilters.status : undefined,
            tags:
              dashFilters.selectedTags.length > 0
                ? dashFilters.selectedTags.join(",")
                : undefined,
            city: activeCity && activeCity !== "all" ? activeCity : undefined,
            latitude: userPosition?.[0],
            longitude: userPosition?.[1],
            radius:
              typeof dashFilters.distance === "number"
                ? dashFilters.distance
                : undefined,
            is_remote: remoteRecommendationFilter,
            date_filter:
              dashFilters.dateFilter !== "all"
                ? dashFilters.dateFilter
                : undefined,
          })
          .then((res) => res.data),
      enabled: !!currentUserId && dashFilters.forYouOnly,
      retry: false,
    });

  useEffect(() => {
    if (!recommendedServicesData || !dashFilters.forYouOnly) return;

    setLoadedRecommendedServices((prev) => {
      if (recommendedPage === 1) {
        return recommendedServicesData.items;
      }

      const merged = [...prev];
      for (const item of recommendedServicesData.items) {
        if (!merged.some((existing) => existing.service._id === item.service._id)) {
          merged.push(item);
        }
      }
      return merged;
    });
  }, [dashFilters.forYouOnly, recommendedPage, recommendedServicesData]);

  const handleDashFiltersChange = useCallback(
    (next: DashboardFilters) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          return setDashboardFiltersInSearchParams(params, next);
        },
        { replace: true },
      );
      setSelectedCity(next.city);
    },
    [setSearchParams, setSelectedCity],
  );

  useEffect(() => {
    const onSuccess = (pos: GeolocationPosition) => {
      setUserPosition([pos.coords.latitude, pos.coords.longitude]);
    };

    const ipFallback = () => {
      fetch("https://ipapi.co/json/")
        .then((response) => {
          if (!response.ok) throw new Error("IP lookup failed");
          return response.json();
        })
        .then((data) => {
          if (data.latitude && data.longitude) {
            setUserPosition([data.latitude, data.longitude]);
          } else {
            setUserPosition([41.0082, 28.9784]);
          }
        })
        .catch(() => setUserPosition([41.0082, 28.9784]));
    };

    if (!navigator.geolocation) {
      ipFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(onSuccess, () => ipFallback(), {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000,
    });
  }, []);

  useEffect(() => {
    forumApi
      .getEvents({ has_location: true, limit: 200 })
      .then((response) => setForumEvents(response.data.events || []))
      .catch(() => setForumEvents([]));
  }, []);

  const fetchServices = async (searchValue?: string) => {
    const isInitialLoad = services.length === 0 && loading;

    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsSearching(true);
      }

      const response = await servicesApi.getServices({
        q: searchValue?.trim() || undefined,
        limit: 500,
      });

      setServices(response.data.services || []);
      setFilteredServices(response.data.services || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices([]);
      setFilteredServices([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      fetchServices();
      return;
    }

    const timeout = setTimeout(() => {
      fetchServices(searchQuery);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    let filtered = services;

    if (tagParam && tagParam.trim()) {
      const decoded = decodeURIComponent(tagParam.trim());
      const isEntityId = /^Q\d+$/i.test(decoded);
      filtered = filtered.filter((service) =>
        service.tags?.some((tag) => {
          if (typeof tag === "string") return tag === decoded;
          if (isEntityId) return tag.entityId === decoded;
          return tag.label === decoded || tag.entityId === decoded;
        }),
      );
    }

    if (activeCity && activeCity !== "all") {
      filtered = filtered.filter((service) => {
        const address = service.location.address?.toLowerCase() || "";
        return address.includes(activeCity.toLowerCase());
      });
    }

    setFilteredServices(filtered);
  }, [services, activeCity, tagParam]);

  const eligibleServices = useMemo(() => {
    let list = applyMapFilters(filteredServices, mapFilters, userPosition);

    if (dashFilters.status !== "all") {
      list = list.filter((service) => service.status === dashFilters.status);
    }

    if (dashFilters.remoteFilter === "remote") {
      list = list.filter((service) => service.is_remote === true);
    } else if (dashFilters.remoteFilter === "in_person") {
      list = list.filter((service) => service.is_remote === false);
    }

    if (dashFilters.selectedTags.length > 0) {
      list = list.filter((service) =>
        dashFilters.selectedTags.some((tagId) =>
          (service.tags ?? []).some((tag) => {
            if (typeof tag === "string") return tag === tagId;
            return tag.entityId === tagId || tag.label === tagId;
          }),
        ),
      );
    }

    if (dashFilters.dateFilter !== "all") {
      if (dashFilters.dateFilter === "open_availability") {
        list = list.filter((service) => service.scheduling_type === "open");
      } else if (dashFilters.dateFilter === "recurring") {
        list = list.filter(
          (service) => service.scheduling_type === "recurring",
        );
      } else {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

        list = list.filter((service) => {
          if (
            service.scheduling_type !== "specific" ||
            !service.specific_date
          ) {
            return false;
          }

          const dateStr = service.specific_date.slice(0, 10);
          if (dashFilters.dateFilter === "today") return dateStr === todayStr;
          if (dashFilters.dateFilter === "tomorrow") {
            return dateStr === tomorrowStr;
          }

          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);

          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);

          const serviceDate = new Date(service.specific_date);
          return serviceDate >= startOfWeek && serviceDate <= endOfWeek;
        });
      }
    }

    return list;
  }, [filteredServices, mapFilters, userPosition, dashFilters]);

  const recommendedServices: RecommendedServiceItem[] = loadedRecommendedServices;
  const maxVisibleRecommendationCount = Math.min(
    recommendedServicesData?.total ?? recommendedServices.length,
    MAX_RECOMMENDATION_POSTS,
  );
  const canLoadMoreRecommendations =
    dashFilters.forYouOnly &&
    recommendedServices.length < maxVisibleRecommendationCount &&
    recommendedPage < MAX_RECOMMENDATION_POSTS / RECOMMENDATION_PAGE_SIZE;

  const recommendationReasonMap = useMemo(
    () =>
      new Map(
        recommendedServices.map(
          (item) => [item.service._id, item.reason] as const,
        ),
      ),
    [recommendedServices],
  );

  const baseDisplayedServices = useMemo(
    () =>
      dashFilters.forYouOnly
        ? applyMapFilters(
            recommendedServices.map((item) => item.service),
            mapFilters,
            userPosition,
          )
        : eligibleServices,
    [
      dashFilters.forYouOnly,
      eligibleServices,
      mapFilters,
      recommendedServices,
      userPosition,
    ],
  );
  const displayedServices = useMemo(
    () =>
      sortDashboardServices(
        baseDisplayedServices,
        dashFilters.sortBy,
        userPosition,
      ),
    [baseDisplayedServices, dashFilters.sortBy, userPosition],
  );
  const isForYouLoading =
    dashFilters.forYouOnly &&
    isRecommendationsLoading &&
    recommendedPage === 1 &&
    recommendedServices.length === 0;
  const isLoadingMoreRecommendations =
    dashFilters.forYouOnly &&
    isRecommendationsLoading &&
    recommendedPage > 1;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Text>Loading services...</Text>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CreateServiceDialog
        onServiceCreated={fetchServices}
        requiresNeedCreation={timebankData?.requires_need_creation}
      />

      {timebankData?.requires_need_creation && (
        <Callout.Root color="amber">
          <Callout.Icon>
            <HandIcon />
          </Callout.Icon>
          <Callout.Text>
            You've reached the 10-hour surplus limit. Create a Need to help
            balance the community and use your hours.
          </Callout.Text>
        </Callout.Root>
      )}

      <Flex
        gap="2"
        className="sticky top-16 z-20 bg-background py-2"
        direction="column"
        id="dashboard-header"
      >
        <Flex align="center" gap="2" wrap="wrap">
          <Crosshair1Icon className="h-4 w-4" />
          <Text size="2" weight="medium" color="gray">
            {isSearching
              ? "Searching..."
              : isForYouLoading
                ? "Finding picks for you..."
                : dashFilters.forYouOnly
                  ? `${displayedServices.length} picks for you`
                  : `${displayedServices.length} services found`}
            {searchQuery && ` for "${searchQuery}"`}
            {activeCity && activeCity !== "all" && ` in ${activeCity}`}
            {tagParam && ` with tag "${decodeURIComponent(tagParam)}"`}
          </Text>
          {tagParam && (
            <Button
              size="1"
              variant="soft"
              color="gray"
              onClick={() => {
                setSearchParams((prev) => {
                  prev.delete("tag");
                  return prev;
                });
              }}
            >
              Clear tag
            </Button>
          )}
        </Flex>
        <DashboardFilterBar
          filters={dashFilters}
          onFiltersChange={handleDashFiltersChange}
          availableTags={availableTags}
          hasLocation={userPosition !== null}
        />
      </Flex>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <div className="space-y-3 xl:pr-2">
          <div
            className={`grid grid-cols-1 gap-3 transition-opacity duration-200 md:grid-cols-2 ${
              isSearching || isForYouLoading
                ? "pointer-events-none opacity-50"
                : "opacity-100"
            }`}
          >
            {displayedServices.map((service, index) => (
              <div
                key={service._id}
                className="service-card-animate"
                style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
              >
                <OfferListingCard
                  service={service}
                  isRecommended={dashFilters.forYouOnly}
                  recommendationReason={
                    dashFilters.forYouOnly
                      ? recommendationReasonMap.get(service._id)
                      : undefined
                  }
                />
              </div>
            ))}
          </div>

          {canLoadMoreRecommendations && (
            <Flex justify="center" pt="2">
              <Button
                size="2"
                variant="soft"
                color="gray"
                onClick={() =>
                  setRecommendedPage((prev) =>
                    Math.min(
                      prev + 1,
                      MAX_RECOMMENDATION_POSTS / RECOMMENDATION_PAGE_SIZE,
                    ),
                  )
                }
                disabled={isLoadingMoreRecommendations}
              >
                {isLoadingMoreRecommendations ? "Loading..." : "Load more"}
              </Button>
            </Flex>
          )}

          {displayedServices.length === 0 && !loading && !isForYouLoading && (
            <Card className="flex flex-col items-center justify-center">
              <Text size="3" color="gray">
                {dashFilters.forYouOnly
                  ? "No personalized recommendations found"
                  : "No services found matching your criteria"}
              </Text>
              <Text size="2" color="gray" className="mt-2">
                {dashFilters.forYouOnly
                  ? "Try broadening your filters to see more matches"
                  : "Try adjusting your search or city filter"}
              </Text>
            </Card>
          )}
        </div>

        <ServiceMap
          services={displayedServices}
          events={forumEvents}
          filters={mapFilters}
          onFiltersChange={setMapFilters}
          userPosition={userPosition}
          height={`calc(100vh - 220px)`}
        />
      </div>
    </div>
  );
}

function CreateServiceDialog({
  onServiceCreated,
  requiresNeedCreation,
}: {
  onServiceCreated?: (searchValue?: string) => Promise<void>;
  requiresNeedCreation?: boolean;
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<
    "offer" | "need"
  >("need");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <Dialog.Root open={showDialog} onOpenChange={setShowDialog}>
      <Dialog.Trigger>
        <Button className="add-service-button shadow-lg">
          <PlusIcon className="h-10 w-10 stroke-4 stroke-black" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Content
        align="center"
        size="4"
        className="overflow-y-auto p-4 md:p-12"
        aria-describedby={undefined}
        maxWidth="80vw"
        maxHeight="80vh"
      >
        <div className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2">
          {errorMessage && (
            <Text size="2" color="red" className="col-span-2 text-center">
              {errorMessage}
            </Text>
          )}
          <Box
            className={`border-2 rounded-lg hover-card px-8 py-4 text-center ${
              selectedServiceType === "offer" ? "hover-card-selected offer" : ""
            } ${requiresNeedCreation ? "cursor-not-allowed opacity-50" : ""}`}
            onClick={() => {
              if (requiresNeedCreation) {
                setErrorMessage(
                  "You need to create a need before you can offer a service to others. You reached the 10-hour surplus limit.",
                );
                return;
              }
              setSelectedServiceType("offer");
            }}
          >
            <Heading size="5" className="mb-1 flex items-center justify-center">
              <SunIcon className="mr-2 h-6 w-6 text-orange-500" />
              Offer a Service
            </Heading>
            <Text size="2">
              Share your skills and services with the community, let others know
              what you're offering.
            </Text>
          </Box>
          <Box
            className={`border-2 rounded-lg hover-card px-10 py-4 text-center ${
              selectedServiceType === "need" ? "hover-card-selected need" : ""
            }`}
            onClick={() => setSelectedServiceType("need")}
          >
            <Heading size="5" className="mb-1 flex items-center justify-center">
              <HandIcon className="mr-2 h-6 w-6 text-blue-500" />
              Need a Service
            </Heading>
            <Text size="2">
              Request a service from the community, let others know what you're
              looking for.
            </Text>
          </Box>
        </div>
        <OfferNeedForm
          serviceType={selectedServiceType}
          onSuccess={() => {
            setShowDialog(false);
            if (onServiceCreated) {
              onServiceCreated();
            }
          }}
          onClose={() => {
            setShowDialog(false);
          }}
        />
      </Dialog.Content>
    </Dialog.Root>
  );
}
