import React, { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Button,
  TextField,
  TextArea,
  Select,
  Flex,
  Text,
  Grid,
  Box,
  Switch,
  Dialog,
  Heading,
} from "@radix-ui/themes";
import { Form } from "radix-ui";
import { servicesApi } from "@/services/api";
import { ServiceForm, ServiceFormErrors, TagEntity } from "@/types";
import { Crosshair1Icon } from "@radix-ui/react-icons";
import { TURKISH_CITIES, getCityOptions } from "@/constants/turkishCities";
import { TagAutocomplete } from "./TagAutocomplete";
import { MarkdownEditor } from "./MarkdownEditor";
import { MapContainer, TileLayer, Circle, Marker } from "react-leaflet";
import L from "leaflet";

interface OfferNeedFormProps {
  serviceType: "offer" | "need";
  onSuccess?: () => void;
  onClose?: () => void;
}

export function OfferNeedForm({
  serviceType,
  onSuccess,
  onClose,
}: OfferNeedFormProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState<ServiceForm>({
    title: "",
    description: "",
    category: "",
    tags: [],
    estimated_duration: 1,
    location: { latitude: 0, longitude: 0, address: "" },
    city: "",
    service_type: serviceType,
    scheduling_type: "specific",
    max_participants: 1,
    is_remote: false,
  });
  const [errors, setErrors] = useState<ServiceFormErrors>({});
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const createServiceMutation = useMutation({
    mutationFn: servicesApi.createService,
    onSuccess: () => {
      setShowConfirmation(true);
      // Don't call onSuccess here - wait until user closes confirmation modal
    },
    onError: (error: any) => {
      console.error("Error creating service:", error);

      // Parse FastAPI validation errors
      const errorDetail = error.response?.data?.detail;
      const newErrors: ServiceFormErrors = {};

      if (Array.isArray(errorDetail)) {
        // FastAPI validation errors come as an array of objects
        errorDetail.forEach((err: any) => {
          if (err.loc && Array.isArray(err.loc)) {
            // Get the field name from location (e.g., ["body", "title"] -> "title")
            const fieldName = err.loc[
              err.loc.length - 1
            ] as keyof ServiceFormErrors;
            const errorMessage = err.msg || "Validation error";

            // Handle special cases for nested fields
            if (fieldName === "recurring_pattern") {
              newErrors.recurring_pattern = {
                days: [],
                time: "",
                error: errorMessage,
              };
            } else {
              (newErrors as any)[fieldName] = errorMessage;
            }
          }
        });
      } else if (typeof errorDetail === "string") {
        // Simple string error message
        newErrors.title = errorDetail;
      } else if (errorDetail) {
        // Try to extract message from error object
        newErrors.title =
          errorDetail.msg || errorDetail.message || "Failed to create service";
      } else {
        newErrors.title = "Failed to create service";
      }

      // If no specific field errors, set a general error
      if (Object.keys(newErrors).length === 0) {
        newErrors.title = "Failed to create service. Please check your input.";
      }

      setErrors(newErrors);
    },
  });

  useEffect(() => {
    if (formData.location.latitude && formData.location.longitude) {
      const closestCity = findClosestTurkishCity(
        formData.location.latitude,
        formData.location.longitude,
      );
      handleInputChange("city", (closestCity as any).key || "");
    }
  }, [formData.location.latitude, formData.location.longitude]);

  const handleInputChange = (field: keyof ServiceForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof ServiceFormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field as keyof ServiceFormErrors]: undefined,
      }));
    }
  };

  const handleTagAdd = (tag: TagEntity) => {
    // Check if tag already exists
    const tagExists = formData.tags.some(
      (t) =>
        t.entityId === tag.entityId ||
        t.label.toLowerCase() === tag.label.toLowerCase(),
    );

    if (!tagExists && formData.tags.length < 10) {
      handleInputChange("tags", [...formData.tags, tag]);
    }
  };

  const handleTagRemove = (tagToRemove: TagEntity) => {
    handleInputChange(
      "tags",
      formData.tags.filter(
        (tag) =>
          tag.entityId !== tagToRemove.entityId &&
          tag.label !== tagToRemove.label,
      ),
    );
  };

  const findClosestTurkishCity = (latitude: number, longitude: number) => {
    let closestCity: {
      key: string;
      latitude: number;
      longitude: number;
      address: string;
    } | null = null;
    let minDistance = Infinity;

    Object.entries(TURKISH_CITIES).forEach(([key, cityData]) => {
      const distance = Math.sqrt(
        Math.pow(cityData.latitude - latitude, 2) +
          Math.pow(cityData.longitude - longitude, 2),
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestCity = { key, ...cityData };
      }
    });

    return closestCity;
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({
        ...prev,
        location: "Geolocation is not supported by this browser",
      }));
      return;
    }

    setIsGettingLocation(true);
    setErrors((prev) => ({ ...prev, location: undefined }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocoding to get address using OpenStreetMap Nominatim
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
          {
            headers: {
              "User-Agent": "hive-frontend",
            },
          },
        )
          .then((response) => response.json())
          .then((data) => {
            console.log(data);
            // Build address from Nominatim response
            const addressParts: string[] = [];
            if (data.address) {
              if (data.address.neighbourhood || data.address.suburb) {
                addressParts.push(
                  data.address.neighbourhood || data.address.suburb,
                );
              }
              if (
                data.address.city ||
                data.address.town ||
                data.address.village
              ) {
                addressParts.push(
                  data.address.city ||
                    data.address.town ||
                    data.address.village,
                );
              }
              if (data.address.state || data.address.region) {
                addressParts.push(data.address.state || data.address.region);
              }
            }
            const address =
              addressParts.length > 0
                ? addressParts.join(", ")
                : data.display_name || "Current Location";

            // Find the closest Turkish city based on coordinates
            const closestCity = findClosestTurkishCity(latitude, longitude);

            handleInputChange("location", {
              latitude,
              longitude,
              address: address || "Current Location",
            });

            // Set the city based on geolocation
            if (closestCity) {
              handleInputChange("city", (closestCity as any).key);
            }

            setIsGettingLocation(false);
          })
          .catch((error) => {
            console.error("Error getting address:", error);
            handleInputChange("location", {
              latitude,
              longitude,
              address: "Current Location",
            });
            setIsGettingLocation(false);
          });
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMessage = "Unable to get your location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }

        setErrors((prev) => ({
          ...prev,
          location: errorMessage,
        }));
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    );
  };

  const handleManualAddressChange = (address: string) => {
    handleInputChange("location", {
      ...formData.location,
      address: address,
    });
  };

  const geocodeAddress = async (address: string) => {
    if (!address.trim()) return;

    try {
      // Using OpenStreetMap Nominatim API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address,
        )}&limit=1`,
        {
          headers: {
            "User-Agent": "hive-frontend",
          },
        },
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        handleInputChange("location", {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          address: address,
        });
      } else {
        // No results found, still allow address to be set
        handleInputChange("location", {
          latitude: 0,
          longitude: 0,
          address: address,
        });
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
      // Still allow the address to be set even if geocoding fails
      handleInputChange("location", {
        latitude: 0,
        longitude: 0,
        address: address,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: ServiceFormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.category.trim()) {
      newErrors.category = "Category is required";
    }

    if (!formData.is_remote && !useCurrentLocation && !formData.city?.trim()) {
      newErrors.city = "City is required";
    }

    if (
      !formData.is_remote &&
      formData.location.latitude === 0 &&
      formData.location.longitude === 0 &&
      !formData.location.address?.trim()
    ) {
      newErrors.location =
        "Please provide your location or get your current location";
    }

    if (formData.tags.length === 0) {
      newErrors.tags = "At least one tag is required";
    }

    if (formData.estimated_duration <= 0) {
      newErrors.estimated_duration = "Duration must be greater than 0 hours";
    }

    if (formData.max_participants < 1) {
      newErrors.max_participants = "Must allow at least 1 participant";
    }

    // Validate scheduling based on type
    if (formData.scheduling_type === "specific") {
      if (!formData.specific_date) {
        newErrors.specific_date = "Date is required for specific scheduling";
      }
      if (!formData.specific_time) {
        newErrors.specific_time = "Time is required for specific scheduling";
      }
    } else if (formData.scheduling_type === "recurring") {
      if (!formData.recurring_pattern?.days.length) {
        newErrors.recurring_pattern = {
          days: [],
          time: "",
          error: "At least one day is required for recurring scheduling",
        };
      }
      if (!formData.recurring_pattern?.time) {
        newErrors.recurring_pattern = {
          days: formData.recurring_pattern?.days || [],
          time: "",
          error: "Time is required for recurring scheduling",
        };
      }
    } else if (formData.scheduling_type === "open") {
      if (!formData.open_availability?.trim()) {
        newErrors.open_availability = "Availability description is required";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createServiceMutation.mutate(formData);
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    // Call onSuccess after closing confirmation modal
    if (onSuccess) onSuccess();
    if (onClose) onClose();
  };

  const handleDialogOpenChange = (open: boolean) => {
    // Only close when explicitly set to false via button click
    // Prevent auto-closing from outside clicks or ESC key
    if (open) {
      setShowConfirmation(true);
    }
    // Don't allow closing via onOpenChange - only via button
  };

  const categories = [
    "Technology",
    "Education",
    "Health & Wellness",
    "Home & Garden",
    "Transportation",
    "Entertainment",
    "Business",
    "Creative Arts",
    "Sports & Fitness",
    "Food & Cooking",
    "Other",
  ];

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <>
      <>
        <Form.Root onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <Box>
            <Grid columns="2" gap="3">
              <Form.Field name="title" className="space-y-2 col-span-2">
                <Form.Label className="text-sm font-medium">Title *</Form.Label>
                <Form.Control asChild>
                  <TextField.Root
                    placeholder="e.g. Home cooking class, Garden landscaping help"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className={errors.title ? "border-red-500" : ""}
                  />
                </Form.Control>
                {errors.title && (
                  <Text color="red" size="1">
                    {errors.title}
                  </Text>
                )}
              </Form.Field>

              <Form.Field
                name="category"
                className="space-y-2 flex flex-col col-span-2"
              >
                <Form.Label className="text-sm font-medium">
                  Category *
                </Form.Label>
                <Select.Root
                  value={formData.category}
                  onValueChange={(value) =>
                    handleInputChange("category", value)
                  }
                >
                  <Select.Trigger
                    className={errors.category ? "border-red-500" : ""}
                  />
                  <Select.Content>
                    {categories.map((category) => (
                      <Select.Item key={category} value={category}>
                        {category}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                {errors.category && (
                  <Text color="red" size="1">
                    {errors.category}
                  </Text>
                )}
              </Form.Field>

              {/* Tags */}
              <Form.Field name="tags" className="space-y-1 col-span-2">
                <Form.Label className="text-sm font-medium">Tags *</Form.Label>
                <TagAutocomplete
                  tags={formData.tags}
                  onTagAdd={handleTagAdd}
                  onTagRemove={handleTagRemove}
                  error={errors.tags}
                  placeholder="e.g. cooking, gardening, programming, language, math..."
                  maxTags={10}
                />
              </Form.Field>

              <Form.Field
                name="description"
                className="space-y-1 mb-4 col-span-2"
              >
                <Form.Label className="text-sm font-medium">
                  Description *
                </Form.Label>
                <MarkdownEditor
                  placeholder="e.g. I can teach 2 hours of Italian cooking at home per week. Ingredients from you. You can use **bold** and *italic*."
                  value={formData.description}
                  onChange={(value) => handleInputChange("description", value)}
                  error={!!errors.description}
                  rows={6}
                />
                {errors.description && (
                  <Text color="red" size="1">
                    {errors.description}
                  </Text>
                )}
              </Form.Field>
            </Grid>

            {/* Remote option */}
            <Box className="mb-4">
              <Flex gap="2" align="center" className="mb-3">
                <Switch
                  checked={formData.is_remote ?? false}
                  onCheckedChange={(checked) =>
                    handleInputChange("is_remote", checked)
                  }
                />
                <Text size="2" className="font-medium">
                  Remote / Online Service
                </Text>
              </Flex>
            </Box>

            {/* Location Section */}
            {!formData?.is_remote && (
              <>
                <Box className="mb-4">
                  {/* Toggle between current location and manual address */}
                  <div className="mb-3 flex items-center align-center gap-2">
                    <Text size="2">Location</Text>
                    <Switch
                      checked={useCurrentLocation}
                      onCheckedChange={setUseCurrentLocation}
                    />
                    <Text size="2">
                      {useCurrentLocation
                        ? "Use current location"
                        : "Enter address manually"}
                    </Text>
                  </div>

                  <Form.Field name="location" className="space-y-2 mb-4">
                    {useCurrentLocation ? (
                      <Flex gap="2" align="center">
                        <TextField.Root
                          placeholder="e.g. Kadıköy, Istanbul or click Get Location"
                          value={formData.location.address || ""}
                          readOnly
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={getCurrentLocation}
                          disabled={isGettingLocation}
                          className="whitespace-nowrap"
                        >
                          <Crosshair1Icon width="16" height="16" />
                          {isGettingLocation ? "Getting..." : "Get Location"}
                        </Button>
                      </Flex>
                    ) : (
                      <Flex gap="2" align="center">
                        <TextField.Root
                          placeholder="e.g. 123 Main St, Kadıköy, Istanbul"
                          value={formData.location.address || ""}
                          onChange={(e) =>
                            handleManualAddressChange(e.target.value)
                          }
                          onBlur={(e) => {
                            if (e.target.value.trim()) {
                              geocodeAddress(e.target.value.trim());
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            geocodeAddress(formData.location.address || "")
                          }
                          disabled={!formData.location.address?.trim()}
                          className="whitespace-nowrap"
                        >
                          Find Location
                        </Button>
                      </Flex>
                    )}

                    {errors.location && (
                      <Text color="red" size="1">
                        {errors.location}
                      </Text>
                    )}

                    {formData.location.latitude !== 0 &&
                      formData.location.longitude !== 0 && (
                        <Text color="green" size="1">
                          ✓ Location set:{" "}
                          {formData.location.latitude.toFixed(4)},{" "}
                          {formData.location.longitude.toFixed(4)}
                        </Text>
                      )}

                    {formData.location.address &&
                      formData.location.latitude === 0 &&
                      formData.location.longitude === 0 && (
                        <Text color="orange" size="1">
                          ⚠ Address set but coordinates not found. Location will
                          be approximate.
                        </Text>
                      )}

                    {formData.location.latitude !== 0 &&
                      formData.location.longitude !== 0 && (
                        <Box
                          className="mt-3 rounded-xl overflow-hidden"
                          style={{ height: 180 }}
                        >
                          <MapContainer
                            center={[
                              formData.location.latitude,
                              formData.location.longitude,
                            ]}
                            zoom={15}
                            style={{ height: "100%", width: "100%" }}
                            scrollWheelZoom={false}
                          >
                            <TileLayer
                              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                              subdomains="abcd"
                            />
                            <Circle
                              center={[
                                formData.location.latitude,
                                formData.location.longitude,
                              ]}
                              radius={200}
                              pathOptions={{
                                color:
                                  serviceType === "offer"
                                    ? "#059669"
                                    : "#dc2626",
                                fillColor:
                                  serviceType === "offer"
                                    ? "#059669"
                                    : "#dc2626",
                                fillOpacity: 0.12,
                                weight: 1.5,
                              }}
                            />
                            <Marker
                              position={[
                                formData.location.latitude,
                                formData.location.longitude,
                              ]}
                              icon={L.divIcon({
                                className: "custom-marker",
                                html: `<div style="width:20px;height:20px;border-radius:50%;color:white;background-color:${
                                  serviceType === "offer"
                                    ? "#059669"
                                    : "#dc2626"
                                };display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;">${
                                  serviceType === "offer" ? "+" : "?"
                                }</div>`,
                                iconSize: [20, 20],
                                iconAnchor: [10, 10],
                              })}
                            />
                          </MapContainer>
                        </Box>
                      )}
                  </Form.Field>
                </Box>

                <Form.Field
                  name="city"
                  className="space-y-2 flex flex-col mb-2"
                >
                  <Form.Label className="text-sm">
                    City *{" "}
                    {useCurrentLocation && "(Auto-detected from location)"}
                  </Form.Label>
                  <Select.Root
                    value={formData.city}
                    onValueChange={(value) => {
                      if (!useCurrentLocation) {
                        handleInputChange("city", value);
                        const cityData =
                          TURKISH_CITIES[value as keyof typeof TURKISH_CITIES];
                        if (cityData) {
                          handleInputChange("location", {
                            latitude: cityData.latitude,
                            longitude: cityData.longitude,
                            address: cityData.address,
                          });
                        }
                      }
                    }}
                    disabled={useCurrentLocation}
                  >
                    <Select.Trigger
                      className={errors.city ? "border-red-500" : ""}
                      disabled={useCurrentLocation}
                    />
                    <Select.Content>
                      {getCityOptions().map((city) => (
                        <Select.Item key={city.value} value={city.value}>
                          {city.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                  {errors.city && (
                    <Text color="red" size="1">
                      {errors.city}
                    </Text>
                  )}
                  {useCurrentLocation && formData.city && (
                    <Text color="green" size="1">
                      ✓ City auto-detected:{" "}
                      {
                        TURKISH_CITIES[
                          formData.city as keyof typeof TURKISH_CITIES
                        ]?.address
                      }
                    </Text>
                  )}
                </Form.Field>
              </>
            )}
          </Box>

          {/* Scheduling */}
          <Box>
            <Form.Field
              name="scheduling_type"
              className="mb-4 flex flex-col space-y-2"
            >
              <Form.Label className="text-sm font-medium">
                Scheduling Type *
              </Form.Label>
              <Select.Root
                value={formData.scheduling_type}
                onValueChange={(value: "specific" | "recurring" | "open") =>
                  handleInputChange("scheduling_type", value)
                }
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="specific">
                    Specific Date & Time
                  </Select.Item>
                  <Select.Item value="recurring">Recurring Pattern</Select.Item>
                  <Select.Item value="open">Open Availability</Select.Item>
                </Select.Content>
              </Select.Root>
            </Form.Field>

            {/* Specific Date & Time */}
            {formData.scheduling_type === "specific" && (
              <Grid columns="2" gap="4" className="mb-4">
                <Form.Field name="specific_date" className="space-y-2">
                  <Form.Label className="text-sm font-medium">
                    Date *
                  </Form.Label>
                  <Form.Control asChild>
                    <TextField.Root
                      type="date"
                      value={formData.specific_date || ""}
                      onChange={(e) =>
                        handleInputChange("specific_date", e.target.value)
                      }
                      className={errors.specific_date ? "border-red-500" : ""}
                    />
                  </Form.Control>
                  {errors.specific_date && (
                    <Text color="red" size="1">
                      {errors.specific_date}
                    </Text>
                  )}
                </Form.Field>

                <Form.Field name="specific_time" className="space-y-2">
                  <Form.Label className="text-sm font-medium">
                    Time *
                  </Form.Label>
                  <Form.Control asChild>
                    <TextField.Root
                      type="time"
                      value={formData.specific_time || ""}
                      onChange={(e) =>
                        handleInputChange("specific_time", e.target.value)
                      }
                      className={errors.specific_time ? "border-red-500" : ""}
                    />
                  </Form.Control>
                  {errors.specific_time && (
                    <Text color="red" size="1">
                      {errors.specific_time}
                    </Text>
                  )}
                </Form.Field>
              </Grid>
            )}

            {/* Recurring Pattern */}
            {formData.scheduling_type === "recurring" && (
              <Box className="mb-4">
                <Form.Field name="recurring_days" className="space-y-1 mb-4">
                  <Form.Label className="text-sm font-medium">
                    Days of Week *
                  </Form.Label>
                  <Grid columns="4" gap="2">
                    {daysOfWeek.map((day) => (
                      <Flex key={day} align="center" gap="2">
                        <Switch
                          checked={
                            formData.recurring_pattern?.days.includes(day) ||
                            false
                          }
                          onCheckedChange={(checked) => {
                            const currentDays =
                              formData.recurring_pattern?.days || [];
                            const newDays = checked
                              ? [...currentDays, day]
                              : currentDays.filter((d) => d !== day);
                            handleInputChange("recurring_pattern", {
                              ...formData.recurring_pattern,
                              days: newDays,
                              time: formData.recurring_pattern?.time || "",
                            });
                          }}
                        />
                        <Text size="2">{day}</Text>
                      </Flex>
                    ))}
                  </Grid>
                  {errors.recurring_pattern && (
                    <Text color="red" size="1">
                      {typeof errors.recurring_pattern === "string"
                        ? errors.recurring_pattern
                        : errors.recurring_pattern?.error}
                    </Text>
                  )}
                </Form.Field>

                <Form.Field name="recurring_time" className="space-y-2">
                  <Form.Label className="text-sm font-medium">
                    Time *
                  </Form.Label>
                  <Form.Control asChild>
                    <TextField.Root
                      type="time"
                      value={formData.recurring_pattern?.time || ""}
                      onChange={(e) =>
                        handleInputChange("recurring_pattern", {
                          ...formData.recurring_pattern,
                          time: e.target.value,
                          days: formData.recurring_pattern?.days || [],
                        })
                      }
                      className={
                        errors.recurring_pattern ? "border-red-500" : ""
                      }
                    />
                  </Form.Control>
                </Form.Field>
              </Box>
            )}

            {/* Open Availability */}
            {formData.scheduling_type === "open" && (
              <Form.Field name="open_availability" className="space-y-1 mb-4">
                <Form.Label className="text-sm font-medium">
                  Availability Description *
                </Form.Label>
                <Form.Control asChild>
                  <TextArea
                    placeholder="e.g. Weekday evenings after 6 PM, weekends anytime"
                    value={formData.open_availability || ""}
                    onChange={(e) =>
                      handleInputChange("open_availability", e.target.value)
                    }
                    className={errors.open_availability ? "border-red-500" : ""}
                    rows={3}
                  />
                </Form.Control>
                {errors.open_availability && (
                  <Text color="red" size="1">
                    {errors.open_availability}
                  </Text>
                )}
              </Form.Field>
            )}
          </Box>

          {/* Duration and Participants */}
          <Box>
            <Grid columns="2" gap="4" className="mb-4">
              <Form.Field name="estimated_duration" className="space-y-2">
                <Form.Label className="text-sm font-medium">
                  Duration (hours) *
                </Form.Label>
                <Form.Control asChild>
                  <TextField.Root
                    type="number"
                    min="1"
                    placeholder="e.g. 2"
                    value={formData.estimated_duration}
                    onChange={(e) =>
                      handleInputChange(
                        "estimated_duration",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    className={
                      errors.estimated_duration ? "border-red-500" : ""
                    }
                  />
                </Form.Control>
                {errors.estimated_duration && (
                  <Text color="red" size="1">
                    {errors.estimated_duration}
                  </Text>
                )}
              </Form.Field>

              <Form.Field name="max_participants" className="space-y-2">
                <Form.Label className="text-sm font-medium">
                  Max Participants *
                </Form.Label>
                <Form.Control asChild>
                  <TextField.Root
                    type="number"
                    min="1"
                    placeholder="e.g. 5"
                    value={formData.max_participants}
                    onChange={(e) =>
                      handleInputChange(
                        "max_participants",
                        parseInt(e.target.value) || 1,
                      )
                    }
                    className={errors.max_participants ? "border-red-500" : ""}
                  />
                </Form.Control>
                {errors.max_participants && (
                  <Text color="red" size="1">
                    {errors.max_participants}
                  </Text>
                )}
              </Form.Field>
            </Grid>
          </Box>

          {/* Submit Button */}
          <Flex justify="end" gap="3" className="pt-4">
            <Button type="button" variant="soft" onClick={onClose}>
              Cancel
            </Button>
            <Form.Submit asChild>
              <Button type="submit" disabled={createServiceMutation.isPending}>
                {createServiceMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </Form.Submit>
          </Flex>
        </Form.Root>
      </>

      {/* Confirmation Modal */}
      <Dialog.Root
        open={showConfirmation}
        onOpenChange={handleDialogOpenChange}
      >
        <Dialog.Content
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <Dialog.Title>
            {serviceType === "offer"
              ? "Service Offer Created!"
              : "Service Need Created!"}
          </Dialog.Title>
          <Dialog.Description>
            Your {serviceType} has been successfully created and is now visible
            to the community.
          </Dialog.Description>
          <Flex
            direction="column"
            align="center"
            gap="4"
            className="text-center mt-4"
          >
            <Box className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Text size="6" color="green">
                ✓
              </Text>
            </Box>
            <Button onClick={handleConfirmationClose} className="w-full">
              Continue to Dashboard
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
