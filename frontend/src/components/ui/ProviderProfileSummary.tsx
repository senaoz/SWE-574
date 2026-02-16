import { Card, Text, Flex, Avatar, Badge, Button } from "@radix-ui/themes";
import { User } from "@/types";
import { CheckCircledIcon, Crosshair1Icon } from "@radix-ui/react-icons";
import { useNavigate } from "react-router-dom";

interface ProviderProfileSummaryProps {
  user: User;
}

export function ProviderProfileSummary({ user }: ProviderProfileSummaryProps) {
  const navigate = useNavigate();
  const handleViewProfile = () => {
    navigate(`/user/${user._id}`);
  };

  return (
    <Card className="p-4 cursor-pointer" onClick={handleViewProfile}>
      <Flex direction="column" gap="3">
        {/* User info */}
        <Flex align="center" gap="3">
          <Avatar fallback={user.full_name?.[0] || user.username[0]} size="4" />
          <div className="flex-1 flex flex-col">
            <Text size="3" weight="bold">
              {user.full_name || user.username}
            </Text>
            <Text size="2" color="gray">
              @{user.username}
            </Text>
            {user.is_verified && (
              <Badge
                color="green"
                variant="soft"
                size="1"
                className="mt-1 w-fit"
              >
                <CheckCircledIcon className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </Flex>

        {/* Bio */}
        {user.bio && (
          <Text size="2" className="leading-relaxed">
            {user.bio}
          </Text>
        )}

        {/* Location */}
        {user.location && (
          <Flex align="center" gap="2">
            <Crosshair1Icon className="w-4 h-4" />
            <Text size="2">{user.location}</Text>
          </Flex>
        )}

        {/* Stats */}
        <div className="flex justify-between items-center border-t opacity-60 text-sm pt-2">
          <span>TimeBank Hours</span>
          <span className="font-bold">{user.timebank_balance}</span>
        </div>

        {/* Action button */}
        <Button
          variant="soft"
          size="2"
          className="w-full"
          onClick={handleViewProfile}
        >
          View Profile
        </Button>
      </Flex>
    </Card>
  );
}
