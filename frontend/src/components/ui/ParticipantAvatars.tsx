import { Avatar, Text, Flex, Tooltip } from "@radix-ui/themes";
import { User } from "@/types";
import { getImageUrl } from "@/services/api";
import { useNavigate } from "react-router-dom";

interface ParticipantAvatarsProps {
  participants: User[];
  maxVisible?: number;
}

export function ParticipantAvatars({
  participants,
  maxVisible = 5,
}: ParticipantAvatarsProps) {
  const visibleParticipants = participants.slice(0, maxVisible);
  const remainingCount = participants.length - maxVisible;
  const navigate = useNavigate();

  return (
    <Flex align="center" gap="2" wrap="wrap">
      {visibleParticipants.map((participant) => (
        <Tooltip
          key={participant._id}
          content={`${participant.full_name || participant.username}`}
        >
          <button
            type="button"
            onClick={() => navigate(`/user/${participant._id}`)}
            className="cursor-pointer rounded-full p-0 border-0 bg-transparent hover:opacity-90 transition-all"
            aria-label={`View ${participant.full_name || participant.username}`}
          >
            <Avatar
              src={getImageUrl(participant.profile_picture) ?? undefined}
              fallback={participant.full_name?.[0] || participant.username[0]}
              size="3"
              className="transition-all"
            />
          </button>
        </Tooltip>
      ))}

      {remainingCount > 0 && (
        <Tooltip content={`${remainingCount} more participants`}>
          <Avatar
            size="3"
            fallback="+"
            className="cursor-pointer transition-all bg-gray-100"
          >
            <Text size="2" weight="bold" color="gray">
              +{remainingCount}
            </Text>
          </Avatar>
        </Tooltip>
      )}
    </Flex>
  );
}
