import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import { Service, TagEntity, ForumEvent } from "@/types";
import { calculateDistance } from "@/utils/utils";
import { ratingsApi, usersApi } from "@/services/api";
import { getHighestPriorityBadge, CustomBadge } from "@/components/ui/BadgeDisplay";
import { Badge as BadgeType } from "@/types";
import {
  Badge,
  Button,
  Card,
  Flex,
  Select,
  Text,
  Switch,
} from "@radix-ui/themes";
import { useNavigate } from "react-router-dom";


const ISTANBUL_CENTER: [number, number] = [41.0082, 28.9784];
const DEFAULT_ZOOM = 10;
const USER_LOCATION_ZOOM = 12;
/** Radius (m) for the small area circle showing approximate service location (no exact address) */
const APPROXIMATE_LOCATION_RADIUS_M = 200;

/** Small center dot so marker reads as part of the area circle, not a separate pin */
const MARKER_SIZE = 20;
const MARKER_ANCHOR = MARKER_SIZE / 2;

const createIcon = (color: string, svg: string) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: ${MARKER_SIZE}px; height: ${MARKER_SIZE}px;
      border-radius: 50%;
      background-color: ${color};
      display: flex; align-items: center; justify-content: center;
    ">${svg}</div>`,
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_ANCHOR, MARKER_ANCHOR],
  });

// Open/giving hand (🫴) — offer service
const offerSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M11 12h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 14"/><path d="m7 18 1.6-1.4A2 2 0 0 1 9.9 16H14a2 2 0 0 0 2-2 2 2 0 0 0 2-2 2 2 0 0 0 .3-3.7V5a2 2 0 0 0-4 0v5"/><path d="m3 14 3 3"/></svg>`;
// Raised hand (✋) — need service
const needSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>`;
// Calendar (📅) — forum event
const eventSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;

const offerIcon = createIcon("#059669", offerSvg);
const needIcon  = createIcon("#d97706", needSvg);
const eventIcon = createIcon("#7c3aed", eventSvg);

export const DISTANCE_OPTIONS_KM = [5, 10, 25, 50, 100] as const;
const SERVICE_TYPE_OPTIONS = ["all", "offer", "need"] as const;
export type ServiceTypeFilter = (typeof SERVICE_TYPE_OPTIONS)[number];

export interface MapFilters {
  serviceType: ServiceTypeFilter;
  tag: string;
  distance: number | "any";
  showEvents: boolean;
}

/** Apply map filters (service type, tag, distance) to a service list. Exported for Dashboard. */
export function applyMapFilters(
  services: Service[],
  filters: MapFilters,
  userPosition: [number, number] | null,
): Service[] {
  let list = services;
  if (filters.serviceType !== "all") {
    list = list.filter((s) => s.service_type === filters.serviceType);
  }
  if (filters.tag && filters.tag !== "all") {
    const decoded = filters.tag;
    const isEntityId = /^Q\d+$/i.test(decoded);
    list = list.filter((service) =>
      (service.tags || []).some((tag) => {
        if (typeof tag === "string") return tag === decoded;
        if (isEntityId) return (tag as TagEntity).entityId === decoded;
        return (
          (tag as TagEntity).label === decoded ||
          (tag as TagEntity).entityId === decoded
        );
      }),
    );
  }
  if (
    filters.distance !== "any" &&
    userPosition &&
    typeof filters.distance === "number"
  ) {
    const [uLat, uLng] = userPosition;
    const radiusKm = filters.distance;
    list = list.filter((s) => {
      const d = calculateDistance(
        uLat,
        uLng,
        s.location.latitude,
        s.location.longitude,
      );
      return d <= radiusKm;
    });
  }
  return list;
}

export const defaultMapFilters: MapFilters = {
  serviceType: "all",
  tag: "all",
  distance: "any",
  showEvents: true,
};

/** Updates map view to user location when geolocation is available */
function MapLocationHandler({
  userPosition,
}: {
  userPosition: [number, number] | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!userPosition) return;
    map.flyTo(userPosition, USER_LOCATION_ZOOM, { duration: 1 });
  }, [map, userPosition]);
  return null;
}

export function ServiceMap({
  services,
  events = [],
  loading = false,
  height = "90vh",
  sticky = true,
  showFilters = true,
  filters: controlledFilters,
  onFiltersChange,
  userPosition: controlledUserPosition,
}: {
  services: Service[];
  events?: ForumEvent[];
  loading?: boolean;
  height?: string;
  sticky?: boolean;
  showFilters?: boolean;
  filters?: MapFilters;
  onFiltersChange?: (f: MapFilters) => void;
  userPosition?: [number, number] | null;
}) {
  const [internalUserPosition, setInternalUserPosition] = useState<
    [number, number] | null
  >(null);
  const [internalFilters, setInternalFilters] =
    useState<MapFilters>(defaultMapFilters);

  const isControlled = controlledFilters != null && onFiltersChange != null;
  const filters = isControlled ? controlledFilters! : internalFilters;
  const userPosition = controlledUserPosition ?? internalUserPosition;

  const setFilters = isControlled ? onFiltersChange! : setInternalFilters;

  // Get user location via browser API when not provided by parent
  useEffect(() => {
    if (controlledUserPosition !== undefined) return;
    const onSuccess = (pos: GeolocationPosition) => {
      setInternalUserPosition([pos.coords.latitude, pos.coords.longitude]);
    };
    const ipFallback = () => {
      fetch("https://ipapi.co/json/")
        .then((r) => {
          if (!r.ok) throw new Error("IP lookup failed");
          return r.json();
        })
        .then((d) => {
          if (d.latitude && d.longitude)
            setInternalUserPosition([d.latitude, d.longitude]);
          else setInternalUserPosition([41.0082, 28.9784]);
        })
        .catch(() => setInternalUserPosition([41.0082, 28.9784]));
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
  }, [controlledUserPosition]);

  // When controlled, parent passes already-filtered services; when uncontrolled, filter here
  const filteredServices = useMemo(() => {
    if (isControlled) return services;
    return applyMapFilters(services, filters, userPosition);
  }, [isControlled, services, filters, userPosition]);

  const filteredEvents = useMemo(() => {
    let list = events.filter((e) => e.latitude != null && e.longitude != null);
    if (
      filters.distance !== "any" &&
      userPosition &&
      typeof filters.distance === "number"
    ) {
      const [uLat, uLng] = userPosition;
      list = list.filter(
        (e) =>
          calculateDistance(uLat, uLng, e.latitude!, e.longitude!) <=
          (filters.distance as number),
      );
    }
    return list;
  }, [events, filters.distance, userPosition]);

  const center = ((): [number, number] => {
    if (userPosition) return userPosition;
    if (filteredServices.length === 0) return ISTANBUL_CENTER;
    const avgLat =
      filteredServices.reduce((sum, s) => sum + s.location.latitude, 0) /
      filteredServices.length;
    const avgLng =
      filteredServices.reduce((sum, s) => sum + s.location.longitude, 0) /
      filteredServices.length;
    return [avgLat, avgLng];
  })();

  const zoom = userPosition ? USER_LOCATION_ZOOM : DEFAULT_ZOOM;

  const formatDuration = (hours: number) => `${hours}h`;
  const distanceRadiusM =
    filters.distance !== "any" && typeof filters.distance === "number"
      ? filters.distance * 1000
      : null;

  if (loading) {
    return (
      <div
        className={`overflow-hidden ${
          sticky ? "sticky top-20 z-10" : ""
        } flex items-center justify-center`}
        style={{
          borderRadius: "1em",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          height: height || "90vh",
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">
            {loading ? "Loading services..." : "Loading map..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${sticky ? "sticky top-40 z-10" : "z-0"}`}
      style={{
        borderRadius: "1em",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        height,
      }}
    >
      {showFilters && services.length > 0 && (
        <div className="absolute top-3 right-3 z-[1000] max-w-[200px]">
          <Flex direction="column" gap="2">
            <Select.Root
              value={
                filters.distance === "any" ? "any" : String(filters.distance)
              }
              onValueChange={(v) =>
                setFilters({
                  ...filters,
                  distance: v === "any" ? "any" : Number(v),
                })
              }
            >
              <Select.Trigger placeholder="Distance" />
              <Select.Content>
                <Select.Item value="any">
                  {userPosition ? "Any distance" : "Any (enable location)"}
                </Select.Item>
                {userPosition &&
                  DISTANCE_OPTIONS_KM.map((km) => (
                    <Select.Item key={km} value={String(km)}>
                      Within {km} km
                    </Select.Item>
                  ))}
              </Select.Content>
            </Select.Root>
            {filters.distance !== "any" && (
              <Button
                size="1"
                variant="solid"
                color="gray"
                onClick={() => setFilters(defaultMapFilters)}
              >
                Clear
              </Button>
            )}
          </Flex>
        </div>
      )}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "12px",
        }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
          maxNativeZoom={19}
        />
        <MapLocationHandler userPosition={userPosition} />
        {userPosition && distanceRadiusM !== null && (
          <Circle
            center={userPosition}
            radius={distanceRadiusM}
            pathOptions={{
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.06,
              weight: 1.5,
              dashArray: "4 4",
            }}
          />
        )}
        {filteredServices.map(
          (service) =>
            service.is_remote === false && (
              <React.Fragment key={service._id}>
                <Circle
                  center={[
                    service.location.latitude,
                    service.location.longitude,
                  ]}
                  radius={APPROXIMATE_LOCATION_RADIUS_M}
                  pathOptions={{
                    color:
                      service.service_type === "offer" ? "#10B981" : "#F59E0B",
                    fillColor:
                      service.service_type === "offer" ? "#10B981" : "#F59E0B",
                    fillOpacity: 0.12,
                    weight: 1.5,
                  }}
                />
                <Marker
                  position={[
                    service.location.latitude,
                    service.location.longitude,
                  ]}
                  icon={service.service_type === "offer" ? offerIcon : needIcon}
                >
                  <Popup closeButton>
                    <ServicePopupContent
                      service={service}
                      formatDuration={formatDuration}
                      onViewDetails={() => {}}
                      onClose={() => {}}
                    />
                  </Popup>
                </Marker>
              </React.Fragment>
            ),
        )}
        {/* Forum event markers */}
        {filters.showEvents &&
          filteredEvents.map((ev) => (
            <React.Fragment key={`event-${ev._id}`}>
              <Circle
                center={[ev.latitude!, ev.longitude!]}
                radius={APPROXIMATE_LOCATION_RADIUS_M}
                pathOptions={{
                  color: "#7c3aed",
                  fillColor: "#7c3aed",
                  fillOpacity: 0.12,
                  weight: 1.5,
                }}
              />
              <Marker position={[ev.latitude!, ev.longitude!]} icon={eventIcon}>
                <Popup closeButton>
                  <EventPopupContent event={ev} />
                </Popup>
              </Marker>
            </React.Fragment>
          ))}
      </MapContainer>

      {/* Legend */}
      {showFilters && (
        <Card
          className="absolute bottom-3 left-3 z-[1000] shadow-md text-gray-800"
          size="1"
        >
          <Flex direction="column" gap="2">
            <Text size="1" weight="bold">
              Legend
            </Text>
            <Flex align="center" gap="2">
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor: "#059669",
                }}
              />
              <Text size="1">Offer</Text>
            </Flex>
            <Flex align="center" gap="2">
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor: "#d97706",
                }}
              />
              <Text size="1">Need</Text>
            </Flex>
            <Flex align="center" gap="2">
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor: "#7c3aed",
                }}
              />
              <Text size="1">Event</Text>
              <Switch
                size="1"
                checked={filters.showEvents}
                onCheckedChange={(v) =>
                  setFilters({ ...filters, showEvents: v })
                }
              />
            </Flex>
          </Flex>
        </Card>
      )}
    </div>
  );
}

function ServicePopupContent({
  service,
  formatDuration,
  onViewDetails,
  onClose: _onClose,
}: {
  service: Service;
  formatDuration: (h: number) => string;
  onViewDetails: () => void;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [provider, setProvider] = useState<{ username: string; full_name?: string } | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [topBadge, setTopBadge] = useState<BadgeType | null>(null);

  useEffect(() => {
    if (!service.user_id) return;
    Promise.all([
      usersApi.getUserById(service.user_id).catch(() => null),
      usersApi.getUserBadges(service.user_id).catch(() => null),
      ratingsApi.getUserRatings(service.user_id, 1, 1).catch(() => null),
    ]).then(([userRes, badgesRes, ratingsRes]) => {
      if (userRes) {
        setProvider({ username: userRes.data.username, full_name: userRes.data.full_name });
      }
      if (badgesRes) {
        setTopBadge(getHighestPriorityBadge(badgesRes.data.badges));
      }
      if (ratingsRes) {
        setAverageRating(ratingsRes.data.average_score ?? null);
      }
    });
  }, [service.user_id]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const displayDate = service.specific_date
    ? formatDate(service.specific_date)
    : formatDate(service.created_at);
  const dateLabel = service.specific_date ? "Date" : "Posted";

  return (
    <div className="text-xs space-y-2 min-w-[280px] max-w-[320px]">

      {/* Top row: [Offer/Need] [duration] — flex-1 boşluk — [Name badge] [★rating] [badge icon] */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* Sol: tip + süre */}
        <Badge
          color={service.service_type === "offer" ? "green" : "red"}
          variant="soft"
          size="1"
        >
          {service.service_type === "offer" ? "Offer" : "Need"}
        </Badge>
        <Badge color="gray" variant="soft" size="1">
          {formatDuration(service.estimated_duration)}
        </Badge>

        {/* Ortadaki boşluğu yiyen spacer */}
        <div className="flex-1" />

        {/* Sağ: kullanıcı adı (badge), rating, badge ikonu */}
        {provider && (
          <>
            <Badge
              color="blue"
              variant="soft"
              size="1"
              className="cursor-pointer"
              onClick={() => navigate(`/profile/${service.user_id}`)}
            >
              {provider.full_name || provider.username}
            </Badge>
            {averageRating !== null && (
              <span className="text-yellow-500 font-medium">
                ★{averageRating.toFixed(1)}
              </span>
            )}
            {topBadge && <CustomBadge badge={topBadge} size={14} />}
          </>
        )}
      </div>

      {/* Servis adı */}
      <h3 className="font-semibold text-sm line-clamp-2">{service.title}</h3>

      {/* Tag'lar */}
      {service.tags && service.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {service.tags.slice(0, 4).map((tag) => {
            const label = typeof tag === "string" ? tag : (tag as TagEntity).label;
            return (
              <Badge key={label} color="indigo" variant="soft" size="1">
                {label}
              </Badge>
            );
          })}
          {service.tags.length > 4 && (
            <Badge color="gray" variant="soft" size="1">
              +{service.tags.length - 4}
            </Badge>
          )}
        </div>
      )}

      {/* Tarih */}
      {displayDate && (
        <div className="flex items-center gap-1 text-gray-500">
          <span className="font-medium">{dateLabel}:</span>
          <span>{displayDate}</span>
        </div>
      )}

      {/* View Details */}
      <div className="flex items-center gap-2 w-full pt-1">
        <Button
          variant="soft"
          className="flex-1"
          onClick={() => {
            onViewDetails();
            navigate(`/service/${service._id}`);
          }}
        >
          View Details
        </Button>
      </div>
    </div>
  );
}

function EventPopupContent({ event }: { event: ForumEvent }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-xs text-xs space-y-2 min-w-[260px]">
      <div className="flex flex-wrap gap-1 mb-2 items-center">
        <Badge color="purple" variant="soft" size="1">
          Event
        </Badge>
        <Badge color="gray" variant="soft" size="1">
          {new Date(event.event_at).toLocaleDateString("en-GB", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Badge>
      </div>
      <h3 className="font-semibold text-sm mb-1 line-clamp-2">{event.title}</h3>
      <p className="text-xs line-clamp-3">{event.description}</p>
      {event.service && (
        <Badge color="green" variant="soft" size="1">
          Linked: {event.service.title}
        </Badge>
      )}
    </div>
  );
}
