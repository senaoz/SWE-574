import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import { Service } from "@/types";
import { Badge, Button } from "@radix-ui/themes";
import { useNavigate } from "react-router-dom";

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
}: {
  services: Service[];
  loading?: boolean;
  height?: string;
  sticky?: boolean;
}) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(
    null,
  );

  // Get user location via browser API (used for centering map only)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  const center = ((): [number, number] => {
    if (userPosition) return userPosition;
    if (services.length === 0) return ISTANBUL_CENTER;
    const avgLat =
      services.reduce((sum, s) => sum + s.location.latitude, 0) /
      services.length;
    const avgLng =
      services.reduce((sum, s) => sum + s.location.longitude, 0) /
      services.length;
    return [avgLat, avgLng];
  })();

  const zoom = userPosition ? USER_LOCATION_ZOOM : DEFAULT_ZOOM;

  const formatDuration = (hours: number) => `${hours}h`;

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
        {services.map((service) => (
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
