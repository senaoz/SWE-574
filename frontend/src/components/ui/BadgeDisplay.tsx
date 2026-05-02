import { useEffect, useState } from "react";
import { Card, Text, Flex, Heading, Box, Tooltip } from "@radix-ui/themes";
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
  Calendar,
  Users,
  MessageSquare,
  Sparkles,
  Link,
  Trophy,
} from "lucide-react";
import { Badge as BadgeType, BadgeSummary } from "@/types";
import { usersApi } from "@/services/api";

export const BADGE_PRIORITY: string[] = [
  "true_bee",           // True Bee
  "generous_giver",     // Queen Bee
  "veteran_scout",      // Veteran Scout
  "master_helper",      // Elite Forager
  "community_favorite", // Queen's Choice
  "cross_pollinator",   // Cross-Pollinator
  "helper_hero",        // Pollinator Bee
  "hive_dancer",        // Hive Dancer
  "popular",            // Honeycomb Star
  "helper",             // Worker Bee
  "hive_whisperer",     // Hive Whisperer
  "well_tagged",        // Nectar Expert
  "rated",              // Sweet Taste
  "first_exchange",     // Honey Maker
  "social_antenna",     // Social Antenna
  "newcomer",           // Newcomer
  "profile_complete",   // Polished Wings
  "tagged",             // Pollen Collector
];

export function getHighestPriorityBadge(badges: BadgeType[]): BadgeType | null {
  const earned = badges.filter((b) => b.earned);
  if (earned.length === 0) return null;
  return (
    BADGE_PRIORITY.map((key) => earned.find((b) => b.key === key)).find(
      Boolean
    ) ?? earned[0]
  );
}

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
  calendar: Calendar,
  users: Users,
  "message-square": MessageSquare,
  sparkles: Sparkles,
  link: Link,
  trophy: Trophy,
};

export function CustomBadge({
  badge,
  className,
  size = 24,
}: {
  badge: BadgeType;
  className?: string;
  size?: number;
}) {
  const IconComponent = ICON_MAP[badge.icon] || Award;
  return (
    <Tooltip content={badge.name} side="right">
      <Box
        className={`p-2 custom-badge-icon ${className}`}
        data-badge-key={badge.key}
      >
        <IconComponent
          size={size}
          style={{
            color: badge.earned ? "var(--lime-11)" : "var(--gray-8)",
          }}
        />
      </Box>
    </Tooltip>
  );
}

function BadgeCard({ badge }: { badge: BadgeType }) {
  const IconComponent = ICON_MAP[badge.icon] || Award;
  const progress = badge.progress;
  const progressPct = progress
    ? Math.min((progress.current / progress.target) * 100, 100)
    : 0;

  return (
    <Card
      className="p-4 transition-all border-none-card"
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
