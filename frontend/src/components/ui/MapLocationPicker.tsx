import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { Button, TextField, Flex, Text, Box } from "@radix-ui/themes";
import { Crosshair1Icon } from "@radix-ui/react-icons";

const DEFAULT_CENTER: [number, number] = [41.0082, 28.9784];
const DEFAULT_ZOOM = 10;
const NOMINATIM_UA = "hive-frontend";

export interface MapLocationValue {
  latitude: number;
  longitude: number;
  address?: string;
}

interface MapLocationPickerProps {
  value: MapLocationValue;
  onChange: (location: MapLocationValue) => void;
  /** Map height in pixels */
  height?: number;
  /** Marker/circle color (e.g. #059669, #7c3aed) */
  markerColor?: string;
  /** Show address search + "Find" and "Use my location" */
  showAddressSearch?: boolean;
  error?: string;
  /** Label for "use my location" (e.g. "Get Location") */
  getLocationLabel?: string;
  disabled?: boolean;
}

function reverseGeocode(lat: number, lng: number): Promise<string> {
  return fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
    { headers: { "User-Agent": NOMINATIM_UA } },
  )
    .then((res) => res.json())
    .then((data) => {
      const addressParts: string[] = [];
      if (data.address) {
        if (data.address.neighbourhood || data.address.suburb) {
          addressParts.push(data.address.neighbourhood || data.address.suburb);
        }
        if (data.address.city || data.address.town || data.address.village) {
          addressParts.push(
            data.address.city || data.address.town || data.address.village,
          );
        }
        if (data.address.state || data.address.region) {
          addressParts.push(data.address.state || data.address.region);
        }
      }
      return addressParts.length > 0
        ? addressParts.join(", ")
        : data.display_name || "";
    })
    .catch(() => "");
}

function geocodeAddress(
  address: string,
): Promise<{ lat: number; lon: number } | null> {
  if (!address.trim()) return Promise.resolve(null);
  return fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address,
    )}&limit=1`,
    { headers: { "User-Agent": NOMINATIM_UA } },
  )
    .then((res) => res.json())
    .then((data) =>
      data?.length > 0
        ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
        : null,
    )
    .catch(() => null);
}

/** Inner component that attaches map click, handles fly-to, and fixes dialog sizing */
function MapClickHandler({
  value,
  onChange,
}: {
  value: MapLocationValue;
  onChange: (location: MapLocationValue) => void;
}) {
  const map = useMap();

  // Fix Leaflet tile rendering when map is inside a Dialog/Modal:
  // the container may have zero size at mount time, so we invalidateSize after a short delay.
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    const handler = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      reverseGeocode(lat, lng).then((address) => {
        onChange({
          latitude: lat,
          longitude: lng,
          address: address || undefined,
        });
      });
    };
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [map, onChange]);

  // When value changes (e.g. from address search or geolocation), fly to new position
  useEffect(() => {
    if (value.latitude !== 0 && value.longitude !== 0) {
      map.flyTo([value.latitude, value.longitude], 15, { duration: 0.5 });
    }
  }, [value.latitude, value.longitude, map]);

  return null;
}

const createMarkerIcon = (color: string, label: string) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="width:20px;height:20px;border-radius:50%;color:white;background-color:${color};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;">${label}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

export function MapLocationPicker({
  value,
  onChange,
  height = 220,
  markerColor = "#059669",
  showAddressSearch = true,
  error,
  getLocationLabel = "Use my location",
  disabled = false,
}: MapLocationPickerProps) {
  const [addressInput, setAddressInput] = useState(value.address || "");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  const hasLocation = value.latitude !== 0 && value.longitude !== 0;

  // Sync address input when value.address changes from outside (e.g. map click)
  React.useEffect(() => {
    if (value.address) setAddressInput(value.address);
  }, [value.address]);

  const center: [number, number] = hasLocation
    ? [value.latitude, value.longitude]
    : DEFAULT_CENTER;
  const zoom = hasLocation ? 15 : DEFAULT_ZOOM;

  const handleLocationResult = (lat: number, lng: number) => {
    reverseGeocode(lat, lng).then((address) => {
      onChange({
        latitude: lat,
        longitude: lng,
        address: address || undefined,
      });
      setAddressInput(address || "");
      setIsGettingLocation(false);
    });
  };

  const getLocationViaIp = () => {
    fetch("https://ipapi.co/json/")
      .then((res) => {
        if (!res.ok) throw new Error("IP lookup failed");
        return res.json();
      })
      .then((data) => {
        if (data.latitude && data.longitude) {
          handleLocationResult(data.latitude, data.longitude);
        } else {
          setLocationError("Could not determine location.");
          setIsGettingLocation(false);
        }
      })
      .catch(() => {
        setLocationError("Could not determine location.");
        setIsGettingLocation(false);
      });
  };

  const handleGetCurrentLocation = () => {
    setIsGettingLocation(true);
    setLocationError("");
    if (!navigator.geolocation) {
      getLocationViaIp();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleLocationResult(
          position.coords.latitude,
          position.coords.longitude,
        );
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError(
            "Location access denied. Please enable location permissions.",
          );
          setIsGettingLocation(false);
          return;
        }
        getLocationViaIp();
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  const handleFindAddress = async () => {
    if (!addressInput.trim()) return;
    setIsGeocoding(true);
    setLocationError("");
    const result = await geocodeAddress(addressInput.trim());
    if (result) {
      const address = addressInput.trim();
      onChange({
        latitude: result.lat,
        longitude: result.lon,
        address,
      });
    } else {
      setLocationError(
        "Address not found. You can still pick a point on the map.",
      );
    }
    setIsGeocoding(false);
  };

  return (
    <div className="space-y-2">
      {showAddressSearch && (
        <Flex gap="2" align="center" wrap="wrap">
          <TextField.Root
            placeholder="e.g. Kadıköy, Istanbul or click on the map"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onBlur={() => {
              if (value.address) setAddressInput(value.address);
            }}
            className="flex-1 min-w-[200px]"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleFindAddress}
            disabled={!addressInput.trim() || isGeocoding || disabled}
            className="whitespace-nowrap"
          >
            {isGeocoding ? "Finding…" : "Find"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation || disabled}
            className="whitespace-nowrap"
          >
            <Crosshair1Icon width="16" height="16" />
            {isGettingLocation ? "Getting…" : getLocationLabel}
          </Button>
        </Flex>
      )}

      {(error || locationError) && (
        <Text size="1" color="red">
          {error || locationError}
        </Text>
      )}

      {hasLocation && (
        <Text size="1" color="green">
          ✓ Location set: {value.latitude.toFixed(4)},{" "}
          {value.longitude.toFixed(4)}
          {value.address && ` — ${value.address}`}
        </Text>
      )}

      <Box
        className="rounded-xl overflow-hidden border border-gray-6"
        style={{ height }}
      >
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={!disabled}
          className={disabled ? "pointer-events-none" : ""}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />
          <MapClickHandler
            value={value}
            onChange={(loc) => {
              onChange(loc);
              setAddressInput(loc.address || "");
            }}
          />
          {hasLocation && (
            <>
              <Circle
                center={[value.latitude, value.longitude]}
                radius={200}
                pathOptions={{
                  color: markerColor,
                  fillColor: markerColor,
                  fillOpacity: 0.12,
                  weight: 1.5,
                }}
              />
              <Marker
                position={[value.latitude, value.longitude]}
                icon={createMarkerIcon(markerColor, "•")}
              />
            </>
          )}
        </MapContainer>
      </Box>
      {!hasLocation && (
        <Text size="1" color="gray">
          Click on the map to set the location, or search by address.
        </Text>
      )}
    </div>
  );
}
