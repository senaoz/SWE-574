import { useEffect, useState } from "react";
import { Card, Text, Flex, Heading, Box } from "@radix-ui/themes";
import {
  UserPlus,
  Image,
  Tag,
  Tags,
  Star,
  TrendingUp,
  Heart,
  Shield,
  Award,
  Clock,
  Activity,
} from "lucide-react";
import { Badge as BadgeType, BadgeSummary } from "@/types";
import { usersApi } from "@/services/api";

const ICON_MAP: Record<string, React.ElementType> = {
  "user-plus": UserPlus,
  image: Image,
  tag: Tag,
  tags: Tags,
  star: Star,
  "trending-up": TrendingUp,
  heart: Heart,
  handshake: Activity,
  shield: Shield,
  award: Award,
  clock: Clock,
};

function BadgeCard({ badge }: { badge: BadgeType }) {
  const IconComponent = ICON_MAP[badge.icon] || Award;
  const progress = badge.progress;
  const progressPct = progress
    ? Math.min((progress.current / progress.target) * 100, 100)
    : 0;

  return (
    <Card
      className="p-4 transition-all"
      style={{
        opacity: badge.earned ? 1 : 0.55,
        borderColor: badge.earned ? "var(--lime-8)" : undefined,
        borderWidth: badge.earned ? 2 : 1,
      }}
    >
      <Flex direction="column" align="center" gap="2">
        <div
          className="rounded-full p-3"
          style={{
            backgroundColor: badge.earned ? "var(--lime-3)" : "var(--gray-3)",
          }}
        >
          <IconComponent
            size={24}
            style={{
              color: badge.earned ? "var(--lime-11)" : "var(--gray-8)",
            }}
          />
        </div>
        <Text
          size="2"
          weight="bold"
          align="center"
          style={{ color: badge.earned ? "var(--lime-11)" : undefined }}
        >
          {badge.name}
        </Text>
        <Text size="1" color="gray" align="center">
          {badge.description}
        </Text>
        {!badge.earned && progress && progress.target > 1 && (
          <div className="w-full mt-1">
            <div
              className="w-full rounded-full h-1.5"
              style={{ backgroundColor: "var(--gray-4)" }}
            >
              <div
                className="rounded-full h-1.5 transition-all"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: "var(--lime-9)",
                }}
              />
            </div>
            <Text size="1" color="gray" align="center" className="block mt-1">
              {progress.current}/{progress.target}
            </Text>
          </div>
        )}
        {badge.earned && (
          <Text size="1" style={{ color: "var(--lime-11)" }} weight="medium">
            Earned
          </Text>
        )}
      </Flex>
    </Card>
  );
}

interface BadgeDisplayProps {
  userId?: string;
}

export function BadgeDisplay({ userId }: BadgeDisplayProps) {
  const [badgeSummary, setBadgeSummary] = useState<BadgeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const response = userId
          ? await usersApi.getUserBadges(userId)
          : await usersApi.getBadges();
        setBadgeSummary(response.data);
      } catch (error) {
        console.error("Error fetching badges:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBadges();
  }, [userId]);

  if (loading) {
    return (
      <Card className="p-6">
        <Text color="gray">Loading badges...</Text>
      </Card>
    );
  }

  if (!badgeSummary) return null;

  return (
    <Box>
      <Card size="4" className="p-6">
        <Flex justify="between" align="center" mb="4">
          <Heading size="5">Badges</Heading>
          <Text size="2" color="gray">
            {badgeSummary.earned_count} of {badgeSummary.total_count} badges
            earned
          </Text>
        </Flex>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {badgeSummary.badges.map((badge) => (
            <BadgeCard key={badge.key} badge={badge} />
          ))}
        </div>
      </Card>
    </Box>
  );
}
