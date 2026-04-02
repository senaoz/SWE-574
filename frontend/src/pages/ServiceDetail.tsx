import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Card,
  Badge,
  Text,
  Flex,
  Button,
  Tooltip,
  DropdownMenu,
} from "@radix-ui/themes";
import {
  Service,
  User,
  JoinRequest,
  ForumEvent,
  PotentialMatchItem,
} from "@/types";
import {
  chatApi,
  servicesApi,
  usersApi,
  joinRequestsApi,
  forumApi,
  getImageUrl,
} from "@/services/api";
import { useUser } from "@/App";
import {
  ClockIcon,
  CheckCircledIcon,
  HeartIcon,
  HeartFilledIcon,
  Share1Icon,
  ArrowLeftIcon,
  Crosshair1Icon,
  PersonIcon,
  Pencil1Icon,
  TrashIcon,
} from "@radix-ui/react-icons";
import {
  AlertOctagonIcon,
  CalendarRangeIcon,
  MessageCircleIcon,
} from "lucide-react";
import { calculateDistance, formatDateLong, formatDurationShort } from "@/utils/utils";
import { ProviderProfileSummary } from "@/components/ui/ProviderProfileSummary";
import { ServiceMap } from "@/components/map/ServiceMap";
import { HandShakeModal } from "@/components/ui/HandShakeModal";
import { CommentSection } from "@/components/ui/CommentSection";
import { ParticipantAvatars } from "@/components/ui/ParticipantAvatars";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ClickableTag } from "@/components/ui/ClickableTag";
import { ReportDialog } from "@/components/ui/ReportDialog";
import { EditServiceDialog } from "@/components/forms/EditServiceDialog";
import ReactMarkdown from "react-markdown";
import { useSavedServiceIds } from "@/hooks/useSavedServiceIds";

const getTagLabels = (service: Service) =>
  new Set(
    (service.tags || [])
      .map((tag) => (typeof tag === "string" ? tag : tag.label))
      .filter(Boolean)
      .map((tag) => tag.toLowerCase().trim()),
  );

const tokenizeText = (...values: Array<string | undefined>) =>
  new Set(
    values
      .flatMap((value) =>
        (value || "")
          .toLowerCase()
          .match(/\b[\wçğıöşü]+\b/g)
          ?.filter((token) => token.length > 2) || [],
      )
      .filter(Boolean),
  );

const jaccardSimilarity = (left: Set<string>, right: Set<string>) => {
  if (!left.size || !right.size) return 0;
  const union = new Set([...left, ...right]);
  const intersectionSize = [...left].filter((value) => right.has(value)).length;
  return union.size ? intersectionSize / union.size : 0;
};


const buildLocalPotentialMatches = (
  currentService: Service,
  services: Service[],
  savedIds: string[] = [],
  limit = 4,
): PotentialMatchItem[] => {
  const currentTags = getTagLabels(currentService);
  const currentCategory = (currentService.category || "").trim().toLowerCase();
  const currentKeywords = tokenizeText(
    currentService.title,
    currentService.description,
    currentService.category,
  );
  const isFull = (service: Service) =>
    (service.matched_user_ids?.length || 0) >= (service.max_participants || 1);

  const scoreService = (candidate: Service): PotentialMatchItem | null => {
    if (candidate._id === currentService._id) return null;
    if (savedIds.includes(candidate._id)) return null;
    if (candidate.status !== "active") return null;
    if (isFull(candidate)) return null;

    const candidateTags = getTagLabels(candidate);
    const candidateCategory = (candidate.category || "").trim().toLowerCase();
    const candidateKeywords = tokenizeText(
      candidate.title,
      candidate.description,
      candidate.category,
    );

    const tagSimilarity = jaccardSimilarity(currentTags, candidateTags);
    const commonTagCount = [...currentTags].filter((tag) =>
      candidateTags.has(tag),
    ).length;
    const categorySimilarity =
      currentCategory && currentCategory === candidateCategory ? 1 : 0;
    const keywordSimilarity = jaccardSimilarity(
      currentKeywords,
      candidateKeywords,
    );

    if (!commonTagCount && !categorySimilarity && !keywordSimilarity) {
      return null;
    }

    let proximityScore = 0.7;
    if (currentService.is_remote && candidate.is_remote) {
      proximityScore = 1;
    } else if (!currentService.is_remote && !candidate.is_remote) {
      proximityScore = Math.exp(
        -calculateDistance(
          currentService.location.latitude,
          currentService.location.longitude,
          candidate.location.latitude,
          candidate.location.longitude,
        ) / 10,
      );
    }

    const ageInDays =
      (Date.now() - new Date(candidate.created_at).getTime()) /
      (1000 * 60 * 60 * 24);
    const recencyScore = Math.exp(-Math.max(ageInDays, 0) / 14);

    const relevanceScore =
      0.45 * tagSimilarity +
      0.2 * categorySimilarity +
      0.15 * keywordSimilarity +
      0.15 * proximityScore +
      0.05 * recencyScore;

    const reasonLabel =
      commonTagCount > 0
        ? "Matching tags"
        : categorySimilarity >= keywordSimilarity
          ? "Same category"
          : "Similar details";

    return {
      service: candidate,
      relevance_score: Number(relevanceScore.toFixed(4)),
      reason_label: reasonLabel,
    };
  };

  const prioritize = (serviceType: Service["service_type"]) =>
    services
      .filter((service) => service.service_type === serviceType)
      .map(scoreService)
      .filter((item): item is PotentialMatchItem => item !== null)
      .sort((left, right) => right.relevance_score - left.relevance_score);

  const oppositeType = currentService.service_type === "offer" ? "need" : "offer";
  const oppositeMatches = prioritize(oppositeType);
  if (oppositeMatches.length >= limit) {
    return oppositeMatches.slice(0, limit);
  }

  const sameTypeMatches = prioritize(currentService.service_type).filter(
    (item) => !oppositeMatches.some((existing) => existing.service._id === item.service._id),
  );

  return [...oppositeMatches, ...sameTypeMatches].slice(0, limit);
};

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
  const [linkedEvents, setLinkedEvents] = useState<ForumEvent[]>([]);
  const [copied, setCopied] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const { currentUserId, user: currentUser } = useUser();
  const queryClient = useQueryClient();
  const { savedServiceIds } = useSavedServiceIds();

  const {
    data: potentialMatchesData,
    isLoading: potentialMatchesLoading,
    isError: potentialMatchesError,
  } = useQuery({
    queryKey: ["potential-matches", id, currentUserId],
    queryFn: () => servicesApi.getPotentialMatches(id!, 4).then((res) => res.data),
    enabled: !!id,
    retry: false,
  });

  const { data: potentialMatchFallbackServices } = useQuery({
    queryKey: ["potential-matches-fallback", id],
    queryFn: () =>
      servicesApi.getServices({ limit: 100 }).then((res) => res.data.services),
    enabled: !!id,
    retry: false,
  });

  const isSaved = service?.is_saved ?? (id ? savedServiceIds.includes(id) : false);
  const saveMutation = useMutation({
    mutationFn: (serviceId: string) => servicesApi.saveService(serviceId),
    onSuccess: () => {
      setService((prev) => (prev ? { ...prev, is_saved: true } : prev));
      queryClient.invalidateQueries({ queryKey: ["saved-service-ids"] });
      queryClient.invalidateQueries({ queryKey: ["saved-services"] });
    },
  });
  const unsaveMutation = useMutation({
    mutationFn: (serviceId: string) => servicesApi.unsaveService(serviceId),
    onSuccess: () => {
      setService((prev) => (prev ? { ...prev, is_saved: false } : prev));
      queryClient.invalidateQueries({ queryKey: ["saved-service-ids"] });
      queryClient.invalidateQueries({ queryKey: ["saved-services"] });
    },
  });
  const handleToggleSave = () => {
    if (!id || !currentUserId) return;
    if (isSaved) {
      unsaveMutation.mutate(id);
    } else {
      saveMutation.mutate(id);
    }
  };
  const { data: timebankData } = useQuery({
    queryKey: ["timebank"],
    queryFn: () => usersApi.getTimeBank().then((res) => res.data),
    enabled: !!currentUserId,
    retry: false,
  });
  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const serviceResponse = await servicesApi.getService(id);
        const foundService = serviceResponse.data;
        setService(foundService);
        try {
          const providerResponse = await usersApi.getUserById(
            foundService.user_id,
          );
          setProvider(providerResponse.data);
        } catch (error) {
          console.error("Error fetching provider:", error);
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
        const now = new Date();
        const serviceDate = new Date(foundService.created_at);
        const hoursDiff =
          (now.getTime() - serviceDate.getTime()) / (1000 * 60 * 60);
        setCanCancel(hoursDiff < 24);
        if (currentUserId && foundService.user_id !== currentUserId) {
          try {
            const pendingRequestResponse =
              await joinRequestsApi.getPendingRequestForService(id);
            setPendingRequest(pendingRequestResponse.data);
          } catch (error: any) {
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
  useEffect(() => {
    if (!id) return;
    forumApi
      .getLinkedEvents(id)
      .then((r) => setLinkedEvents(r.data.events || []))
      .catch(() => setLinkedEvents([]));
  }, [id]);
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
  const formatTime = (timeString: string) => {
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
    }
  };
  const handleDelete = async () => {
    if (!id || !window.confirm("Are you sure you want to delete this service?"))
      return;
    try {
      await servicesApi.deleteService(id);
      navigate(-1);
    } catch (error) {
      console.error("Error deleting service:", error);
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
  const shareUrl = window.location.href;
  const shareTitle = `${service?.service_type === "offer" ? "Offer" : "Need"}: ${service?.title}`;
  const shareText = `Check out this service on our community: "${service?.title}"`;
  const localPotentialMatchItems =
    service && potentialMatchFallbackServices
      ? buildLocalPotentialMatches(
          service,
          potentialMatchFallbackServices,
          savedServiceIds,
          4,
        )
      : [];
  const showPotentialMatchesError =
    potentialMatchesError &&
    !potentialMatchesData?.items?.length &&
    potentialMatchFallbackServices === undefined;
  const potentialMatchItems =
    potentialMatchesData?.items?.length && !potentialMatchesError
      ? potentialMatchesData.items
      : localPotentialMatchItems;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // user cancelled or share failed — ignore
      }
    }
  };
  const openShareWindow = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
  };
  return (
    <>
      {service && id && (
        <ReportDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          reportType="service"
          reportedId={id}
          reportedName={service.title}
        />
      )}
      {service && (
        <EditServiceDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          service={service}
          onSuccess={async () => {
            queryClient.invalidateQueries({ queryKey: ["service", id] });
            if (id) {
              const res = await servicesApi.getService(id);
              setService(res.data);
            }
          }}
        />
      )}
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Back
      </Button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 mb-10">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={service.status} />
                <Badge
                  color={service?.service_type === "offer" ? "purple" : "blue"}
                  variant="soft"
                  size="2"
                >
                  {service?.service_type === "offer" ? "OFFER" : "NEED"}
                </Badge>
                {service.is_remote && (
                  <Badge color="cyan" variant="soft" size="2">
                    REMOTE
                  </Badge>
                )}
                <Text size="2" color="gray">
                  Posted {formatDateLong(service.created_at)}
                </Text>
              </div>
              <h1 className="capitalize text-3xl font-bold">{service.title}</h1>
            </div>
          </div>
          {/* Images */}
          {service.image_urls?.length ? (
            <div className="w-full mb-6 overflow-hidden rounded-lg">
              {service.image_urls.length === 1 ? (
                <img
                  src={
                    getImageUrl(service.image_urls[0]) ?? service.image_urls[0]
                  }
                  alt=""
                  className="w-full max-h-60 object-cover"
                />
              ) : (
                <div
                  className={`grid gap-1 w-full ${
                    service.image_urls.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-3"
                  }`}
                >
                  {service.image_urls.map((url, i) => (
                    <img
                      key={i}
                      src={getImageUrl(url) ?? url}
                      alt=""
                      className="w-full max-h-60 object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}
          {/* Details */}
          <div className="grid grid-cols-1 gap-2 mb-2">
            <Flex align="center" gap="2">
              <ClockIcon className="w-5 h-5" color="gray" />
              <Text size="3" weight="medium">
                Duration:
              </Text>
              <Text size="3">{formatDurationShort(service.estimated_duration)}</Text>
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
              <Text size="3">
                {service.is_remote
                  ? "Remote (online)"
                  : service.location?.address || "Istanbul"}
              </Text>
            </Flex>
            {service.deadline && (
              <Flex align="center" gap="2">
                <CalendarRangeIcon className="w-5 h-5" color="gray" />
                <Text size="3" weight="medium">
                  Deadline:
                </Text>
                <Text size="3">{formatDateLong(service.deadline)}</Text>
              </Flex>
            )}
          </div>
          {/* Scheduling Information */}
          {formatSchedulingInfo() && (
            <div className="my-4 flex items-center gap-2 p-4 rounded-lg bg-[var(--accent-a2)] transition-colors duration-200">
              <CalendarRangeIcon className="w-7 h-7 text-purple-500" />
              <Flex direction="column">
                <Text size="3" weight="medium">
                  {formatSchedulingInfo()?.type}
                </Text>
                <Text size="2" className="opacity-80">
                  {formatSchedulingInfo()?.value}
                </Text>
              </Flex>
            </div>
          )}
          {/* Description */}
          <div className="mb-6 prose-content space-y-2">
            <ReactMarkdown
              components={{
                img: ({ node: _node, ...props }) => (
                  <img
                    {...props}
                    alt={props.alt || "Service description image"}
                    className="my-4 w-full h-auto rounded-xl max-w-4xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                ),
                a: ({ node: _node, ...props }) => (
                  <a {...props} target="_blank" rel="noopener noreferrer" />
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
                  <ClickableTag
                    key={tag.entityId || tag.label + index}
                    tag={tag}
                    size="2"
                    variant="soft"
                  />
                ))}
              </Flex>
            </div>
          )}
          {service.service_type === "need" &&
            timebankData?.requires_need_creation && (
              <div className="mb-4 bg-red-500 p-2 text-white text-sm rounded-lg">
                You need to create a Need before you can give help.
              </div>
            )}
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Edit button for owner or admin */}
            {(service.status === "active" && service.user_id === currentUserId) || currentUser?.role === "admin" && (
                <Button
                  variant="soft"
                  size="3"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Pencil1Icon className="w-4 h-4" />
                  Edit
                </Button>
              )}
            {/* Delete button for admins */}
            {currentUser?.role === "admin" && (
              <Button
                variant="soft"
                color="red"
                size="3"
                onClick={handleDelete}
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </Button>
            )}
            {!isParticipating && !isServingUser ? (
              pendingRequest ? (
                <>
                  <Button color="green" size="3" disabled>
                    <ClockIcon className="w-4 h-4" />
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
              ) : service.status !== "active" ? (
                <Button color="green" size="3" disabled>
                  Post is not active
                </Button>
              ) : (
                <HandShakeModal
                  service={service}
                  requiresNeedCreation={
                    timebankData?.requires_need_creation ?? false
                  }
                  disabled={
                    !!service.max_participants &&
                    service.max_participants <= participants.length
                  }
                  onJoin={() => {
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
                  isOwner={service.user_id === currentUserId || false}
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
                <CheckCircledIcon className="w-4 h-4" />
                You're joining
              </Button>
            )}
            <StartChatButton
              disabled={service.status !== "active" || isServingUser}
              otherUserIds={[service.user_id]}
              service_id={service._id}
              transaction_id={undefined}
            />
            <Button
              variant={isSaved ? "solid" : "soft"}
              color={isSaved ? "red" : undefined}
              size="3"
              onClick={handleToggleSave}
              disabled={
                !currentUserId ||
                saveMutation.isPending ||
                unsaveMutation.isPending
              }
            >
              {isSaved ? (
                <HeartFilledIcon className="w-4 h-4" />
              ) : (
                <HeartIcon className="w-4 h-4" />
              )}
              {isSaved ? "Saved" : "Save"}
            </Button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button variant="soft" size="3">
                  <Share1Icon className="w-4 h-4" />
                  Share
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item onClick={handleCopyLink}>
                  {copied ? "Copied!" : "Copy link"}
                </DropdownMenu.Item>
                {typeof navigator.share === "function" && (
                  <>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item onClick={handleNativeShare}>
                      Share via device…
                    </DropdownMenu.Item>
                  </>
                )}
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  onClick={() =>
                    openShareWindow(
                      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
                    )
                  }
                >
                  Share on X (Twitter)
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onClick={() =>
                    openShareWindow(
                      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
                    )
                  }
                >
                  Share on Facebook
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onClick={() =>
                    openShareWindow(
                      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
                    )
                  }
                >
                  Share on LinkedIn
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onClick={() =>
                    openShareWindow(
                      `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
                    )
                  }
                >
                  Share on WhatsApp
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  onClick={() =>
                    window.open(
                      `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`,
                    )
                  }
                >
                  Share via Email
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
            {/* Report button — only for non-owners */}
            {currentUserId && service.user_id !== currentUserId && (
              <Button
                variant="outline"
                color="red"
                size="3"
                onClick={() => setReportDialogOpen(true)}
              >
                <AlertOctagonIcon className="w-4 h-4" />
                Report
              </Button>
            )}
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
            {/* Provider: Mark service as completed — navigate to My Services tab */}
            {isServingUser &&
              service.status === "in_progress" &&
              currentUserId && (
                <Button
                  color="green"
                  size="3"
                  onClick={() =>
                    navigate(
                      `/profile?tab=services&status=in_progress&highlight=${id}`,
                    )
                  }
                >
                  <CheckCircledIcon className="w-4 h-4 mr-2" />
                  Mark as completed
                </Button>
              )}
          </div>
          <div className={"pt-6"}>
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <Text size="5" weight="bold" className="block">
                  Custom Recommendations for You!
                </Text>
                <Text size="2" color="gray">
                  Matching opposite-type services first, then similar posts if needed.
                </Text>
              </div>
              {!potentialMatchesLoading && potentialMatchItems.length > 0 && (
                  <Badge color="green" variant="soft">
                    {potentialMatchItems.length} match
                    {potentialMatchItems.length === 1 ? "" : "es"}
                  </Badge>
              )}
            </div>

            {potentialMatchItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {potentialMatchItems.map((item) => {
                    const match = item.service;
                    const matchLocation = match.is_remote
                        ? "Remote"
                        : match.location?.address || "Nearby";

                    return (
                        <Card
                            id={`recommendation-card-${match?._id || ''}`}
                            key={match._id}
                            className="p-4 hover-card"
                            onClick={() => navigate(`/service/${match._id}`)}
                        >
                          <Flex direction="column" gap="3">
                            <Flex justify="between" align="start" gap="2">
                              <Badge
                                  color={
                                    match.service_type === "offer" ? "purple" : "blue"
                                  }
                                  variant="soft"
                              >
                                {match.service_type === "offer" ? "OFFER" : "NEED"}
                              </Badge>
                              <Badge color="green" variant="soft">
                                {item.reason_label}
                              </Badge>
                            </Flex>

                            <div>
                              <Text size="3" weight="bold" className="line-clamp-2">
                                {match.title}
                              </Text>
                              <div className="prose-content card-description">
                                <ReactMarkdown
                                    components={{
                                      a: ({ node: _node, ...props }) => (
                                          <a
                                              {...props}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                          >
                                            {props.children}
                                          </a>
                                      ),
                                    }}
                                >
                                  {match.description}
                                </ReactMarkdown>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {match.tags.slice(0, 2).map((tag, index) => (
                                  <ClickableTag
                                      key={
                                        typeof tag === "string"
                                            ? tag
                                            : (tag.entityId || tag.label) + index
                                      }
                                      tag={tag}
                                      size="1"
                                      variant="outline"
                                      stopPropagation
                                  />
                              ))}
                            </div>

                            <Flex justify="between" align="center">
                              <Text size="1" color="gray">
                                {matchLocation}
                              </Text>
                              <Text size="1" color="gray">
                                {formatDurationShort(match.estimated_duration)}
                              </Text>
                            </Flex>
                          </Flex>
                        </Card>
                    );
                  })}
                </div>
            ) : potentialMatchesLoading ? (
                <Text size="2" color="gray">
                  Looking for related services...
                </Text>
            ) : showPotentialMatchesError ? (
                <Text size="2" color="gray">
                  Potential matches could not be loaded right now.
                </Text>
            ) : (
                <Text size="2" color="gray">
                  No potential matches yet. Matching offers/needs will appear here when
                  similar posts are available.
                </Text>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ProviderProfileSummary user={provider} />
          {participants.length > 0 && (
            <Card className="p-4">
              <Text size="3" weight="bold" className="mb-4 block">
                Participants ({participants.length})
              </Text>
              <ParticipantAvatars participants={participants} />
            </Card>
          )}

          {service.is_remote ? (
            <Card className="p-4">
              <Flex direction="column" gap="2" align="center">
                <Text size="2" color="gray" weight="medium">
                  Remote service
                </Text>
                <Text size="1" color="gray" align="center">
                  This service is offered remotely. No physical location.
                </Text>
              </Flex>
            </Card>
          ) : (
            <ServiceMap
              services={[service]}
              height="350px"
              showFilters={false}
              userPosition={[
                service.location.latitude,
                service.location.longitude,
              ]}
              sticky={false}
            />
          )}

          {linkedEvents.length > 0 && (
            <Card className="p-4">
              <Text size="3" weight="bold" className="mb-3 block">
                Forum Events ({linkedEvents.length})
              </Text>
              <div className="space-y-2">
                {linkedEvents.map((ev) => (
                  <div
                    key={ev._id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => navigate(`/forum/events/${ev._id}`)}
                  >
                    <Badge size="1" color="purple" variant="soft">
                      Event
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <Text size="2" weight="medium" className="line-clamp-1">
                        {ev.title}
                      </Text>
                    </div>
                    <Text size="1" color="gray">
                      {new Date(ev.event_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <CommentSection serviceId={service._id} />
        </div>
      </div>
    </>
  );
}
export const StartChatButton = ({
  disabled,
  otherUserIds,
  service_id = undefined,
  transaction_id = undefined,
}: {
  disabled: boolean;
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
        .then((response) => {
          queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
          const roomId = response.data._id;
          navigate(
            roomId
              ? `/profile?tab=chat&room_id=${roomId}`
              : "/profile?tab=chat",
          );
        })
        .catch((error) => {
          console.error("Error starting chat:", error);
          if (
            error.response?.data?.detail?.includes(
              "Chat room already exists for these participants:",
            )
          ) {
            queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
            navigate("/profile?tab=chat");
          }
        });
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };
  return (
    <Button
      variant="soft"
      size="3"
      onClick={handleStartChat}
      disabled={disabled}
    >
      <MessageCircleIcon className="w-4 h-4" />
      Start Chat
    </Button>
  );
};
