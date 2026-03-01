import {
  ServiceMap,
  applyMapFilters,
  defaultMapFilters,
  type MapFilters,
} from "@/components/map/ServiceMap";
import { OfferListingCard } from "@/components/ui/OfferListingCard";
import { servicesApi, forumApi } from "@/services/api";
import {
  Button,
  Dialog,
  Heading,
  Text,
  Flex,
  Card,
  Box,
} from "@radix-ui/themes";
import {
  HandIcon,
  SunIcon,
  Crosshair1Icon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { usersApi } from "@/services/api";
import { Callout } from "@radix-ui/themes";
import { OfferNeedForm } from "@/components/forms/OfferNeedForm";
import { useFilters } from "@/contexts/FilterContext";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Service } from "@/types";
import { ForumEvent } from "@/types";

export function Dashboard() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchQuery, selectedCity } = useFilters();
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [searchParams, setSearchParams] = useSearchParams();
  const tagParam = searchParams.get("tag");
  const [mapFilters, setMapFilters] = useState<MapFilters>(defaultMapFilters);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(
    null,
  );
  const [needDialogOpen, setNeedDialogOpen] = useState(false);

  const { data: timebankData } = useQuery({
    queryKey: ["timebank"],
    queryFn: () => usersApi.getTimeBank().then((res) => res.data),
    enabled: !!localStorage.getItem("access_token"),
    retry: false,
  });
  const [forumEvents, setForumEvents] = useState<ForumEvent[]>([]);

  useEffect(() => {
    const onSuccess = (pos: GeolocationPosition) => {
      setUserPosition([pos.coords.latitude, pos.coords.longitude]);
    };
    const ipFallback = () => {
      fetch("https://ipwho.is/")
        .then((r) => r.json())
        .then((d) => {
          if (d.latitude && d.longitude) setUserPosition([d.latitude, d.longitude]);
          else setUserPosition([41.0082, 28.9784]);
        })
        .catch(() => setUserPosition([41.0082, 28.9784]));
    };
    if (!navigator.geolocation) { ipFallback(); return; }
    navigator.geolocation.getCurrentPosition(onSuccess, () => ipFallback(), {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000,
    });
  }, []);

  useEffect(() => {
    forumApi
      .getEvents({ has_location: true, limit: 200 })
      .then((r) => setForumEvents(r.data.events || []))
      .catch(() => setForumEvents([]));
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await servicesApi.getServices();
      console.log(response.data);
      setServices(response.data.services || []);
      setFilteredServices(response.data.services || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices([]);
      setFilteredServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Filter services based on search query, city, and tag URL param
  useEffect(() => {
    let filtered = services;

    // Filter by tag (URL param): match entityId or decoded label
    if (tagParam && tagParam.trim()) {
      const decoded = decodeURIComponent(tagParam.trim());
      const isEntityId = /^Q\d+$/i.test(decoded);
      filtered = filtered.filter((service) =>
        service.tags.some((tag) => {
          if (typeof tag === "string") return tag === decoded;
          if (isEntityId) return tag.entityId === decoded;
          return tag.label === decoded || tag.entityId === decoded;
        }),
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (service) =>
          service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.tags.some((tag) => {
            const tagLabel = typeof tag === "string" ? tag : tag.label;
            return tagLabel.toLowerCase().includes(searchQuery.toLowerCase());
          }),
      );
    }

    // Filter by city
    if (selectedCity && selectedCity !== "all") {
      filtered = filtered.filter((service) => {
        const address = service.location.address?.toLowerCase() || "";
        return address.includes(selectedCity.toLowerCase());
      });
    }

    setFilteredServices(filtered);
  }, [services, searchQuery, selectedCity, tagParam]);

  const displayedServices = useMemo(
    () => applyMapFilters(filteredServices, mapFilters, userPosition),
    [filteredServices, mapFilters, userPosition],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Text>Loading services...</Text>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="pr-4 space-y-2">
          <CreateServiceDialog
            onServiceCreated={fetchServices}
            disabled={!!timebankData?.requires_need_creation}
          />

          {timebankData?.requires_need_creation && (
            <Callout.Root color="amber" className="mb-4">
              <Callout.Icon>
                <HandIcon />
              </Callout.Icon>
              <Callout.Text>
                You've reached the 10-hour surplus limit. Create a Need to help
                balance the community and use your hours.
              </Callout.Text>
              <Button
                size="2"
                color="amber"
                variant="soft"
                onClick={() => setNeedDialogOpen(true)}
                className="mt-2"
              >
                Create Need
              </Button>
            </Callout.Root>
          )}

          {/* Services Count and Results */}
          <Flex gap="2" className="mb-4" direction="column">
            <Flex align="center" gap="2" wrap="wrap">
              <Crosshair1Icon className="w-4 h-4" />
              <Text size="2" weight="medium" color="gray">
                {displayedServices.length} services found
                {searchQuery && ` for "${searchQuery}"`}
                {selectedCity &&
                  selectedCity !== "all" &&
                  ` in ${selectedCity}`}
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

            <Flex align="center" gap="2" direction="row" wrap="wrap">
              {/* Status Filters */}
              <Button
                size="1"
                color="gray"
                variant="outline"
                onClick={() => setSelectedStatusFilter("all")}
              >
                All
              </Button>
              <Button
                size="1"
                color="green"
                variant="outline"
                onClick={() => setSelectedStatusFilter("active")}
              >
                Active
              </Button>
              <Button
                size="1"
                color="blue"
                variant="outline"
                onClick={() => setSelectedStatusFilter("in_progress")}
              >
                In Progress
              </Button>
              <Button
                size="1"
                color="gray"
                variant="outline"
                onClick={() => setSelectedStatusFilter("completed")}
              >
                Completed
              </Button>
              <Button
                size="1"
                color="red"
                variant="outline"
                onClick={() => setSelectedStatusFilter("cancelled")}
              >
                Cancelled
              </Button>
              <Button
                size="1"
                color="orange"
                variant="outline"
                onClick={() => setSelectedStatusFilter("expired")}
              >
                Expired
              </Button>
            </Flex>
          </Flex>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayedServices
              .filter((service) =>
                selectedStatusFilter === "all"
                  ? true
                  : service.status === selectedStatusFilter,
              )
              .map((service) => (
                <OfferListingCard key={service._id} service={service} />
              ))}
          </div>

          {/* No Results Message */}
          {displayedServices.length === 0 && !loading && (
            <Card className="flex flex-col items-center justify-center">
              <Text size="3" color="gray">
                No services found matching your criteria
              </Text>
              <Text size="2" color="gray" className="mt-2">
                Try adjusting your search or city filter
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
        />
      </div>
    </div>
  );
}

function CreateServiceDialog({
  onServiceCreated,
  disabled,
}: {
  onServiceCreated?: () => void;
  disabled?: boolean;
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<
    "offer" | "need"
  >("offer");

  return (
    <Dialog.Root open={showDialog} onOpenChange={setShowDialog}>
      <Dialog.Trigger disabled={disabled}>
        <Button disabled={disabled} className="add-service-button shadow-lg">
          <PlusIcon className="w-10 h-10 stroke-4 stroke-black" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Content
        align="center"
        size="4"
        className="p-4 md:p-12 overflow-y-auto"
        aria-describedby={undefined}
        maxWidth={"80vw"}
        maxHeight={"80vh"}
      >
        <div className="pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Box
            className={`border-2 rounded-lg hover-card text-center py-4 px-8 ${selectedServiceType === "offer" ? "hover-card-selected offer" : ""}`}
            onClick={() => setSelectedServiceType("offer")}
          >
            <Heading size="5" className="flex items-center justify-center mb-1">
              <SunIcon className="w-6 h-6 text-orange-500 mr-2" />
              Offer a Service
            </Heading>
            <Text size="2">
              Share your skills and services with the community, let others know
              what you're offering.
            </Text>
          </Box>
          <Box
            className={`border-2 rounded-lg hover-card text-center py-4 px-10 ${selectedServiceType === "need" ? "hover-card-selected need" : ""}`}
            onClick={() => setSelectedServiceType("need")}
          >
            <Heading size="5" className="flex items-center justify-center mb-1">
              <HandIcon className="w-6 h-6 text-blue-500 mr-2" />
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
            // Refresh services list after successful creation
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
