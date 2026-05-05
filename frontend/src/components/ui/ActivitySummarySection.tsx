import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Text, Flex, Badge, Heading, Separator } from "@radix-ui/themes";
import { ArrowUpIcon, ArrowDownIcon, Cross2Icon } from "@radix-ui/react-icons";
import { Transaction, RatingDetailed } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RatingStars } from "@/components/ui/RatingStars";
import { InterestChip } from "@/components/ui/InterestChip";
import { tagToLabel } from "@/components/ui/ConfirmCompletionModal";
import { ImageGallery } from "@/components/ui/ImageGallery";
import { formatDateShort } from "@/utils/utils";

type FilterTab = "all" | "given" | "taken" | "in_progress";

interface ActivitySummarySectionProps {
  transactions: Transaction[];
  ratings: RatingDetailed[];
  currentUserId: string;
  isLoading: boolean;
}

interface EnrichedTransaction {
  tx: Transaction;
  userRole: "provider" | "requester";
  rating: RatingDetailed | null;
  monthKey: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "var(--gray-9)" },
  in_progress: { label: "In Progress", color: "var(--amber-9)" },
  completed: { label: "Completed", color: "var(--green-9)" },
  cancelled: { label: "Cancelled", color: "var(--red-9)" },
  disputed: { label: "Disputed", color: "var(--orange-9)" },
};

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> =
  {
    Reliable: {
      bg: "var(--green-a3)",
      text: "var(--green-11)",
      border: "var(--green-7)",
    },
    Trustworthy: {
      bg: "var(--green-a3)",
      text: "var(--green-11)",
      border: "var(--green-7)",
    },
    Responsible: {
      bg: "var(--green-a3)",
      text: "var(--green-11)",
      border: "var(--green-7)",
    },
    Organized: {
      bg: "var(--teal-a3)",
      text: "var(--teal-11)",
      border: "var(--teal-7)",
    },
    Prepared: {
      bg: "var(--teal-a3)",
      text: "var(--teal-11)",
      border: "var(--teal-7)",
    },
    Professional: {
      bg: "var(--blue-a3)",
      text: "var(--blue-11)",
      border: "var(--blue-7)",
    },
    Thorough: {
      bg: "var(--blue-a3)",
      text: "var(--blue-11)",
      border: "var(--blue-7)",
    },
    Hardworking: {
      bg: "var(--blue-a3)",
      text: "var(--blue-11)",
      border: "var(--blue-7)",
    },
    Efficient: {
      bg: "var(--blue-a3)",
      text: "var(--blue-11)",
      border: "var(--blue-7)",
    },
    Knowledgeable: {
      bg: "var(--indigo-a3)",
      text: "var(--indigo-11)",
      border: "var(--indigo-7)",
    },
    "Problem Solver": {
      bg: "var(--indigo-a3)",
      text: "var(--indigo-11)",
      border: "var(--indigo-7)",
    },
    "Detail-Oriented": {
      bg: "var(--indigo-a3)",
      text: "var(--indigo-11)",
      border: "var(--indigo-7)",
    },
    Creative: {
      bg: "var(--purple-a3)",
      text: "var(--purple-11)",
      border: "var(--purple-7)",
    },
    Communicative: {
      bg: "var(--cyan-a3)",
      text: "var(--cyan-11)",
      border: "var(--cyan-7)",
    },
    "Clear Communicator": {
      bg: "var(--cyan-a3)",
      text: "var(--cyan-11)",
      border: "var(--cyan-7)",
    },
    Friendly: {
      bg: "var(--violet-a3)",
      text: "var(--violet-11)",
      border: "var(--violet-7)",
    },
    Helpful: {
      bg: "var(--violet-a3)",
      text: "var(--violet-11)",
      border: "var(--violet-7)",
    },
    Kind: {
      bg: "var(--violet-a3)",
      text: "var(--violet-11)",
      border: "var(--violet-7)",
    },
    Respectful: {
      bg: "var(--violet-a3)",
      text: "var(--violet-11)",
      border: "var(--violet-7)",
    },
    Patient: {
      bg: "var(--violet-a3)",
      text: "var(--violet-11)",
      border: "var(--violet-7)",
    },
    Flexible: {
      bg: "var(--amber-a3)",
      text: "var(--amber-11)",
      border: "var(--amber-7)",
    },
    Collaborative: {
      bg: "var(--amber-a3)",
      text: "var(--amber-11)",
      border: "var(--amber-7)",
    },
    Understanding: {
      bg: "var(--amber-a3)",
      text: "var(--amber-11)",
      border: "var(--amber-7)",
    },
    Appreciative: {
      bg: "var(--amber-a3)",
      text: "var(--amber-11)",
      border: "var(--amber-7)",
    },
    "Easy to Work With": {
      bg: "var(--amber-a3)",
      text: "var(--amber-11)",
      border: "var(--amber-7)",
    },
    Punctual: {
      bg: "var(--lime-a3)",
      text: "var(--lime-11)",
      border: "var(--lime-7)",
    },
  };

function getTagColor(tag: string) {
  return (
    TAG_COLORS[tag] ?? {
      bg: "var(--gray-a3)",
      text: "var(--gray-11)",
      border: "var(--gray-6)",
    }
  );
}

// 4-segment bar colors — given = orange tones, taken = blue tones
const SEG = {
  givenOffer: "var(--orange-9)",
  givenNeed: "var(--amber-9)",
  takenOffer: "var(--blue-9)",
  takenNeed: "var(--cyan-9)",
};

function getLastMonths(n: number) {
  const months: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("default", { month: "short" });
    months.push({ key, label });
  }
  return months;
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "4px 12px",
        borderRadius: "var(--radius-full)",
        border: "1px solid",
        borderColor: active ? "var(--accent-9)" : "var(--gray-5)",
        backgroundColor: active ? "var(--accent-3)" : "transparent",
        color: active ? "var(--accent-11)" : "var(--gray-11)",
        cursor: "pointer",
        fontSize: "var(--font-size-2)",
        fontWeight: active ? "600" : "400",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

export function ActivitySummarySection({
  transactions,
  ratings,
  currentUserId,
  isLoading,
}: ActivitySummarySectionProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [serviceTypeFilter, setServiceTypeFilter] = useState<
    "offer" | "need" | null
  >(null);

  const enriched = useMemo<EnrichedTransaction[]>(() => {
    const ratingMap = new Map<string, RatingDetailed>();
    for (const r of ratings) ratingMap.set(r.transaction_id, r);
    return transactions.map((tx) => {
      const d = new Date(tx.created_at);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return {
        tx,
        userRole:
          String(tx.provider_id) === String(currentUserId)
            ? "provider"
            : "requester",
        rating: ratingMap.get(tx._id) ?? null,
        monthKey,
      };
    });
  }, [transactions, ratings, currentUserId]);

  const filtered = useMemo(() => {
    let result = enriched;
    switch (filter) {
      case "given":
        result = result.filter((e) => e.userRole === "provider");
        break;
      case "taken":
        result = result.filter((e) => e.userRole === "requester");
        break;
      case "in_progress":
        result = result.filter(
          (e) => e.tx.status === "in_progress" || e.tx.status === "pending",
        );
        break;
    }
    if (monthFilter) result = result.filter((e) => e.monthKey === monthFilter);
    if (tagFilter)
      result = result.filter((e) =>
        e.rating?.tags?.some((t) => tagToLabel(t) === tagFilter),
      );
    if (serviceTypeFilter)
      result = result.filter(
        (e) => e.rating?.service?.service_type === serviceTypeFilter,
      );
    return result;
  }, [enriched, filter, monthFilter, tagFilter, serviceTypeFilter]);

  const stats = useMemo(() => {
    const givenAll = enriched.filter((e) => e.userRole === "provider");
    const takenAll = enriched.filter((e) => e.userRole === "requester");
    const given = givenAll.filter((e) => e.tx.status === "completed");
    const taken = takenAll.filter((e) => e.tx.status === "completed");
    const ratedItems = enriched.filter((e) => e.rating !== null);
    const avgRating =
      ratedItems.length > 0
        ? ratedItems.reduce((s, e) => s + (e.rating?.score ?? 0), 0) /
          ratedItems.length
        : null;

    const givenStatusCounts = givenAll.reduce(
      (acc, e) => {
        acc[e.tx.status] = (acc[e.tx.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const takenStatusCounts = takenAll.reduce(
      (acc, e) => {
        acc[e.tx.status] = (acc[e.tx.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const givenOffers = givenAll.filter(
      (e) => e.rating?.service?.service_type === "offer",
    ).length;
    const givenNeeds = givenAll.filter(
      (e) => e.rating?.service?.service_type === "need",
    ).length;
    const takenOffers = takenAll.filter(
      (e) => e.rating?.service?.service_type === "offer",
    ).length;
    const takenNeeds = takenAll.filter(
      (e) => e.rating?.service?.service_type === "need",
    ).length;

    return {
      givenTotal: givenAll.length,
      givenHours: given.reduce((s, e) => s + e.tx.timebank_hours, 0),
      takenTotal: takenAll.length,
      takenHours: taken.reduce((s, e) => s + e.tx.timebank_hours, 0),
      avgRating,
      ratedCount: ratedItems.length,
      givenStatusCounts,
      takenStatusCounts,
      givenOffers,
      givenNeeds,
      takenOffers,
      takenNeeds,
    };
  }, [enriched]);

  // Monthly data with 4-segment breakdown
  const monthlyData = useMemo(() => {
    const months = getLastMonths(6);
    return months.map(({ key, label }) => {
      const inMonth = enriched.filter((e) => e.monthKey === key);
      const givenOffer = inMonth.filter(
        (e) =>
          e.userRole === "provider" &&
          e.rating?.service?.service_type === "offer",
      ).length;
      const givenNeed = inMonth.filter(
        (e) =>
          e.userRole === "provider" &&
          e.rating?.service?.service_type === "need",
      ).length;
      const givenUnk = inMonth.filter(
        (e) => e.userRole === "provider" && !e.rating?.service?.service_type,
      ).length;
      const takenOffer = inMonth.filter(
        (e) =>
          e.userRole === "requester" &&
          e.rating?.service?.service_type === "offer",
      ).length;
      const takenNeed = inMonth.filter(
        (e) =>
          e.userRole === "requester" &&
          e.rating?.service?.service_type === "need",
      ).length;
      const takenUnk = inMonth.filter(
        (e) => e.userRole === "requester" && !e.rating?.service?.service_type,
      ).length;
      const given = givenOffer + givenNeed + givenUnk;
      const taken = takenOffer + takenNeed + takenUnk;
      return {
        key,
        label,
        givenOffer,
        givenNeed,
        givenUnk,
        takenOffer,
        takenNeed,
        takenUnk,
        given,
        taken,
        total: given + taken,
      };
    });
  }, [enriched]);
  const maxMonthTotal = Math.max(...monthlyData.map((m) => m.total), 1);

  // Top feedback tags — clickable
  const topTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    for (const r of ratings) {
      for (const tag of r.tags ?? []) {
        const label = tagToLabel(tag);
        tagCounts[label] = (tagCounts[label] || 0) + 1;
      }
    }
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
  }, [ratings]);

  // Streak — consecutive months with at least 1 transaction
  const streak = useMemo(() => {
    const months = getLastMonths(24);
    let count = 0;
    for (let i = months.length - 1; i >= 0; i--) {
      const hasActivity = enriched.some((e) => e.monthKey === months[i].key);
      if (!hasActivity) break;
      count++;
    }
    return count;
  }, [enriched]);

  // Achievement badges
  const badges = useMemo(() => {
    const completedTx = enriched.filter((e) => e.tx.status === "completed");
    const givenCompleted = completedTx.filter((e) => e.userRole === "provider");
    const takenCompleted = completedTx.filter(
      (e) => e.userRole === "requester",
    );
    const ratedItems = enriched.filter((e) => e.rating !== null);
    const avgRating =
      ratedItems.length > 0
        ? ratedItems.reduce((s, e) => s + (e.rating?.score ?? 0), 0) /
          ratedItems.length
        : 0;
    const uniquePartners = new Set(
      enriched.map((e) =>
        e.userRole === "provider" ? e.tx.requester_id : e.tx.provider_id,
      ),
    ).size;
    return [
      {
        id: "giver",
        label: "Trusted Giver",
        desc: "Give 5 services",
        icon: "↑",
        cur: givenCompleted.length,
        max: 5,
        color: "var(--orange-9)",
      },
      {
        id: "taker",
        label: "Active Receiver",
        desc: "Receive 5 services",
        icon: "↓",
        cur: takenCompleted.length,
        max: 5,
        color: "var(--blue-9)",
      },
      {
        id: "quality",
        label: "Quality Service",
        desc: "Avg rating ≥ 4.5 stars",
        icon: "★",
        cur: avgRating,
        max: 5,
        color: "var(--amber-9)",
        asScore: true,
      },
      {
        id: "social",
        label: "Community Builder",
        desc: "Meet 5 unique people",
        icon: "♥",
        cur: uniquePartners,
        max: 5,
        color: "var(--violet-9)",
      },
      {
        id: "streak",
        label: "Consistent",
        desc: "Active 3 months in a row",
        icon: "🔥",
        cur: streak,
        max: 3,
        color: "var(--red-9)",
      },
      {
        id: "veteran",
        label: "Veteran",
        desc: "Complete 20 transactions",
        icon: "⚡",
        cur: completedTx.length,
        max: 20,
        color: "var(--green-9)",
      },
    ] as {
      id: string;
      label: string;
      desc: string;
      icon: string;
      cur: number;
      max: number;
      color: string;
      asScore?: boolean;
    }[];
  }, [enriched, streak]);

  // Top counterparties by transaction count
  const topInteractions = useMemo(() => {
    const map: Record<
      string,
      {
        id: string;
        name: string;
        count: number;
        asProvider: number;
        asRequester: number;
      }
    > = {};
    for (const { tx, userRole } of enriched) {
      const cp = userRole === "provider" ? tx.requester : tx.provider;
      if (!cp) continue;
      if (!map[cp.id])
        map[cp.id] = {
          id: cp.id,
          name: cp.full_name ?? `@${cp.username}`,
          count: 0,
          asProvider: 0,
          asRequester: 0,
        };
      map[cp.id].count++;
      if (userRole === "provider") map[cp.id].asProvider++;
      else map[cp.id].asRequester++;
    }
    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [enriched]);

  // Radar chart dimensions: given%, taken%, completed%, avgRating%, offer%, need%
  const radarDims = useMemo(() => {
    const total = enriched.length || 1;
    const completed = enriched.filter(
      (e) => e.tx.status === "completed",
    ).length;
    const given = enriched.filter((e) => e.userRole === "provider").length;
    const taken = enriched.filter((e) => e.userRole === "requester").length;
    const ratedItems = enriched.filter((e) => e.rating !== null);
    const avgRating =
      ratedItems.length > 0
        ? ratedItems.reduce((s, e) => s + (e.rating?.score ?? 0), 0) /
          ratedItems.length
        : 0;
    const offers = enriched.filter(
      (e) => e.rating?.service?.service_type === "offer",
    ).length;
    const needs = enriched.filter(
      (e) => e.rating?.service?.service_type === "need",
    ).length;
    const typed = offers + needs || 1;
    return [
      { label: "Given", value: given / total },
      { label: "Taken", value: taken / total },
      { label: "Completed", value: completed / total },
      { label: "Rated", value: Math.min(ratedItems.length / total, 1) },
      { label: "Quality", value: avgRating / 5 },
      { label: "Offers", value: offers / typed },
    ];
  }, [enriched]);

  // Credit balance trend — cumulative hours (provider=earned, requester=spent)
  const creditTrend = useMemo(() => {
    const months = getLastMonths(12);
    let cumulative = 0;
    return months.map(({ key, label }) => {
      const inMonth = enriched.filter(
        (e) => e.monthKey === key && e.tx.status === "completed",
      );
      const earned = inMonth
        .filter((e) => e.userRole === "provider")
        .reduce((s, e) => s + e.tx.timebank_hours, 0);
      const spent = inMonth
        .filter((e) => e.userRole === "requester")
        .reduce((s, e) => s + e.tx.timebank_hours, 0);
      cumulative += earned - spent;
      return { key, label, earned, spent, cumulative };
    });
  }, [enriched]);

  // 52-week heatmap data
  const heatmapData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const { tx } of enriched) {
      const d = new Date(tx.created_at);
      const key = d.toISOString().slice(0, 10);
      counts[key] = (counts[key] || 0) + 1;
    }
    // build 364-day grid starting from the Monday 51 weeks ago
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // align to Mon
    const start = new Date(today);
    start.setDate(today.getDate() - 363 - startOffset);
    const cells: {
      date: string;
      count: number;
      weekIdx: number;
      dayIdx: number;
    }[] = [];
    for (let i = 0; i < 364; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      cells.push({
        date: key,
        count: counts[key] ?? 0,
        weekIdx: Math.floor(i / 7),
        dayIdx: i % 7,
      });
    }
    return cells;
  }, [enriched]);
  const heatmapMax = Math.max(...heatmapData.map((c) => c.count), 1);

  const inProgressCount = enriched.filter(
    (e) => e.tx.status === "in_progress" || e.tx.status === "pending",
  ).length;

  const statusOrder = [
    "in_progress",
    "completed",
    "pending",
    "cancelled",
    "disputed",
  ];
  const hasActiveFilter =
    monthFilter !== null || tagFilter !== null || serviceTypeFilter !== null;

  const clearFilters = () => {
    setMonthFilter(null);
    setTagFilter(null);
    setServiceTypeFilter(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Heading size="5">Activity Summary</Heading>
        <Card className="p-6 text-center">
          <Text color="gray">Loading activity...</Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Heading size="5">Activity Summary</Heading>

      {enriched.length === 0 ? (
        <Card className="p-6 text-center">
          <Text color="gray">No activity yet</Text>
        </Card>
      ) : (
        <>
          {/* ── Streak + Badges ── */}
          <div
            className="rounded-lg px-4 py-3"
            style={{
              background: "var(--gray-a2)",
              border: "1px solid var(--gray-4)",
            }}
          >
            <Flex justify="between" align="center" wrap="wrap" gap="4">
              {/* Streak */}
              <Flex align="center" gap="3">
                <div
                  style={{
                    fontSize: 28,
                    lineHeight: 1,
                    filter:
                      streak === 0 ? "grayscale(1) opacity(0.4)" : undefined,
                  }}
                >
                  🔥
                </div>
                <div>
                  <Text size="4" weight="bold">
                    {streak}
                  </Text>
                  <Text size="1" color="gray" style={{ display: "block" }}>
                    month{streak !== 1 ? "s" : ""} streak
                  </Text>
                </div>
              </Flex>
              {/* Badges */}
              <Flex gap="3" wrap="wrap" style={{ flex: 1 }}>
                {badges.map((b) => {
                  const progress = Math.min(b.cur / b.max, 1);
                  const earned = progress >= 1;
                  return (
                    <div
                      key={b.id}
                      title={`${b.label}: ${b.desc} (${b.asScore ? b.cur.toFixed(1) : b.cur}/${b.max})`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        opacity: earned ? 1 : 0.5,
                        minWidth: 52,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: earned ? b.color : "var(--gray-4)",
                          border: `2px solid ${earned ? b.color : "var(--gray-5)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          boxShadow: earned ? `0 0 8px ${b.color}60` : "none",
                          transition: "all 0.2s",
                        }}
                      >
                        {b.icon}
                      </div>
                      <div
                        style={{
                          width: 36,
                          height: 3,
                          borderRadius: 2,
                          background: "var(--gray-4)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${progress * 100}%`,
                            height: "100%",
                            background: b.color,
                            borderRadius: 2,
                            transition: "width 0.4s",
                          }}
                        />
                      </div>
                      <Text
                        size="1"
                        color="gray"
                        style={{
                          textAlign: "center",
                          fontSize: 9,
                          lineHeight: 1.2,
                        }}
                      >
                        {b.label}
                      </Text>
                    </div>
                  );
                })}
              </Flex>
            </Flex>
          </div>

          {/* ── Charts card ── */}
          <Flex direction="column" gap="5">
            {/* Stat pills — clickable */}
            <div className="grid grid-cols-2 gap-3">
              {/* Given pill */}
              <div
                className="rounded-lg px-4 py-3 cursor-pointer transition-all"
                style={{
                  background:
                    filter === "given" ? "var(--orange-a3)" : "var(--gray-a2)",
                  outline:
                    filter === "given" ? "1.5px solid var(--orange-8)" : "none",
                }}
                onClick={() => setFilter(filter === "given" ? "all" : "given")}
                role="button"
                aria-pressed={filter === "given"}
              >
                <Text size="1" color="gray" className="block mb-1">
                  Services Given
                </Text>
                <Flex align="center" gap="2" wrap="wrap">
                  <Text size="4" weight="bold">
                    {stats.givenTotal}
                  </Text>
                  <Badge size="1" color="orange" variant="soft">
                    {stats.givenHours.toFixed(1)} hrs
                  </Badge>
                </Flex>
                {(stats.givenOffers > 0 || stats.givenNeeds > 0) && (
                  <Flex gap="3" wrap="wrap" className="mt-1">
                    {stats.givenOffers > 0 && (
                      <Flex align="center" gap="1">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: SEG.givenOffer }}
                        />
                        <Text size="1" color="gray">
                          {stats.givenOffers} Offer
                          {stats.givenOffers !== 1 ? "s" : ""}
                        </Text>
                      </Flex>
                    )}
                    {stats.givenNeeds > 0 && (
                      <Flex align="center" gap="1">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: SEG.givenNeed }}
                        />
                        <Text size="1" color="gray">
                          {stats.givenNeeds} Need
                          {stats.givenNeeds !== 1 ? "s" : ""}
                        </Text>
                      </Flex>
                    )}
                  </Flex>
                )}
                {Object.keys(stats.givenStatusCounts).length > 0 && (
                  <Flex gap="3" wrap="wrap" className="mt-2">
                    {statusOrder
                      .filter((s) => stats.givenStatusCounts[s] > 0)
                      .map((s) => (
                        <Flex key={s} align="center" gap="1">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              background:
                                STATUS_CONFIG[s]?.color ?? "var(--gray-9)",
                            }}
                          />
                          <Text size="1" color="gray">
                            {STATUS_CONFIG[s]?.label ?? s} (
                            {stats.givenStatusCounts[s]})
                          </Text>
                        </Flex>
                      ))}
                  </Flex>
                )}
              </div>

              {/* Taken pill */}
              <div
                className="rounded-lg px-4 py-3 cursor-pointer transition-all"
                style={{
                  background:
                    filter === "taken" ? "var(--blue-a3)" : "var(--gray-a2)",
                  outline:
                    filter === "taken" ? "1.5px solid var(--blue-8)" : "none",
                }}
                onClick={() => setFilter(filter === "taken" ? "all" : "taken")}
                role="button"
                aria-pressed={filter === "taken"}
              >
                <Text size="1" color="gray" className="block mb-1">
                  Services Taken
                </Text>
                <Flex align="center" gap="2" wrap="wrap">
                  <Text size="4" weight="bold">
                    {stats.takenTotal}
                  </Text>
                  <Badge size="1" color="blue" variant="soft">
                    {stats.takenHours.toFixed(1)} hrs
                  </Badge>
                </Flex>
                {(stats.takenOffers > 0 || stats.takenNeeds > 0) && (
                  <Flex gap="3" wrap="wrap" className="mt-1">
                    {stats.takenOffers > 0 && (
                      <Flex align="center" gap="1">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: SEG.takenOffer }}
                        />
                        <Text size="1" color="gray">
                          {stats.takenOffers} Offer
                          {stats.takenOffers !== 1 ? "s" : ""}
                        </Text>
                      </Flex>
                    )}
                    {stats.takenNeeds > 0 && (
                      <Flex align="center" gap="1">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: SEG.takenNeed }}
                        />
                        <Text size="1" color="gray">
                          {stats.takenNeeds} Need
                          {stats.takenNeeds !== 1 ? "s" : ""}
                        </Text>
                      </Flex>
                    )}
                  </Flex>
                )}
                {Object.keys(stats.takenStatusCounts).length > 0 && (
                  <Flex gap="3" wrap="wrap" className="mt-2">
                    {statusOrder
                      .filter((s) => stats.takenStatusCounts[s] > 0)
                      .map((s) => (
                        <Flex key={s} align="center" gap="1">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              background:
                                STATUS_CONFIG[s]?.color ?? "var(--gray-9)",
                            }}
                          />
                          <Text size="1" color="gray">
                            {STATUS_CONFIG[s]?.label ?? s} (
                            {stats.takenStatusCounts[s]})
                          </Text>
                        </Flex>
                      ))}
                  </Flex>
                )}
                {stats.avgRating !== null && (
                  <Flex align="center" gap="2" className="mt-2">
                    <RatingStars
                      value={Math.round(stats.avgRating * 10) / 10}
                      readonly
                      size={13}
                    />
                    <Text size="1" color="gray">
                      {stats.avgRating.toFixed(1)} avg ({stats.ratedCount}{" "}
                      rated)
                    </Text>
                  </Flex>
                )}
              </div>
            </div>

            {/* Monthly chart + top tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Monthly bar chart — clickable bars, 4-segment */}
              <div className="flex flex-col">
                <Flex justify="between" align="center" className="mb-2">
                  <Text size="1" color="gray">
                    Activity — last 6 months
                  </Text>
                  <Flex gap="2" wrap="wrap">
                    <Flex align="center" gap="1">
                      <div
                        className="w-2 h-2 rounded-sm"
                        style={{ background: SEG.givenOffer }}
                      />
                      <Text size="1" color="gray">
                        Given·Offer
                      </Text>
                    </Flex>
                    <Flex align="center" gap="1">
                      <div
                        className="w-2 h-2 rounded-sm"
                        style={{ background: SEG.givenNeed }}
                      />
                      <Text size="1" color="gray">
                        Given·Need
                      </Text>
                    </Flex>
                    <Flex align="center" gap="1">
                      <div
                        className="w-2 h-2 rounded-sm"
                        style={{ background: SEG.takenOffer }}
                      />
                      <Text size="1" color="gray">
                        Taken·Offer
                      </Text>
                    </Flex>
                    <Flex align="center" gap="1">
                      <div
                        className="w-2 h-2 rounded-sm"
                        style={{ background: SEG.takenNeed }}
                      />
                      <Text size="1" color="gray">
                        Taken·Need
                      </Text>
                    </Flex>
                  </Flex>
                </Flex>
                <div className="flex items-end gap-2 flex-1">
                  {monthlyData.map((m) => {
                    const isActive = monthFilter === m.key;
                    const goHeight = (m.givenOffer / maxMonthTotal) * 64;
                    const gnHeight = (m.givenNeed / maxMonthTotal) * 64;
                    const guHeight = (m.givenUnk / maxMonthTotal) * 64;
                    const toHeight = (m.takenOffer / maxMonthTotal) * 64;
                    const tnHeight = (m.takenNeed / maxMonthTotal) * 64;
                    const tuHeight = (m.takenUnk / maxMonthTotal) * 64;
                    return (
                      <div
                        key={m.key}
                        className="flex-1 flex flex-col items-center gap-1 group relative cursor-pointer"
                        onClick={() => setMonthFilter(isActive ? null : m.key)}
                        title={
                          m.total > 0 ? `${m.label}: click to filter` : m.label
                        }
                      >
                        <Text size="1" color="gray" className="leading-none">
                          {m.total > 0 ? m.total : ""}
                        </Text>
                        <div
                          className="w-full flex flex-col-reverse gap-px transition-all duration-300"
                          style={{
                            height: "64px",
                            opacity: monthFilter && !isActive ? 0.35 : 1,
                            outline: isActive
                              ? "2px solid var(--accent-9)"
                              : "none",
                            outlineOffset: "2px",
                            borderRadius: "2px",
                          }}
                        >
                          {guHeight > 0 && (
                            <div
                              className="w-full transition-all duration-500"
                              style={{
                                height: guHeight,
                                background: "var(--orange-a6)",
                              }}
                            />
                          )}
                          {gnHeight > 0 && (
                            <div
                              className="w-full transition-all duration-500"
                              style={{
                                height: gnHeight,
                                background: SEG.givenNeed,
                              }}
                            />
                          )}
                          {goHeight > 0 && (
                            <div
                              className="w-full transition-all duration-500"
                              style={{
                                height: goHeight,
                                background: SEG.givenOffer,
                              }}
                            />
                          )}
                          {tuHeight > 0 && (
                            <div
                              className="w-full transition-all duration-500"
                              style={{
                                height: tuHeight,
                                background: "var(--blue-a6)",
                              }}
                            />
                          )}
                          {tnHeight > 0 && (
                            <div
                              className="w-full transition-all duration-500"
                              style={{
                                height: tnHeight,
                                background: SEG.takenNeed,
                              }}
                            />
                          )}
                          {toHeight > 0 && (
                            <div
                              className="w-full transition-all duration-500"
                              style={{
                                height: toHeight,
                                background: SEG.takenOffer,
                              }}
                            />
                          )}
                        </div>
                        <Text
                          size="1"
                          color="gray"
                          className="leading-none"
                          style={{
                            fontWeight: isActive ? "700" : "400",
                            color: isActive ? "var(--accent-11)" : undefined,
                          }}
                        >
                          {m.label}
                        </Text>
                        {/* Hover tooltip */}
                        {m.total > 0 && (
                          <div
                            className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10
                                         opacity-0 group-hover:opacity-100 transition-opacity duration-150
                                         whitespace-nowrap rounded-md px-2 py-1.5 shadow-lg text-xs"
                            style={{
                              backgroundColor: "var(--gray-12)",
                              color: "var(--gray-1)",
                              lineHeight: 1.6,
                            }}
                          >
                            {m.given > 0 && (
                              <div style={{ color: "var(--orange-a11)" }}>
                                ▲ Given: {m.given}
                                {m.givenOffer > 0
                                  ? ` (${m.givenOffer} offer` +
                                    (m.givenNeed > 0
                                      ? ` · ${m.givenNeed} need`
                                      : "") +
                                    ")"
                                  : m.givenNeed > 0
                                    ? ` (${m.givenNeed} need)`
                                    : ""}
                              </div>
                            )}
                            {m.taken > 0 && (
                              <div style={{ color: "var(--blue-a11)" }}>
                                ▼ Taken: {m.taken}
                                {m.takenOffer > 0
                                  ? ` (${m.takenOffer} offer` +
                                    (m.takenNeed > 0
                                      ? ` · ${m.takenNeed} need`
                                      : "") +
                                    ")"
                                  : m.takenNeed > 0
                                    ? ` (${m.takenNeed} need)`
                                    : ""}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {monthFilter && (
                  <button
                    type="button"
                    onClick={() => setMonthFilter(null)}
                    className="mt-2 flex items-center gap-1 text-xs"
                    style={{
                      color: "var(--accent-11)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <Cross2Icon /> Clear month filter
                  </button>
                )}
              </div>

              {/* Top feedback tags — colorful word cloud */}
              {topTags.length > 0 && (
                <div>
                  <Text size="1" color="gray" className="block mb-3">
                    Top feedback tags
                  </Text>
                  {(() => {
                    const maxCount = Math.max(...topTags.map(([, c]) => c), 1);
                    return (
                      <Flex gap="2" wrap="wrap" align="center">
                        {topTags.map(([tag, count]) => {
                          const isActive = tagFilter === tag;
                          const col = getTagColor(tag);
                          const scale = 0.75 + (count / maxCount) * 0.55;
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() =>
                                setTagFilter(isActive ? null : tag)
                              }
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: `${3 + scale * 2}px ${8 + scale * 4}px`,
                                borderRadius: "var(--radius-full)",
                                border: "1px solid",
                                borderColor: isActive ? col.border : col.border,
                                background: isActive ? col.bg : col.bg,
                                color: col.text,
                                cursor: "pointer",
                                fontSize: `${Math.round(10 + scale * 3)}px`,
                                fontWeight: isActive ? "700" : "500",
                                opacity: isActive
                                  ? 1
                                  : 0.75 + (count / maxCount) * 0.25,
                                outline: isActive
                                  ? `2px solid ${col.border}`
                                  : "none",
                                outlineOffset: "1px",
                                transition: "all 0.15s",
                              }}
                            >
                              {tag}
                              <span
                                style={{
                                  fontSize: "9px",
                                  opacity: 0.65,
                                  fontWeight: "600",
                                }}
                              >
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </Flex>
                    );
                  })()}
                  {tagFilter && (
                    <button
                      type="button"
                      onClick={() => setTagFilter(null)}
                      className="mt-2 flex items-center gap-1 text-xs"
                      style={{
                        color: "var(--accent-11)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <Cross2Icon /> Clear tag filter
                    </button>
                  )}
                  <div className="mt-4">
                    <Text size="1" color="gray" className="block mb-2">
                      Service type
                    </Text>
                    <Flex gap="2">
                      {(["offer", "need"] as const).map((type) => {
                        const isActive = serviceTypeFilter === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() =>
                              setServiceTypeFilter(isActive ? null : type)
                            }
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "4px 10px",
                              borderRadius: "var(--radius-full)",
                              border: "1px solid",
                              borderColor: isActive
                                ? type === "offer"
                                  ? "var(--blue-8)"
                                  : "var(--orange-8)"
                                : "var(--gray-5)",
                              background: isActive
                                ? type === "offer"
                                  ? "var(--blue-a3)"
                                  : "var(--orange-a3)"
                                : "var(--gray-a2)",
                              color: isActive
                                ? type === "offer"
                                  ? "var(--blue-11)"
                                  : "var(--orange-11)"
                                : "var(--gray-11)",
                              cursor: "pointer",
                              fontSize: "var(--font-size-1)",
                              fontWeight: isActive ? "600" : "400",
                              transition: "all 0.15s",
                            }}
                          >
                            {type === "offer" ? "Offer" : "Need"}
                          </button>
                        );
                      })}
                    </Flex>
                  </div>
                </div>
              )}
            </div>
          </Flex>

          {/* ── Activity heatmap ── */}
          <div>
            <Text size="1" color="gray" className="block mb-2">
              Activity — last 52 weeks
            </Text>
            <div style={{ overflowX: "auto" }}>
              <div
                style={{ display: "flex", gap: "2px", minWidth: "fit-content" }}
              >
                {Array.from({ length: 52 }, (_, w) => (
                  <div
                    key={w}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    {Array.from({ length: 7 }, (_, d) => {
                      const cell = heatmapData[w * 7 + d];
                      if (!cell)
                        return (
                          <div key={d} style={{ width: 11, height: 11 }} />
                        );
                      const intensity =
                        cell.count === 0
                          ? 0
                          : 0.2 + (cell.count / heatmapMax) * 0.8;
                      return (
                        <div
                          key={d}
                          title={
                            cell.count > 0
                              ? `${cell.date}: ${cell.count} transaction${cell.count !== 1 ? "s" : ""}`
                              : cell.date
                          }
                          style={{
                            width: 11,
                            height: 11,
                            borderRadius: 2,
                            background:
                              cell.count === 0
                                ? "var(--gray-a3)"
                                : `rgba(var(--green-9-rgb, 48,164,108), ${intensity})`,
                            backgroundColor:
                              cell.count === 0
                                ? "var(--gray-a3)"
                                : intensity > 0.7
                                  ? "var(--green-9)"
                                  : intensity > 0.4
                                    ? "var(--green-7)"
                                    : "var(--green-5)",
                            cursor: cell.count > 0 ? "pointer" : "default",
                            transition: "opacity 0.1s",
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <Flex gap="3" align="center" className="mt-1">
                <Text size="1" color="gray">
                  Less
                </Text>
                {[
                  "var(--gray-a3)",
                  "var(--green-5)",
                  "var(--green-7)",
                  "var(--green-9)",
                ].map((bg, i) => (
                  <div
                    key={i}
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: 2,
                      backgroundColor: bg,
                    }}
                  />
                ))}
                <Text size="1" color="gray">
                  More
                </Text>
              </Flex>
            </div>
          </div>

          {/* ── Credit balance trend ── */}
          {creditTrend.some((m) => m.earned > 0 || m.spent > 0) &&
            (() => {
              const W = 480,
                H = 80,
                PAD = 16;
              const vals = creditTrend.map((m) => m.cumulative);
              const minVal = Math.min(...vals, 0);
              const maxVal = Math.max(...vals, 0);
              const range = maxVal - minVal || 1;
              const toY = (v: number) => PAD + ((maxVal - v) / range) * (H - PAD * 2);
              const toX = (i: number) =>
                PAD + (i / (creditTrend.length - 1)) * (W - PAD * 2);
              const points = creditTrend
                .map((m, i) => `${toX(i)},${toY(m.cumulative)}`)
                .join(" ");
              const zeroY = toY(0);
              const lastVal = vals[vals.length - 1];
              const lineColor = lastVal >= 0 ? "var(--green-9)" : "var(--red-9)";
              return (
                <div>
                  <Flex justify="between" align="center" className="mb-1">
                    <Text size="1" color="gray">
                      Credit balance trend — last 12 months
                    </Text>
                    <Badge
                      size="1"
                      color={lastVal >= 0 ? "green" : "red"}
                      variant="soft"
                    >
                      {lastVal >= 0 ? "+" : ""}
                      {lastVal.toFixed(1)} hrs net
                    </Badge>
                  </Flex>
                  <svg
                    width="100%"
                    viewBox={`0 0 ${W} ${H}`}
                    style={{ overflow: "visible" }}
                  >
                    <line
                      x1={PAD}
                      y1={zeroY}
                      x2={W - PAD}
                      y2={zeroY}
                      stroke="var(--gray-5)"
                      strokeWidth={1}
                      strokeDasharray="4 3"
                    />
                    <defs>
                      <linearGradient id="creditGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={lineColor} stopOpacity="0.03" />
                      </linearGradient>
                    </defs>
                    <polygon
                      points={`${toX(0)},${zeroY} ${points} ${toX(creditTrend.length - 1)},${zeroY}`}
                      fill="url(#creditGrad)"
                    />
                    <polyline
                      points={points}
                      fill="none"
                      stroke={lineColor}
                      strokeWidth={2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {creditTrend.map((m, i) => (
                      <g key={m.key}>
                        <circle
                          cx={toX(i)}
                          cy={toY(m.cumulative)}
                          r={3}
                          fill={m.cumulative >= 0 ? "var(--green-9)" : "var(--red-9)"}
                        />
                        <title>
                          {m.label}: {m.cumulative >= 0 ? "+" : ""}
                          {m.cumulative.toFixed(1)} hrs cumulative
                        </title>
                      </g>
                    ))}
                    {creditTrend
                      .filter((_, i) => i % 3 === 0 || i === creditTrend.length - 1)
                      .map((m) => {
                        const i = creditTrend.indexOf(m);
                        return (
                          <text
                            key={m.key}
                            x={toX(i)}
                            y={H - 2}
                            textAnchor="middle"
                            fontSize={9}
                            fill="var(--gray-9)"
                          >
                            {m.label}
                          </text>
                        );
                      })}
                  </svg>
                </div>
              );
            })()}

          {/* ── Radar + Top interactions ── */}
          <Flex gap="6" wrap="wrap" align="start">
            {/* ── Radar chart ── */}
            {(() => {
              const SIZE = 120,
                CX = SIZE / 2,
                CY = SIZE / 2,
                R = 48;
              const n = radarDims.length;
              const angleStep = (2 * Math.PI) / n;
              const angle = (i: number) => -Math.PI / 2 + i * angleStep;
              const pt = (i: number, r: number) => ({
                x: CX + r * Math.cos(angle(i)),
                y: CY + r * Math.sin(angle(i)),
              });
              const rings = [0.25, 0.5, 0.75, 1];
              return (
                <div style={{ maxWidth: 200 }}>
                  <Text size="1" color="gray" className="block mb-2">
                    Activity profile
                  </Text>
                  <svg
                    width={SIZE}
                    height={SIZE}
                    viewBox={`0 0 ${SIZE} ${SIZE}`}
                  >
                    {/* grid rings */}
                    {rings.map((r) => (
                      <polygon
                        key={r}
                        points={Array.from({ length: n }, (_, i) => {
                          const p = pt(i, R * r);
                          return `${p.x},${p.y}`;
                        }).join(" ")}
                        fill="none"
                        stroke="var(--gray-5)"
                        strokeWidth={0.5}
                      />
                    ))}
                    {/* spokes */}
                    {radarDims.map((_, i) => {
                      const outer = pt(i, R);
                      return (
                        <line
                          key={i}
                          x1={CX}
                          y1={CY}
                          x2={outer.x}
                          y2={outer.y}
                          stroke="var(--gray-5)"
                          strokeWidth={0.5}
                        />
                      );
                    })}
                    {/* data polygon */}
                    <polygon
                      points={radarDims
                        .map((d, i) => {
                          const p = pt(i, R * d.value);
                          return `${p.x},${p.y}`;
                        })
                        .join(" ")}
                      fill="var(--accent-a4)"
                      stroke="var(--accent-9)"
                      strokeWidth={1.5}
                    />
                    {/* dots */}
                    {radarDims.map((d, i) => {
                      const p = pt(i, R * d.value);
                      return (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r={2.5}
                          fill="var(--accent-9)"
                        />
                      );
                    })}
                    {/* labels */}
                    {radarDims.map((d, i) => {
                      const p = pt(i, R + 13);
                      return (
                        <text
                          key={i}
                          x={p.x}
                          y={p.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={7}
                          fill="var(--gray-11)"
                          fontWeight="500"
                        >
                          {d.label}
                        </text>
                      );
                    })}
                  </svg>
                </div>
              );
            })()}

            {/* ── Top interactions ── */}
            {topInteractions.length > 0 && (
              <div style={{ flex: 1, minWidth: 180 }}>
                <Text size="1" color="gray" className="block mb-2">
                  Top interactions
                </Text>
                <Flex direction="column" gap="2">
                  {topInteractions.map((cp) => (
                    <Flex
                      key={cp.id}
                      align="center"
                      gap="2"
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/user/${cp.id}`)}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "var(--accent-a4)",
                          border: "1px solid var(--accent-6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: "700",
                          color: "var(--accent-11)",
                          flexShrink: 0,
                        }}
                      >
                        {cp.name.replace("@", "").slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          size="2"
                          style={{
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {cp.name}
                        </Text>
                        <Text size="1" color="gray">
                          {cp.count} transaction{cp.count !== 1 ? "s" : ""}
                          {cp.asProvider > 0 &&
                            cp.asRequester > 0 &&
                            ` · ${cp.asProvider}↑ ${cp.asRequester}↓`}
                        </Text>
                      </div>
                      <Badge size="1" color="gray" variant="soft">
                        {cp.count}
                      </Badge>
                    </Flex>
                  ))}
                </Flex>
              </div>
            )}
          </Flex>

          {/* ── Filter tabs + active-filter indicator ── */}
          <Flex gap="2" wrap="wrap" align="center">
            {[
              {
                value: "all" as FilterTab,
                label: "All",
                count: enriched.length,
              },
              {
                value: "given" as FilterTab,
                label: "Services Given",
                count: stats.givenTotal,
              },
              {
                value: "taken" as FilterTab,
                label: "Services Taken",
                count: stats.takenTotal,
              },
              ...(inProgressCount > 0
                ? [
                    {
                      value: "in_progress" as FilterTab,
                      label: "In Progress",
                      count: inProgressCount,
                    },
                  ]
                : []),
            ].map((tab) => (
              <PillButton
                key={tab.value}
                active={filter === tab.value}
                onClick={() => setFilter(tab.value)}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span style={{ marginLeft: 6, opacity: 0.7 }}>
                    {tab.count}
                  </span>
                )}
              </PillButton>
            ))}
            {hasActiveFilter && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs px-3 py-1 rounded-full"
                style={{
                  background: "var(--accent-a3)",
                  color: "var(--accent-11)",
                  border: "1px solid var(--accent-7)",
                  cursor: "pointer",
                  fontSize: "var(--font-size-1)",
                }}
              >
                <Cross2Icon />
                {[monthFilter, tagFilter, serviceTypeFilter].filter(Boolean)
                  .length > 1
                  ? "Clear filters"
                  : monthFilter
                    ? "Clear month"
                    : tagFilter
                      ? "Clear tag"
                      : "Clear type"}
              </button>
            )}
            {filtered.length !== enriched.length && (
              <Text size="1" color="gray">
                Showing {filtered.length} of {enriched.length}
              </Text>
            )}
          </Flex>

          {/* ── Activity list ── */}
          {filtered.length === 0 ? (
            <Card className="p-6 text-center">
              <Text color="gray">No activity matches these filters</Text>
            </Card>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {filtered.map(({ tx, userRole, rating, monthKey: _mk }) => {
                const isProvider = userRole === "provider";
                const counterparty = isProvider ? tx.requester : tx.provider;
                const serviceTitle =
                  tx.service?.title ?? rating?.service?.title ?? null;
                const serviceId = tx.service?.id ?? rating?.service?.id ?? null;
                const date = tx.completed_at ?? tx.updated_at ?? tx.created_at;
                const serviceType = rating?.service?.service_type;

                return (
                  <Card key={tx._id} className="p-4">
                    <Flex direction="column" gap="3">
                      {/* Header */}
                      <Flex justify="between" align="start" wrap="wrap" gap="2">
                        <Flex align="center" gap="2" wrap="wrap">
                          {isProvider ? (
                            <Flex align="center" gap="1">
                              <ArrowUpIcon
                                style={{ color: "var(--lime-11)" }}
                              />
                              <Text
                                size="2"
                                weight="bold"
                                style={{ color: "var(--lime-11)" }}
                              >
                                You provided
                              </Text>
                            </Flex>
                          ) : (
                            <Flex align="center" gap="1">
                              <ArrowDownIcon
                                style={{ color: "var(--red-9)" }}
                              />
                              <Text
                                size="2"
                                weight="bold"
                                style={{ color: "var(--red-9)" }}
                              >
                                You received
                              </Text>
                            </Flex>
                          )}
                          {serviceType && (
                            <Text
                              size="2"
                              weight="bold"
                              style={{
                                color:
                                  serviceType === "offer"
                                    ? "var(--blue-11)"
                                    : "var(--orange-11)",
                              }}
                            >
                              - {serviceType === "offer" ? "Offer" : "Need"}
                            </Text>
                          )}
                          {serviceId ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/service/${serviceId}`)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                                textDecoration: "underline",
                                textDecorationColor: "var(--gray-6)",
                                color: "var(--gray-12)",
                                fontSize: "var(--font-size-3)",
                                fontWeight: "600",
                              }}
                            >
                              {serviceTitle ?? "Untitled Service"}
                            </button>
                          ) : (
                            <Text size="3" weight="bold">
                              {serviceTitle ?? "Untitled Service"}
                            </Text>
                          )}

                          {/* Counterparty + date */}
                          <Flex align="center" gap="2" wrap="wrap">
                            {counterparty && (
                              <>
                                <Text size="1" color="gray">
                                  {isProvider ? "with" : "from"}
                                </Text>
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/user/${counterparty.id}`)
                                  }
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    color: "var(--gray-11)",
                                    fontSize: "var(--font-size-1)",
                                    textDecoration: "underline",
                                    textDecorationColor: "var(--gray-5)",
                                  }}
                                >
                                  {counterparty.full_name ??
                                    `@${counterparty.username}`}
                                </button>
                              </>
                            )}
                            <Text size="1" color="gray">
                              ·
                            </Text>
                            <Text size="1" color="gray">
                              {formatDateShort(date)}
                            </Text>
                          </Flex>
                        </Flex>

                        <Flex align="center" gap="2">
                          <Badge size="1" color="gray" variant="soft">
                            {tx.timebank_hours} hr
                            {tx.timebank_hours !== 1 ? "s" : ""}
                          </Badge>
                          <StatusBadge status={tx.status} size="1" />
                        </Flex>
                      </Flex>

                      {/* Rating */}
                      {rating ? (
                        <>
                          <Separator size="4" />
                          <Flex direction="column" gap="2">
                            <Flex align="center" gap="2" wrap="wrap">
                              <RatingStars
                                value={rating.score}
                                readonly
                                size={14}
                              />
                              {rating.rater && (
                                <Text size="1" color="gray">
                                  from{" "}
                                  {rating.rater.full_name ??
                                    `@${rating.rater.username}`}
                                </Text>
                              )}
                            </Flex>
                            {rating.comment && (
                              <Text size="2" color="gray">
                                "{rating.comment}"
                              </Text>
                            )}
                            {rating.tags && rating.tags.length > 0 && (
                              <Flex gap="1" wrap="wrap">
                                {rating.tags.map((tag) => (
                                  <InterestChip
                                    key={tag}
                                    name={tagToLabel(tag)}
                                    selected={tagFilter === tagToLabel(tag)}
                                    size="sm"
                                    showIcon={false}
                                  />
                                ))}
                              </Flex>
                            )}
                            {rating.image_urls &&
                              rating.image_urls.length > 0 && (
                                <ImageGallery
                                  urls={rating.image_urls}
                                  alt="Feedback photo"
                                />
                              )}
                          </Flex>
                        </>
                      ) : tx.status === "completed" ? (
                        <Text
                          size="1"
                          color="gray"
                          style={{ fontStyle: "italic" }}
                        >
                          No feedback yet
                        </Text>
                      ) : null}
                    </Flex>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
