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
  const [serviceTypeFilter, setServiceTypeFilter] = useState<"offer" | "need" | null>(null);

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
        (e) =>
          e.tx.service?.service_type === serviceTypeFilter ||
          e.rating?.service?.service_type === serviceTypeFilter,
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
      .slice(0, 6);
  }, [ratings]);

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
  const hasActiveFilter = monthFilter !== null || tagFilter !== null || serviceTypeFilter !== null;

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
              <div>
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
                <div className="flex items-end gap-2">
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

              {/* Top feedback tags — badge chips */}
              {topTags.length > 0 && (
                <div>
                  <Text size="1" color="gray" className="block mb-3">
                    Top feedback tags
                  </Text>
                  <Flex gap="2" wrap="wrap">
                    {topTags.map(([tag, count]) => {
                      const isActive = tagFilter === tag;
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setTagFilter(isActive ? null : tag)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 10px",
                            borderRadius: "var(--radius-full)",
                            border: "1px solid",
                            borderColor: isActive
                              ? "var(--accent-9)"
                              : "var(--gray-5)",
                            background: isActive
                              ? "var(--accent-3)"
                              : "var(--gray-a2)",
                            color: isActive
                              ? "var(--accent-11)"
                              : "var(--gray-11)",
                            cursor: "pointer",
                            fontSize: "var(--font-size-1)",
                            fontWeight: isActive ? "600" : "400",
                            transition: "all 0.15s",
                          }}
                        >
                          {tag}
                          <span
                            style={{
                              fontSize: "10px",
                              opacity: 0.7,
                              fontWeight: "500",
                            }}
                          >
                            ×{count}
                          </span>
                        </button>
                      );
                    })}
                  </Flex>
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
                {[monthFilter, tagFilter, serviceTypeFilter].filter(Boolean).length > 1
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
