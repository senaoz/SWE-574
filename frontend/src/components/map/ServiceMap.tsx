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
import { Service, TagEntity } from "@/types";
import { Badge, Button, Card, Flex, Select } from "@radix-ui/themes";
import { useNavigate } from "react-router-dom";

/** Distance in km between two lat/lng points (Haversine) */
function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const ISTANBUL_CENTER: [number, number] = [41.0082, 28.9784];
const DEFAULT_ZOOM = 10;
const USER_LOCATION_ZOOM = 12;
/** Radius (m) for the small area circle showing approximate service location (no exact address) */
const APPROXIMATE_LOCATION_RADIUS_M = 200;

/** Small center dot so marker reads as part of the area circle, not a separate pin */
const MARKER_SIZE = 20;
const MARKER_ANCHOR = MARKER_SIZE / 2;

const createIcon = (color: string, label: string) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: ${MARKER_SIZE}px; height: ${MARKER_SIZE}px;
      border-radius: 50%;
      color: white;
      background-color: ${color};
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 12px;
      font-family: system-ui, -apple-system, sans-serif;
    ">${label}</div>`,
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_ANCHOR, MARKER_ANCHOR],
  });

const offerIcon = createIcon("#059669", "+");
const needIcon = createIcon("#dc2626", "?");

export const DISTANCE_OPTIONS_KM = [5, 10, 25, 50, 100] as const;
const SERVICE_TYPE_OPTIONS = ["all", "offer", "need"] as const;
export type ServiceTypeFilter = (typeof SERVICE_TYPE_OPTIONS)[number];

export interface MapFilters {
  serviceType: ServiceTypeFilter;
  tag: string;
  distance: number | "any";
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
      const d = distanceKm(
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
  loading = false,
  height = "90vh",
  sticky = true,
  showFilters = true,
  filters: controlledFilters,
  onFiltersChange,
  userPosition: controlledUserPosition,
}: {
  services: Service[];
  loading?: boolean;
  height?: string;
  sticky?: boolean;
  /** When false, filter UI is hidden (e.g. single-service view). Default true. */
  showFilters?: boolean;
  /** When provided with onFiltersChange, filters are controlled by the parent (e.g. Dashboard). List and map both reflect these filters. */
  filters?: MapFilters;
  onFiltersChange?: (f: MapFilters) => void;
  /** Optional user position from parent (e.g. for distance filter). If not provided, map uses its own geolocation. */
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
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setInternalUserPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [controlledUserPosition]);

  // When controlled, parent passes already-filtered services; when uncontrolled, filter here
  const filteredServices = useMemo(() => {
    if (isControlled) return services;
    return applyMapFilters(services, filters, userPosition);
  }, [isControlled, services, filters, userPosition]);

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
      className={`relative overflow-hidden ${sticky ? "sticky top-20 z-10" : ""}`}
      style={{
        borderRadius: "1em",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        height,
      }}
    >
      {showFilters && services.length > 0 && (
        <Card
          className="absolute top-3 right-3 z-[1000] max-w-[200px] shadow-md"
          size="1"
        >
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
                variant="soft"
                color="gray"
                onClick={() => setFilters(defaultMapFilters)}
              >
                Clear
              </Button>
            )}
          </Flex>
        </Card>
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
        {filteredServices.map((service) => (
          <React.Fragment key={service._id}>
            <Circle
              center={[service.location.latitude, service.location.longitude]}
              radius={APPROXIMATE_LOCATION_RADIUS_M}
              pathOptions={{
                color: service.service_type === "offer" ? "#10B981" : "#EF4444",
                fillColor:
                  service.service_type === "offer" ? "#10B981" : "#EF4444",
                fillOpacity: 0.12,
                weight: 1.5,
              }}
            />
            <Marker
              position={[service.location.latitude, service.location.longitude]}
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
        ))}
      </MapContainer>
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
  return (
    <div className="max-w-xs text-xs space-y-2 min-w-[300px]">
      <div className="flex flex-wrap gap-1 mb-2 items-center">
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
        <Badge color="gray" variant="soft" size="1">
          {service.category}
        </Badge>
      </div>
      <h3 className="font-semibold text-sm mb-1 line-clamp-2">
        {service.title}
      </h3>
      <p className="text-xs line-clamp-3">{service.description}</p>
      <div className="flex items-center gap-2 w-full">
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
