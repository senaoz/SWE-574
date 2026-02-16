import { Avatar, Text, Flex, Tooltip } from "@radix-ui/themes";
import { User } from "@/types";

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

  return (
    <Flex align="center" gap="2" wrap="wrap">
      {visibleParticipants.map((participant) => (
        <Tooltip
          key={participant._id}
          content={`${participant.full_name || participant.username}`}
        >
          <Avatar
            fallback={participant.full_name?.[0] || participant.username[0]}
            size="3"
            className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
          />
        </Tooltip>
      ))}

      {remainingCount > 0 && (
        <Tooltip content={`${remainingCount} more participants`}>
          <Avatar
            size="3"
            fallback="+"
            className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all bg-gray-100"
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
