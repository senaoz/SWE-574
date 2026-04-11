import { Card, Badge, Text, Flex } from "@radix-ui/themes";
import { Service, BadgeSummary } from "@/types";
import { useNavigate } from "react-router-dom";
import { ClickableTag } from "@/components/ui/ClickableTag";
import {
  ClockIcon,
  Crosshair1Icon,
  HeartIcon,
  HeartFilledIcon,
  StarFilledIcon,
} from "@radix-ui/react-icons";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { usersApi, ratingsApi } from "@/services/api";
import { StatusBadge } from "./StatusBadge";
import { CustomBadge, getHighestPriorityBadge } from "./BadgeDisplay";
import { formatRelativeTime, formatDurationShort, formatDateShort } from "@/utils/utils";
import { useSavedServiceIds } from "@/hooks/useSavedServiceIds";

interface OfferListingCardProps {
  service: Service;
  recommendationReason?: string;
  isRecommended?: boolean;
}

export function OfferListingCard({
  service,
  recommendationReason,
  isRecommended = false,
}: OfferListingCardProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [badgeSummary, setBadgeSummary] = useState<BadgeSummary | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [optimisticSavedState, setOptimisticSavedState] = useState<
    boolean | null
  >(null);
  const {
    currentUserId,
    isSaved: isServiceSaved,
    saveService,
    unsaveService,
    isSavingService,
    isUnsavingService,
  } = useSavedServiceIds();
  const resolvedSavedState = isServiceSaved(service);
  const isSaved = optimisticSavedState ?? resolvedSavedState;
  const isSaving = isSavingService(service._id);
  const isUnsaving = isUnsavingService(service._id);

  useEffect(() => {
    async function fetchUserData() {
      if (!service.user_id) return;
      try {
        const [userRes, badgesRes, ratingsRes] = await Promise.all([
          usersApi.getUserById(service.user_id),
          usersApi.getUserBadges(service.user_id).catch(() => ({ data: null })),
          ratingsApi.getUserRatings(service.user_id, 1, 1).catch(() => ({
            data: { total: 0, average_score: null },
          })),
        ]);
        const earnedBadges = badgesRes.data?.badges.filter((b) => b.earned) ?? [];
        setUser(userRes.data);
        setBadgeSummary({
          badges: badgesRes.data?.badges ?? [],
          earned_count: badgesRes.data?.earned_count ?? 0,
          total_count: badgesRes.data?.total_count ?? 0,
          earned_badges: earnedBadges,
          last_earned_badge: getHighestPriorityBadge(earnedBadges),
        });
        setAverageRating(ratingsRes.data?.average_score ?? null);
      } catch (err) {
        setUser(null);
        setBadgeSummary(null);
        setAverageRating(null);
      }
    }
    fetchUserData();
  }, [service.user_id]);

  useEffect(() => {
    setOptimisticSavedState(null);
  }, [service._id, resolvedSavedState]);

  const handleCardClick = () => {
    navigate(`/service/${service._id}`);
  };

  const handleSavedBadgeClick = async (
    event: React.MouseEvent | React.KeyboardEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (!currentUserId || isSaving || isUnsaving) return;

    const previousSavedState = isSaved;

    try {
      if (previousSavedState) {
        await unsaveService(service._id);
      } else {
        await saveService(service._id);
      }
    } catch (error) {
      setOptimisticSavedState(previousSavedState);
      console.error("Error toggling saved service:", error);
    }
  };

  const ownerLabel = user?.full_name || `@${user?.username || ""}`;

  const ownerMeta = (
    <Flex
      align="center"
      gap="1"
      className="text-sm opacity-70 shrink-0 whitespace-nowrap ml-auto"
    >
      <Text size="1" className="whitespace-nowrap max-w-[120px] truncate">
        {ownerLabel}
      </Text>
      {averageRating != null && (
        <Flex align="center" gap="1">
          <StarFilledIcon className="w-3 h-3 text-yellow-500" />
          <Text size="1">{averageRating.toFixed(1)}</Text>
        </Flex>
      )}
      {badgeSummary?.last_earned_badge && (
        <CustomBadge badge={badgeSummary.last_earned_badge} size={14} />
      )}
    </Flex>
  );

  return (
    <Card
      size="2"
      className={`hover-card flex flex-col h-full gap-2 overflow-hidden ${
        isRecommended ? "recommended-listing-card" : ""
      }`}
      onClick={handleCardClick}
    >
      {/* Header with status badges (left) and user info (right) */}
      <div className={`flex gap-2 ${isRecommended ? "flex-col" : "items-center justify-between"}`}>
        {isRecommended && (
          <Text size="1" className="recommended-listing-label">
            Recommended
          </Text>
        )}
        <div className="flex items-center justify-between gap-2 w-full">
          <Flex align="center" gap="1" wrap="wrap" className="min-w-0">
            <StatusBadge status={service.status} size="1" variant="soft" />
            <Badge
              color={service?.service_type === "offer" ? "orange" : "blue"}
              variant="soft"
            >
              {service?.service_type === "offer" ? "OFFER" : "NEED"}
            </Badge>
            {currentUserId && isSaved && (
              <Badge
                color={isSaved ? "red" : "gray"}
                variant="soft"
                className={`inline-flex items-center gap-1 ${
                  !isSaving && !isUnsaving ? "cursor-pointer" : ""
                }`}
                onClick={handleSavedBadgeClick}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    void handleSavedBadgeClick(event);
                  }
                }}
                role="button"
                tabIndex={0}
                title={isSaved ? "Remove from saved items" : "Save this item"}
                aria-disabled={isSaving || isUnsaving}
              >
                {isSaved ? (
                  <HeartFilledIcon className="h-3 w-3" />
                ) : (
                  <HeartIcon className="h-3 w-3" />
                )}
                {isSaving
                  ? "Saving..."
                  : isUnsaving
                    ? "Removing..."
                    : isSaved
                      ? "Saved"
                      : "Save"}
              </Badge>
            )}
          </Flex>
          {ownerMeta}
        </div>
      </div>
      <h3 className="capitalize text-xl font-bold leading-tight my-1">
        {service.title}
      </h3>

      {recommendationReason && (
        <Text size="2" className="recommended-listing-reason">
          {recommendationReason}
        </Text>
      )}

      {/* Details row */}
      <Flex align="center" gap="4" className="text-sm">
        <Flex align="center" gap="1">
          <ClockIcon className="w-5 h-5 text-gray-500" />
          <Text>{formatDurationShort(service.estimated_duration)}</Text>
        </Flex>
        {service.scheduling_type === "specific" && service.specific_date && (
          <Flex align="center" gap="1">
            <CalendarIcon className="w-5 h-5 text-blue-500" />
            <Text>
              {formatDateShort(service.specific_date)}
              {service.specific_time && ` · ${service.specific_time}`}
            </Text>
          </Flex>
        )}
        {service.scheduling_type === "recurring" && service.recurring_pattern && (
          <Flex align="center" gap="1">
            <CalendarIcon className="w-5 h-5 text-blue-500" />
            <Text>
              {service.recurring_pattern.days.join(", ")}
              {service.recurring_pattern.time && ` · ${service.recurring_pattern.time}`}
            </Text>
          </Flex>
        )}
        {service.scheduling_type === "open" && service.open_availability && (
          <Flex align="center" gap="1">
            <CalendarIcon className="w-5 h-5 text-blue-500" />
            <Text className="truncate max-w-[200px]">{service.open_availability}</Text>
          </Flex>
        )}
      </Flex>
      <Flex align="center" gap="1" className="text-sm">
        <Crosshair1Icon className="w-4 h-4 flex-shrink-0" />
        <Text className="whitespace-nowrap overflow-hidden text-ellipsis">
          {service.is_remote ? "Remote" : service?.location?.address}
        </Text>
      </Flex>

      {service.tags?.length > 0 && (
        <Flex
          wrap="wrap"
          gap="1"
          onClick={(e) => e.stopPropagation()}
          className="mt-auto"
        >
          {service.tags.slice(0, 3).map((tag, index) => (
            <ClickableTag
              key={
                typeof tag === "string"
                  ? tag
                  : (tag.entityId || tag.label) + index
              }
              tag={tag}
              size="1"
              variant="soft"
              color="green"
              stopPropagation
            />
          ))}
        </Flex>
      )}

      <div className="flex items-center justify-between">
        <Text size="1" className="opacity-60">
          Posted {formatRelativeTime(service.created_at)}
          {service.deadline && ` | Deadline: ${formatRelativeTime(service.deadline)}`}
        </Text>
        {currentUserId && (
          <Badge
            color={isSaved ? "red" : "gray"}
            variant="soft"
            className={`inline-flex items-center gap-1 ${
              !isSaving && !isUnsaving ? "cursor-pointer" : ""
            }`}
            onClick={handleSavedBadgeClick}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                void handleSavedBadgeClick(event);
              }
            }}
            role="button"
            tabIndex={0}
            title={isSaved ? "Remove from saved items" : "Save this item"}
            aria-disabled={isSaving || isUnsaving}
          >
            {isSaved ? (
              <HeartFilledIcon className="h-3 w-3" />
            ) : (
              <HeartIcon className="h-3 w-3" />
            )}
            {isSaving
              ? "Saving..."
              : isUnsaving
                ? "Removing..."
                : isSaved
                  ? "Saved"
                  : "Save"}
          </Badge>
        )}
      </div>
    </Card>
  );
}
