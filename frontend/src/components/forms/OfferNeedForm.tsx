import React, { useRef, useState } from "react";
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
} from "@radix-ui/themes";
import { Form } from "radix-ui";
import { servicesApi } from "@/services/api";
import { ServiceForm, ServiceFormErrors, TagEntity } from "@/types";
import { TagAutocomplete } from "./TagAutocomplete";
import { MarkdownEditor } from "./MarkdownEditor";
import { MapLocationPicker } from "@/components/ui/MapLocationPicker";
import { GlobeIcon, Crosshair1Icon } from "@radix-ui/react-icons";

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
  const formTopRef = useRef<HTMLDivElement>(null);
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
            const errorMessage = err.msg ?? err.message ?? "Validation error";

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
        setErrors(newErrors);
        // Scroll form into view so user sees the error summary and fields
        setTimeout(
          () =>
            formTopRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            }),
          100,
        );
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

      if (!Array.isArray(errorDetail)) {
        setErrors(newErrors);
        setTimeout(
          () =>
            formTopRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            }),
          100,
        );
      }
    },
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: ServiceFormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (
      !formData.is_remote &&
      formData.location.latitude === 0 &&
      formData.location.longitude === 0
    ) {
      newErrors.location =
        "Please select a location on the map or search by address";
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
          {/* Scroll target and error summary */}
          <div ref={formTopRef}>
            {Object.keys(errors).length > 2 && (
              <Box
                style={{
                  backgroundColor: "var(--red-3)",
                  borderColor: "var(--red-6)",
                }}
                className="rounded-lg border p-3"
              >
                <Text size="2" weight="medium" color="red">
                  Please fix the errors below.
                </Text>
                <ul className="mt-2 list-inside list-disc text-sm text-red-11">
                  {Object.entries(errors).map(([key, value]) => {
                    const msg =
                      typeof value === "string"
                        ? value
                        : value && typeof value === "object" && "error" in value
                          ? (value as { error: string }).error
                          : null;
                    return msg ? <li key={key}>{msg}</li> : null;
                  })}
                </ul>
              </Box>
            )}
          </div>
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

              {/* In person or remote service selection */}
              <Box
                className={`flex items-center justify-center gap-2 mb-4 border rounded-lg p-2 hover-card text-center cursor-pointer font-medium text-sm`}
                onClick={() => handleInputChange("is_remote", false)}
                style={{
                  backgroundColor: formData.is_remote ? "" : "var(--gray-1)",
                  borderColor: "var(--gray-3)",
                }}
              >
                <Crosshair1Icon className="w-4 h-4" /> In person Service
              </Box>
              <Box
                className={`flex items-center justify-center gap-2 mb-4 border rounded-lg p-2 hover-card text-center cursor-pointer font-medium text-sm`}
                onClick={() => handleInputChange("is_remote", true)}
                style={{
                  backgroundColor: formData.is_remote ? "var(--gray-1)" : "",
                  borderColor: "var(--gray-3)",
                }}
              >
                <GlobeIcon className="w-4 h-4" />
                Remote / Online Service
              </Box>
            </Grid>
            {/* Location Section */}
            {!formData?.is_remote && (
              <Box className="mb-4">
                <Text size="2" weight="medium" className="mb-2 block">
                  Location *
                </Text>
                <MapLocationPicker
                  value={formData.location}
                  onChange={(loc) => handleInputChange("location", loc)}
                  markerColor={serviceType === "offer" ? "#059669" : "#dc2626"}
                  error={errors.location}
                  height={220}
                />
              </Box>
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
