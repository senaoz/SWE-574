import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import { Service } from "@/types";
import { Badge, Button } from "@radix-ui/themes";
import { useNavigate } from "react-router-dom";

const ISTANBUL_CENTER: [number, number] = [41.0082, 28.9784];
const DEFAULT_ZOOM = 10;
const USER_LOCATION_ZOOM = 12;

// Fix default marker icons in Leaflet with Vite/React
const createIcon = (color: string, label: string) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 32px; height: 32px;
      border-radius: 50%;
      background: ${color};
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: bold; font-size: 14px;
    ">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

const offerIcon = createIcon("#10B981", "+");
const needIcon = createIcon("#EF4444", "?");

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

  // Get user location via browser API and zoom map to it
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
      className={`overflow-hidden ${sticky ? "sticky top-20 z-10" : ""}`}
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapLocationHandler userPosition={userPosition} />
        {services.map((service) => (
          <Marker
            key={service._id}
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
        ))}
      </MapContainer>
    </div>
  );
}

function ServicePopupContent({
  service,
  formatDuration,
  onViewDetails,
  onClose,
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
