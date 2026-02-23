import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, Badge, Text, Flex, Button, Tooltip } from "@radix-ui/themes";
import { Service, User, JoinRequest } from "@/types";
import {
  chatApi,
  servicesApi,
  usersApi,
  joinRequestsApi,
} from "@/services/api";
import { useUser } from "@/App";
import {
  ClockIcon,
  CalendarIcon,
  CheckCircledIcon,
  ChatBubbleIcon,
  HeartIcon,
  Share1Icon,
  ArrowLeftIcon,
  Crosshair1Icon,
  PersonIcon,
} from "@radix-ui/react-icons";
import { ProviderProfileSummary } from "@/components/ui/ProviderProfileSummary";
import { ServiceMap } from "@/components/map/ServiceMap";
import { HandShakeModal } from "@/components/ui/HandShakeModal";
import { CommentSection } from "@/components/ui/CommentSection";
import { ParticipantAvatars } from "@/components/ui/ParticipantAvatars";
import { StatusBadge } from "@/components/ui/StatusBadge";
import ReactMarkdown from "react-markdown";

export function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [provider, setProvider] = useState<User | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [isParticipating, setIsParticipating] = useState(false);
  const [isServingUser, setIsServingUser] = useState(false);
  const [canCancel, setCanCancel] = useState(true);
  const [loading, setLoading] = useState(true);
  const [pendingRequest, setPendingRequest] = useState<JoinRequest | null>(
    null,
  );
  const [isCancellingRequest, setIsCancellingRequest] = useState(false);
  const { currentUserId } = useUser();

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // Fetch service details
        const serviceResponse = await servicesApi.getService(id);
        const foundService = serviceResponse.data;
        setService(foundService);
        // Fetch provider details (service owner)
        try {
          const providerResponse = await usersApi.getUserById(
            foundService.user_id,
          );
          setProvider(providerResponse.data);
        } catch (error) {
          console.error("Error fetching provider:", error);
          // Set a default provider if fetching fails
          setProvider({
            _id: foundService.user_id,
            username: "Unknown User",
            email: "unknown@example.com",
            full_name: "Unknown User",
            bio: "Provider information not available",
            location: undefined,
            is_active: true,
            is_verified: false,
            timebank_balance: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            role: "user",
          });
        }

        // Set participants (matched users)
        const participants: User[] = [];
        if (
          foundService.matched_user_ids &&
          foundService.matched_user_ids.length > 0
        ) {
          for (const matchedUserId of foundService.matched_user_ids) {
            try {
              const matchedUserResponse =
                await usersApi.getUserById(matchedUserId);
              participants.push(matchedUserResponse.data);
            } catch (error) {
              console.error("Error fetching matched user:", error);
              // Add placeholder if fetching fails
              participants.push({
                _id: matchedUserId,
                username: "Matched User",
                email: "matched@example.com",
                full_name: "Matched User",
                bio: undefined,
                location: undefined,
                is_active: true,
                is_verified: false,
                role: "user" as const,
                timebank_balance: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          }
        }
        setParticipants(participants as User[]);
        const isUserParticipating =
          currentUserId &&
          (foundService.matched_user_ids?.includes(currentUserId) ||
            foundService.user_id === currentUserId);
        setIsParticipating(isUserParticipating as boolean);
        setIsServingUser(foundService.user_id === currentUserId);
        // Check if cancellation is allowed (not in last 24 hours)
        const now = new Date();
        const serviceDate = new Date(foundService.created_at);
        const hoursDiff =
          (now.getTime() - serviceDate.getTime()) / (1000 * 60 * 60);
        setCanCancel(hoursDiff < 24);

        // Check if user has a pending request for this service
        if (currentUserId && foundService.user_id !== currentUserId) {
          try {
            const pendingRequestResponse =
              await joinRequestsApi.getPendingRequestForService(id);
            setPendingRequest(pendingRequestResponse.data);
          } catch (error: any) {
            // 404 means no pending request, which is fine
            if (error.response?.status !== 404) {
              console.error("Error fetching pending request:", error);
            }
            setPendingRequest(null);
          }
        }
      } catch (error) {
        console.error("Error fetching service:", error);
        setService(null);
        setProvider(null);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [id, currentUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Text>Loading service details...</Text>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <Text size="4" weight="bold" className="mb-2">
          Service Not Found
        </Text>
        <Text color="gray" className="mb-4">
          The service you're looking for doesn't exist or has been removed.
        </Text>
        <Button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Text size="4" weight="bold" className="mb-2">
            Loading Provider Information
          </Text>
          <Text color="gray">
            Please wait while we load the provider details...
          </Text>
        </div>
      </div>
    );
  }

  const formatDuration = (hours: number) => {
    return `${hours}h`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (timeString: string) => {
    // Convert HH:MM to readable format (e.g., "14:30" -> "2:30 PM")
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatSchedulingInfo = () => {
    if (!service.scheduling_type) return null;

    switch (service.scheduling_type) {
      case "specific":
        if (service.specific_date && service.specific_time) {
          const date = new Date(service.specific_date);
          const formattedDate = date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          return {
            type: "Specific Date & Time",
            value: `${formattedDate} at ${formatTime(service.specific_time)}`,
          };
        }
        return null;
      case "recurring":
        if (
          service.recurring_pattern?.days &&
          service.recurring_pattern?.time
        ) {
          const days = service.recurring_pattern.days.join(", ");
          return {
            type: "Recurring Pattern",
            value: `${days} at ${formatTime(service.recurring_pattern.time)}`,
          };
        }
        return null;
      case "open":
        if (service.open_availability) {
          return {
            type: "Open Availability",
            value: service.open_availability,
          };
        }
        return null;
      default:
        return null;
    }
  };

  const handleCancelParticipation = () => {
    if (canCancel) {
      setIsParticipating(false);
      // In real app, this would make an API call
    }
  };

  const handleConfirmServiceCompletion = async () => {
    if (!service || !id) return;

    const confirmed = window.confirm(
      "Confirm that you have received this service? The service will be marked as completed once both parties confirm.",
    );
    if (!confirmed) return;

    try {
      const response = await servicesApi.confirmServiceCompletion(id);
      const updatedService = response.data;
      setService(updatedService);

      // Check if service was completed (both parties confirmed)
      if (updatedService.status === "completed") {
        alert(
          "Service completed! Both parties confirmed. TimeBank transaction logs have been created.",
        );
      } else {
        alert(
          "Your confirmation has been recorded. Waiting for provider confirmation.",
        );
      }
    } catch (error: any) {
      console.error("Error confirming service completion:", error);
      alert(
        error.response?.data?.detail ||
          "Failed to confirm service completion. Please try again.",
      );
    }
  };

  const handleCancelRequest = async () => {
    if (!pendingRequest) return;

    try {
      setIsCancellingRequest(true);
      await joinRequestsApi.cancelRequest(pendingRequest._id);
      setPendingRequest(null);
    } catch (error) {
      console.error("Error cancelling request:", error);
    } finally {
      setIsCancellingRequest(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <>
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 mb-10">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={service.status} />
                  <Badge
                    color={
                      service?.service_type === "offer" ? "purple" : "blue"
                    }
                    variant="soft"
                    size="2"
                  >
                    {service?.service_type === "offer" ? "OFFER" : "NEED"}
                  </Badge>
                  <Badge color="yellow" variant="soft" size="2">
                    {service.category}
                  </Badge>
                  <Text size="2" color="gray">
                    Posted {formatDate(service.created_at)}
                  </Text>
                </div>
                <h1 className="text-3xl font-bold">{service.title}</h1>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
              <Flex align="center" gap="2">
                <ClockIcon className="w-5 h-5" color="gray" />
                <Text size="3" weight="medium">
                  Duration:
                </Text>
                <Text size="3">
                  {formatDuration(service.estimated_duration)}
                </Text>
              </Flex>

              <Flex align="center" gap="2">
                <PersonIcon className="w-5 h-5" color="gray" />
                <Text size="3" weight="medium">
                  Max participants:
                </Text>
                <Text size="3">{service.max_participants ?? "No limit"}</Text>
              </Flex>

              <Flex align="center" gap="2">
                <Crosshair1Icon className="w-5 h-5" color="gray" />
                <Text size="3" weight="medium">
                  Location:
                </Text>
                <Text size="3">{service.location.address || "Istanbul"}</Text>
              </Flex>

              {service.deadline && (
                <Flex align="center" gap="2">
                  <CalendarIcon className="w-5 h-5" color="gray" />
                  <Text size="3" weight="medium">
                    Deadline:
                  </Text>
                  <Text size="3">{formatDate(service.deadline)}</Text>
                </Flex>
              )}
            </div>

            {/* Scheduling Information */}
            {formatSchedulingInfo() && (
              <Card className="mb-2">
                <Flex align="start" gap="2">
                  <CalendarIcon className="w-5 h-5 mt-0.5" color="purple" />
                  <div className="flex-1 flex flex-col">
                    <Text size="2" weight="bold" color="gray">
                      {formatSchedulingInfo()?.type}
                    </Text>
                    <Text size="3">{formatSchedulingInfo()?.value}</Text>
                  </div>
                </Flex>
              </Card>
            )}

            {/* Description */}
            <div className="mb-6 prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  img: ({ node, ...props }) => (
                    <img
                      {...props}
                      className="my-4 w-full h-auto rounded-xl max-w-4xl"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  ),
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#7c3aed" }}
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <div className="leading-relaxed mb-2">
                      <Text size="3">{props.children}</Text>
                    </div>
                  ),
                }}
              >
                {service.description}
              </ReactMarkdown>
            </div>

            {/* Tags */}
            {service.tags.length > 0 && (
              <div className="my-3">
                <Flex wrap="wrap" gap="2">
                  {service.tags.map((tag, index) => (
                    <Badge key={index} variant="soft" size="2">
                      {typeof tag === "string" ? tag : tag.label}
                    </Badge>
                  ))}
                </Flex>
              </div>
            )}
            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {!isParticipating && !isServingUser ? (
                // Check if user has a pending request
                pendingRequest ? (
                  <>
                    <Button color="green" size="3" disabled>
                      <ClockIcon className="w-4 h-4 mr-2" />
                      Request Pending
                    </Button>
                    <Button
                      variant="soft"
                      color="red"
                      size="3"
                      disabled={
                        isCancellingRequest || service.status !== "active"
                      }
                      onClick={handleCancelRequest}
                    >
                      {isCancellingRequest ? "Cancelling..." : "Cancel Request"}
                    </Button>
                  </>
                ) : // Disable handshake if post is not active
                service.status !== "active" ? (
                  <Button color="green" size="3" disabled>
                    Post is not active
                  </Button>
                ) : (
                  <HandShakeModal
                    service={service}
                    onJoin={() => {
                      // Refresh pending request after joining
                      if (id && currentUserId) {
                        joinRequestsApi
                          .getPendingRequestForService(id)
                          .then((response) => setPendingRequest(response.data))
                          .catch((error: any) => {
                            if (error.response?.status !== 404) {
                              console.error(
                                "Error fetching pending request:",
                                error,
                              );
                            }
                            setPendingRequest(null);
                          });
                      }
                    }}
                  />
                )
              ) : isServingUser ? (
                <Button
                  color="green"
                  size="3"
                  disabled={service.status !== "active"}
                >
                  You're serving
                </Button>
              ) : (
                <Button
                  color="green"
                  size="3"
                  disabled={service.status !== "active"}
                >
                  <CheckCircledIcon className="w-4 h-4 mr-2" />
                  You're joining
                </Button>
              )}

              <StartChatButton
                otherUserIds={[service.user_id]}
                service_id={service._id}
                transaction_id={undefined}
              />

              <Button
                variant="soft"
                size="3"
                disabled={service.status !== "active"}
              >
                <HeartIcon className="w-4 h-4 mr-2" />
                Save
              </Button>

              <Tooltip content="Click to copy the link to the service">
                <Button variant="soft" size="3" onClick={handleShare}>
                  <Share1Icon className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </Tooltip>
              {/* Cancel participation button */}
              {isParticipating && !isServingUser && (
                <Tooltip content="Cannot cancel within 24 hours of service">
                  <Button
                    variant="soft"
                    color="red"
                    size="3"
                    disabled={!canCancel || service.status !== "active"}
                    onClick={handleCancelParticipation}
                  >
                    Cancel Participation
                  </Button>
                </Tooltip>
              )}

              {/* Receiver confirmation button for in_progress services */}
              {service.status === "in_progress" &&
                isParticipating &&
                !isServingUser &&
                currentUserId &&
                service.matched_user_ids?.includes(currentUserId) &&
                (!service.receiver_confirmed_ids ||
                  !service.receiver_confirmed_ids.includes(currentUserId)) && (
                  <Button
                    color="green"
                    size="3"
                    onClick={handleConfirmServiceCompletion}
                  >
                    <CheckCircledIcon className="w-4 h-4 mr-2" />
                    Confirm I Received This Service
                  </Button>
                )}
            </div>
          </Card>

          {/* Service Completion Status for in_progress services */}
          {service.status === "in_progress" &&
            service.matched_user_ids &&
            service.matched_user_ids.length > 0 && (
              <Card
                className="p-4"
                style={{ backgroundColor: "var(--blue-2)" }}
              >
                <Flex direction="column" gap="3">
                  <Text size="3" weight="bold">
                    Service Completion Status
                  </Text>
                  <Flex gap="4" wrap="wrap">
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">
                        Provider:
                      </Text>
                      <Badge
                        color={service.provider_confirmed ? "green" : "gray"}
                        size="2"
                      >
                        {service.provider_confirmed ? "Confirmed" : "Pending"}
                      </Badge>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">
                        Receivers:
                      </Text>
                      <Badge
                        color={
                          service.receiver_confirmed_ids &&
                          service.matched_user_ids &&
                          service.receiver_confirmed_ids.length ===
                            service.matched_user_ids.length
                            ? "green"
                            : "gray"
                        }
                        size="2"
                      >
                        {service.receiver_confirmed_ids
                          ? `${service.receiver_confirmed_ids.length}/${service.matched_user_ids.length} Confirmed`
                          : `0/${service.matched_user_ids.length} Confirmed`}
                      </Badge>
                    </Flex>
                  </Flex>
                </Flex>
              </Card>
            )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Provider profile */}
          <ProviderProfileSummary user={provider} />

          {/* Participants */}
          {participants.length > 0 && (
            <Card className="p-4">
              <Text size="3" weight="bold" className="mb-4 block">
                Participants ({participants.length})
              </Text>
              <ParticipantAvatars participants={participants} />
            </Card>
          )}

          {/* Map */}
          <ServiceMap services={[service]} height="350px" />

          {/* Comments section */}
          <CommentSection serviceId={service._id} />
        </div>
      </div>
    </>
  );
}

export const StartChatButton = ({
  otherUserIds,
  service_id = undefined,
  transaction_id = undefined,
}: {
  otherUserIds: string[];
  service_id: string | undefined;
  transaction_id: string | undefined;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUserId } = useUser();

  const handleStartChat = async () => {
    try {
      if (!currentUserId) {
        console.error("No current user ID found");
        return;
      }

      const allParticipants = [currentUserId, ...otherUserIds];

      await chatApi
        .createChatRoom({
          participant_ids: allParticipants,
          service_id: service_id,
          transaction_id: transaction_id,
        })
        .then(() => {
          // Invalidate chat rooms cache to refresh the list
          queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
          navigate(`/chat`);
        })
        .catch((error) => {
          console.error("Error starting chat:", error);
          if (
            error.response?.data?.detail?.includes(
              "Chat room already exists for these participants:",
            )
          ) {
            // Invalidate chat rooms cache even for existing rooms
            queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
            navigate(`/chat`);
          }
        });
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };
  return (
    <Button variant="soft" size="3" onClick={handleStartChat}>
      <ChatBubbleIcon className="w-4 h-4 mr-2" />
      Start Chat
    </Button>
  );
};
