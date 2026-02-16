import { Map, Marker, InfoWindow } from "@vis.gl/react-google-maps";
import { useState } from "react";
import { Service } from "@/types";
import { Badge, Button } from "@radix-ui/themes";
import { useNavigate } from "react-router-dom";

interface ServiceMapProps {
  services: Service[];
  loading?: boolean;
  height?: string;
  sticky?: boolean;
}

export function ServiceMap({
  services,
  loading = false,
  height = "90vh",
  sticky = true,
}: ServiceMapProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Calculate center based on services or use Istanbul as default
  const getMapCenter = () => {
    if (services.length === 0) {
      return { lat: 41.0082, lng: 28.9784 }; // Istanbul center
    }

    const avgLat =
      services.reduce((sum, service) => sum + service.location.latitude, 0) /
      services.length;
    const avgLng =
      services.reduce((sum, service) => sum + service.location.longitude, 0) /
      services.length;
    return { lat: avgLat, lng: avgLng };
  };

  const getMarkerIcon = (serviceType: "offer" | "need") => {
    // Check if Google Maps is available
    if (
      typeof google === "undefined" ||
      !google.maps ||
      !google.maps.Size ||
      !google.maps.Point
    ) {
      return undefined; // Use default marker
    }

    return {
      url:
        serviceType === "offer"
          ? "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#10B981" stroke="#ffffff" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">+</text>
          </svg>
        `)
          : "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#EF4444" stroke="#ffffff" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">?</text>
          </svg>
        `),
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 16),
    };
  };

  const formatDuration = (hours: number) => {
    return `${hours}h`;
  };

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
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
        height: height,
      }}
    >
      <Map
        defaultCenter={getMapCenter()}
        defaultZoom={10}
        gestureHandling="greedy"
        disableDefaultUI
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "12px",
        }}
      >
        {services.map((service) => (
          <Marker
            key={service._id}
            position={{
              lat: service.location.latitude,
              lng: service.location.longitude,
            }}
            title={service.title}
            icon={getMarkerIcon(service.service_type)}
            onClick={() => {
              setSelectedService(service);
            }}
          />
        ))}

        {selectedService && (
          <ServiceInfoWindow
            selectedService={selectedService}
            setSelectedService={setSelectedService}
            formatDuration={formatDuration}
          />
        )}
      </Map>
    </div>
  );
}

const ServiceInfoWindow = ({
  selectedService,
  setSelectedService,
  formatDuration,
}: {
  selectedService: Service;
  setSelectedService: (service: Service | null) => void;
  formatDuration: (hours: number) => string;
}) => {
  const navigate = useNavigate();

  return (
    <InfoWindow
      position={{
        lat: selectedService.location.latitude,
        lng: selectedService.location.longitude,
      }}
      onCloseClick={() => setSelectedService(null)}
      headerDisabled={true}
    >
      <div className="p-2 max-w-xs text-xs space-y-2">
        <div className="flex flex-wrap gap-1 mb-2 items-center">
          <Badge
            color={selectedService.service_type === "offer" ? "green" : "red"}
            variant="soft"
            size="1"
          >
            {selectedService.service_type === "offer" ? "Offer" : "Need"}
          </Badge>

          <Badge color="gray" variant="soft" size="1">
            {formatDuration(selectedService.estimated_duration)}
          </Badge>
          <Badge color="gray" variant="soft" size="1">
            {selectedService.category}
          </Badge>
          {selectedService.location.address && (
            <Badge color="gray" variant="soft" size="1">
              📍 {selectedService.location.address}
            </Badge>
          )}
        </div>
        <h3 className="font-semibold text-sm mb-1 line-clamp-2">
          {selectedService.title}
        </h3>
        <p className="text-xs line-clamp-3">{selectedService.description}</p>

        <div className="flex items-center gap-2 w-full">
          <Button
            variant="soft"
            className="w-11/12"
            onClick={() => {
              setSelectedService(null);
              navigate(`/service/${selectedService._id}`);
            }}
          >
            View Details
          </Button>
          <Button
            variant="soft"
            color="gray"
            size="1"
            className="w-1/12"
            onClick={() => setSelectedService(null)}
          >
            ✕
          </Button>
        </div>
      </div>
    </InfoWindow>
  );
};
