import { Card, Flex, Text } from "@radix-ui/themes";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Service } from "@/types";

interface ServicesSummaryCardProps {
  services: Service[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "var(--blue-9)" },
  in_progress: { label: "In Progress", color: "var(--amber-9)" },
  completed: { label: "Completed", color: "var(--green-9)" },
  cancelled: { label: "Cancelled", color: "var(--red-9)" },
  expired: { label: "Expired", color: "var(--gray-9)" },
};

const TAG_COLORS = [
  "var(--teal-9)",
  "var(--purple-9)",
  "var(--orange-9)",
  "var(--pink-9)",
  "var(--cyan-9)",
  "var(--indigo-9)",
];

/** Returns the last N months as { key: "2024-03", label: "Mar" } objects, oldest first. */
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

export function ServicesSummaryCard({
  services,
  searchQuery,
  onSearchChange,
}: ServicesSummaryCardProps) {
  const total = services.length;
  const offers = services.filter((s) => s.service_type === "offer").length;
  const needs = services.filter((s) => s.service_type === "need").length;
  const totalHours = services.reduce(
    (sum, s) => sum + (s.estimated_duration || 0),
    0,
  );

  // Status breakdown
  const statusOrder = [
    "active",
    "in_progress",
    "completed",
    "cancelled",
    "expired",
  ];
  const statusCounts = services.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const statusSegments = statusOrder
    .filter((s) => statusCounts[s] > 0)
    .map((s) => ({
      status: s,
      count: statusCounts[s],
      pct: (statusCounts[s] / total) * 100,
      ...STATUS_CONFIG[s],
    }));

  // Tag frequency
  const tagCounts = services.reduce(
    (acc, s) => {
      s.tags?.forEach((t) => {
        const label = t.label || t.entityId;
        if (label) acc[label] = (acc[label] || 0) + 1;
      });
      return acc;
    },
    {} as Record<string, number>,
  );
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxTagCount = topTags[0]?.[1] ?? 1;
  const totalTagUsages = topTags.reduce((s, [, c]) => s + c, 0);

  // Monthly activity — last 6 months, split by offer/need
  const months = getLastMonths(6);
  const monthlyData = months.map(({ key, label }) => {
    const inMonth = services.filter((s) => s.created_at?.startsWith(key));
    return {
      label,
      offer: inMonth.filter((s) => s.service_type === "offer").length,
      need: inMonth.filter((s) => s.service_type === "need").length,
      total: inMonth.length,
    };
  });
  const maxMonthTotal = Math.max(...monthlyData.map((m) => m.total), 1);

  return (
    <Card className="p-5">
      <Flex direction="column" gap="5">
        {/* Stat pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: total, color: "var(--gray-12)" },
            { label: "Offers", value: offers, color: "var(--blue-9)" },
            { label: "Needs", value: needs, color: "var(--amber-9)" },
            {
              label: "Hours",
              value: `${totalHours}h`,
              color: "var(--green-9)",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-lg px-4 py-3"
              style={{ background: "var(--gray-a2)" }}
            >
              <Text size="1" color="gray" className="block mb-1">
                {label}
              </Text>
              <Text size="5" weight="bold" style={{ color }}>
                {value}
              </Text>
            </div>
          ))}
        </div>

        {/* Status stacked bar */}
        {statusSegments.length > 0 && (
          <div>
            <Text size="1" color="gray" className="block mb-2">
              Status breakdown
            </Text>
            <div className="flex h-3 rounded-full overflow-hidden gap-px">
              {statusSegments.map(({ status, pct, count, label, color }) => (
                <div
                  key={status}
                  title={`${label}: ${count}`}
                  style={{ width: `${pct}%`, background: color }}
                  className="transition-all duration-300"
                />
              ))}
            </div>
            <Flex gap="3" wrap="wrap" className="mt-2">
              {statusSegments.map(({ status, count, label, color }) => (
                <Flex key={status} align="center" gap="1">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: color }}
                  />
                  <Text size="1" color="gray">
                    {label} ({count})
                  </Text>
                </Flex>
              ))}
            </Flex>
          </div>
        )}

        {/* Monthly activity + Top tags — side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Monthly activity */}
          <div>
            <Flex justify="between" align="center" className="mb-3">
              <Text size="1" color="gray">
                Activity — last 6 months
              </Text>
              <Flex gap="3">
                <Flex align="center" gap="1">
                  <div
                    className="w-2 h-2 rounded-sm"
                    style={{ background: "var(--blue-9)" }}
                  />
                  <Text size="1" color="gray">
                    Offer
                  </Text>
                </Flex>
                <Flex align="center" gap="1">
                  <div
                    className="w-2 h-2 rounded-sm"
                    style={{ background: "var(--amber-9)" }}
                  />
                  <Text size="1" color="gray">
                    Need
                  </Text>
                </Flex>
              </Flex>
            </Flex>
            <div
              className="flex items-end gap-2"
              style={{ height: "calc(100% - 32px)" }}
            >
              {monthlyData.map(({ label, offer, need, total: t }) => {
                const offerPct = (offer / maxMonthTotal) * 100;
                const needPct = (need / maxMonthTotal) * 100;
                return (
                  <div
                    key={label}
                    className="flex-1 flex flex-col items-center gap-1 group relative"
                  >
                    <Text size="1" color="gray" className="leading-none">
                      {t > 0 ? t : ""}
                    </Text>
                    <div
                      className="w-full flex flex-col-reverse gap-px"
                      style={{ height: "64px" }}
                    >
                      <div
                        className="w-full rounded-t-sm transition-all duration-500"
                        style={{
                          height: `${offerPct}%`,
                          background: "var(--blue-9)",
                          opacity: offer === 0 ? 0 : 1,
                        }}
                      />
                      <div
                        className="w-full transition-all duration-500"
                        style={{
                          height: `${needPct}%`,
                          background: "var(--amber-9)",
                          opacity: need === 0 ? 0 : 1,
                        }}
                      />
                    </div>
                    <Text size="1" color="gray" className="leading-none">
                      {label}
                    </Text>
                    {/* Hover tooltip */}
                    <div
                      className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10
                                 opacity-0 group-hover:opacity-100 transition-opacity duration-150
                                 whitespace-nowrap rounded-md px-2 py-1 text-xs shadow-md"
                      style={{
                        backgroundColor: "var(--gray-12)",
                        color: "var(--gray-1)",
                      }}
                    >
                      <span style={{ color: "var(--blue-9)" }}>{offer} offers</span>
                      {" · "}
                      <span style={{ color: "var(--amber-9)" }}>{need} needs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top tags */}
          {topTags.length > 0 && (
            <div>
              <Text size="1" color="gray" className="block mb-3">
                Top tags
              </Text>
              <div className="space-y-2">
                {topTags.map(([tag, count], i) => {
                  const color = TAG_COLORS[i % TAG_COLORS.length];
                  const pct = Math.round((count / totalTagUsages) * 100);
                  return (
                    <Flex key={tag} align="center" gap="2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: color }}
                      />
                      <Text
                        size="1"
                        className="w-24 truncate flex-shrink-0"
                        title={tag}
                      >
                        {tag}
                      </Text>
                      <div className="flex-1 h-2 rounded-full overflow-hidden bg-[var(--gray-a3)]">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${(count / maxTagCount) * 100}%`,
                            background: color,
                          }}
                        />
                      </div>
                      <Text
                        size="1"
                        color="gray"
                        className="w-10 text-right flex-shrink-0 tabular-nums"
                      >
                        {count}× · {pct}%
                      </Text>
                    </Flex>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gray-9)] w-4 h-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search services by title, description or tag..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[var(--gray-a5)] bg-[var(--gray-a2)] placeholder-[var(--gray-9)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-8)]"
          />
        </div>
      </Flex>
    </Card>
  );
}
