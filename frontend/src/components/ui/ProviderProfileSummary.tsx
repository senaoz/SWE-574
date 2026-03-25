import { Card, Text, Flex, Avatar, Badge, Button } from "@radix-ui/themes";
import { BadgeSummary, User } from "@/types";
import { useNavigate } from "react-router-dom";
import { getImageUrl, usersApi, ratingsApi } from "@/services/api";
import { useState, useEffect } from "react";
import { CheckIcon, ClockIcon, LocateIcon, StarIcon } from "lucide-react";
import { CustomBadge, getHighestPriorityBadge } from "./BadgeDisplay";

interface ProviderProfileSummaryProps {
  user: User;
}

export function ProviderProfileSummary({ user }: ProviderProfileSummaryProps) {
  const navigate = useNavigate();
  const handleViewProfile = () => {
    navigate(`/user/${user._id}`);
  };

  const [userBadges, setUserBadges] = useState<BadgeSummary | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);

  useEffect(() => {
    async function fetchUserData() {
      const [badgesRes, ratingsRes] = await Promise.all([
        usersApi.getUserBadges(user._id).catch(() => ({ data: null })),
        ratingsApi.getUserRatings(user._id, 1, 1).catch(() => ({
          data: { total: 0, average_score: null },
        })),
      ]);
      const earnedBadges = badgesRes.data?.badges.filter((b) => b.earned) ?? [];
      setUserBadges({
        badges: badgesRes.data?.badges ?? [],
        earned_count: badgesRes.data?.earned_count ?? 0,
        total_count: badgesRes.data?.total_count ?? 0,
        earned_badges: earnedBadges,
        last_earned_badge: getHighestPriorityBadge(earnedBadges),
      });
      setAverageRating(ratingsRes.data?.average_score ?? null);
      setRatingCount(ratingsRes.data?.total ?? 0);
    }
    fetchUserData();
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
            <Flex align="center" gap="2">
              <Text size="3" weight="bold">
                {user.full_name || user.username}
              </Text>
              {userBadges?.last_earned_badge && (
                <CustomBadge badge={userBadges.last_earned_badge} size={16} />
              )}
            </Flex>
            <Text size="2" color="gray">
              @{user.username}
            </Text>
            <Flex align="center" gap="1" className="mt-1">
              <StarIcon className="w-3 h-3 text-yellow-500" />
              {averageRating != null ? (
                <Text size="1">
                  {averageRating.toFixed(1)} ({ratingCount} rating{ratingCount !== 1 ? "s" : ""})
                </Text>
              ) : (
                <Text size="1" color="gray">Not rated</Text>
              )}
            </Flex>
            {user.is_verified && (
              <Badge
                color="green"
                variant="soft"
                size="1"
                className="mt-1 w-fit"
              >
                <CheckIcon className="w-3 h-3" />
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
