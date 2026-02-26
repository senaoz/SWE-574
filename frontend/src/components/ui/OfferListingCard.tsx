import { Card, Badge, Text, Flex } from "@radix-ui/themes";
import { Service } from "@/types";
import { useNavigate } from "react-router-dom";
import { ClickableTag } from "@/components/ui/ClickableTag";
import {
  ClockIcon,
  Crosshair1Icon,
  CalendarIcon,
  PersonIcon,
} from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { usersApi } from "@/services/api";
import { StatusBadge } from "./StatusBadge";

export function OfferListingCard({ service }: { service: Service }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    async function fetchUser() {
      if (!service.user_id) return;
      try {
        const res = await usersApi.getUserById(service.user_id);
        setUser(res.data);
      } catch (err) {
        setUser(null);
      }
    }
    fetchUser();
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
      className="hover-card flex flex-col h-full gap-2"
      onClick={handleCardClick}
    >
      {/* Header with title and status */}
      <div className="flex gap-2 flex-wrap">
        <StatusBadge status={service.status} size="1" variant="soft" />
        <Badge
          color={service?.service_type === "offer" ? "purple" : "blue"}
          variant="soft"
        >
          {service?.service_type === "offer" ? "OFFER" : "NEED"}
        </Badge>
        <Badge color="yellow" variant="soft">
          {service?.category}
        </Badge>
      </div>
      <Text size="1" className="opacity-60">
        Posted {formatDate(service.created_at)}
      </Text>
      <h3 className="text-lg font-bold leading-tight">{service.title}</h3>

      {/* Details row */}
      <Flex align="center" gap="1">
        <ClockIcon className="w-4 h-4" />
        <Text size="2">{formatDuration(service.estimated_duration)}</Text>
      </Flex>
      <Flex align="center" gap="1">
        <Crosshair1Icon className="w-4 h-4" />
        <Text
          size="2"
          className="whitespace-nowrap overflow-hidden text-ellipsis"
        >
          {service.is_remote ? "Remote" : service?.location?.address}
        </Text>
      </Flex>
      <Flex align="center" gap="1">
        <PersonIcon className="w-4 h-4" />
        <Text size="2">
          {user?.full_name || `@${user?.username || "unknown"}`}
        </Text>
      </Flex>

      {service.tags?.length > 0 && (
        <Flex wrap="wrap" gap="1" onClick={(e) => e.stopPropagation()}>
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

      {/* Deadline info */}
      {service.deadline && (
        <Flex align="center" gap="1">
          <CalendarIcon className="w-4 h-4" />
          <Text size="2" weight="bold">
            Deadline: {formatDate(service.deadline)}
          </Text>
        </Flex>
      )}
    </Card>
  );
}
