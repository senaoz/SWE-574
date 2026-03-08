import { Card, Badge, Text, Flex } from "@radix-ui/themes";
import { Service, BadgeSummary } from "@/types";
import { useNavigate } from "react-router-dom";
import { ClickableTag } from "@/components/ui/ClickableTag";
import {
  ClockIcon,
  Crosshair1Icon,
  StarFilledIcon,
} from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { usersApi, ratingsApi } from "@/services/api";
import { StatusBadge } from "./StatusBadge";
import { CustomBadge } from "./BadgeDisplay";

export function OfferListingCard({ service }: { service: Service }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [badgeSummary, setBadgeSummary] = useState<BadgeSummary | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);

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
        let earnedBadges = badgesRes.data?.badges.filter((b) => b.earned) ?? [];
        setUser(userRes.data);
        setBadgeSummary({
          badges: badgesRes.data?.badges ?? [],
          earned_count: badgesRes.data?.earned_count ?? 0,
          total_count: badgesRes.data?.total_count ?? 0,
          earned_badges: earnedBadges,
          last_earned_badge:
            earnedBadges.length > 0
              ? earnedBadges[earnedBadges.length - 1]
              : null,
        });
        setAverageRating(ratingsRes.data?.average_score ?? null);
        setRatingCount(ratingsRes.data?.total ?? 0);
      } catch (err) {
        setUser(null);
        setBadgeSummary(null);
        setAverageRating(null);
        setRatingCount(0);
      }
    }
    fetchUserData();
  }, [service.user_id]);

  const handleCardClick = () => {
    navigate(`/service/${service._id}`);
  };

  const formatDuration = (hours: number) => {
    return `${hours}h`;
  };

  const formatDate = (dateString: string) => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInMs = now.getTime() - commentDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return "just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return commentDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <Card
      size="2"
      className="hover-card flex flex-col h-full gap-2 overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Header with title and status */}
      <div className="flex gap-2 flex-wrap justify-between items-center">
        <div>
          <Flex align="center" gap="1">
            <StatusBadge status={service.status} size="1" variant="soft" />
            <Badge
              color={service?.service_type === "offer" ? "orange" : "blue"}
              variant="soft"
            >
              {service?.service_type === "offer" ? "OFFER" : "NEED"}
            </Badge>
          </Flex>
        </div>
      </div>

      {badgeSummary && badgeSummary.last_earned_badge && (
        <CustomBadge
          key={badgeSummary.last_earned_badge.key}
          badge={badgeSummary.last_earned_badge}
          size={16}
          className="absolute top-2 right-2"
        />
      )}
      <h3 className="text-xl font-bold leading-tight my-1">{service.title}</h3>

      {/* Details row */}
      <Flex align="center" gap="1" className="text-sm">
        <ClockIcon className="w-4 h-4" />
        <Text>{formatDuration(service.estimated_duration)}</Text>
        {averageRating && (
          <Flex align="center" gap="1">
            <StarFilledIcon className="w-4 h-4 ml-2" />
            {averageRating}/5 ({ratingCount} ratings)
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

      <Text size="1" className="opacity-60">
        Posted {formatDate(service.created_at)} by{" "}
        {user?.full_name || `@${user?.username || "unknown"}`}
        {service.deadline && ` | Deadline: ${formatDate(service.deadline)}`}
      </Text>
    </Card>
  );
}
