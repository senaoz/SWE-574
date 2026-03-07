import { Card, Text, Flex, Avatar, Badge, Button } from "@radix-ui/themes";
import { BadgeSummary, User } from "@/types";
import { useNavigate } from "react-router-dom";
import { getImageUrl, usersApi } from "@/services/api";
import { useState, useEffect } from "react";
import { CheckIcon, ClockIcon, LocateIcon } from "lucide-react";

interface ProviderProfileSummaryProps {
  user: User;
}

export function ProviderProfileSummary({ user }: ProviderProfileSummaryProps) {
  const navigate = useNavigate();
  const handleViewProfile = () => {
    navigate(`/user/${user._id}`);
  };

  const [userBadges, setUserBadges] = useState<BadgeSummary | null>(null);

  useEffect(() => {
    async function fetchUserBadges() {
      const badges = await usersApi.getUserBadges(user._id);
      setUserBadges({
        badges: badges.data?.badges ?? [],
        earned_count: badges.data?.earned_count ?? 0,
        total_count: badges.data?.total_count ?? 0,
        earned_badges: badges.data?.badges.filter((b) => b.earned) ?? [],
        last_earned_badge:
          badges.data?.badges.length > 0
            ? badges.data?.badges[badges.data?.badges.length - 1]
            : null,
      });
    }
    fetchUserBadges();
  }, [user._id]);

  return (
    <Card className="p-4 cursor-pointer" onClick={handleViewProfile}>
      <Flex direction="column" gap="3">
        {/* User info */}
        <Flex align="center" gap="3">
          <Avatar
            fallback={user.full_name?.[0] || user.username[0]}
            src={getImageUrl(user.profile_picture)}
            size="4"
          />
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
                <CheckIcon className="w-3 h-3 mr-1" />
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

        <div className="grid grid-cols-2 gap-2 border-t opacity-60 text-sm pt-2">
          <div className="col-span-2 flex flex-row justify-start items-center gap-2">
            <LocateIcon className="w-4 h-4 flex-shrink-0" />
            <Text className="w-full ellipsis overflow-hidden text-ellipsis line-clamp-1">
              {user.location}
            </Text>
          </div>
          <div className="flex flex-row justify-start items-center gap-2">
            <ClockIcon className="w-4 h-4" />
            <Text>TimeBank Hours</Text>
          </div>
          <span className="text-right">{user.timebank_balance}</span>
          {userBadges?.earned_badges &&
            userBadges?.earned_badges?.length > 0 && (
              <span className="col-span-2">
                <span className="font-bold">Badges Earned:</span>{" "}
                {userBadges?.earned_badges?.map((b) => b.name).join(", ")}
              </span>
            )}
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
