import { Card, Text, Flex, Badge, Box, Heading } from "@radix-ui/themes";
import { Link } from "react-router-dom";
import { TimeBankTransaction, TimeBankResponse } from "@/types";

interface MyTimebankTabProps {
  timebankData: TimeBankResponse | null;
  timebankLoading: boolean;
}

function OfferNeedChart({ transactions }: { transactions: TimeBankTransaction[] }) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recent = transactions.filter(
    (t) => new Date(t.created_at) >= thirtyDaysAgo,
  );

  const offerTxns = recent.filter((t) => t.amount > 0);
  const needTxns = recent.filter((t) => t.amount < 0);
  const offerHours = offerTxns.reduce((sum, t) => sum + t.amount, 0);
  const needHours = needTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalHours = offerHours + needHours;

  if (recent.length === 0) {
    return (
      <Text size="2" color="gray">
        No activity in the last 30 days.
      </Text>
    );
  }

  const offerPct = totalHours > 0 ? (offerHours / totalHours) * 100 : 50;
  const needPct = totalHours > 0 ? (needHours / totalHours) * 100 : 50;

  return (
    <div className="space-y-3" role="img" aria-label="Offer vs Need distribution for the last 30 days">
      {/* Offer row */}
      <div>
        <Flex justify="between" mb="1">
          <Flex align="center" gap="2">
            <span
              style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "var(--green-9)", display: "inline-block" }}
              aria-hidden="true"
            />
            <Text size="2" weight="medium">Offered</Text>
            <Text size="1" color="gray">({offerTxns.length} transaction{offerTxns.length !== 1 ? "s" : ""})</Text>
          </Flex>
          <Text size="2" weight="bold">{offerHours.toFixed(1)} hrs</Text>
        </Flex>
        <div
          style={{ height: 12, backgroundColor: "var(--gray-3)", borderRadius: 6, overflow: "hidden" }}
          role="progressbar"
          aria-valuenow={Math.round(offerPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Offered: ${offerHours.toFixed(1)} hours`}
        >
          <div
            style={{
              width: `${offerPct}%`,
              height: "100%",
              backgroundColor: "var(--green-9)",
              borderRadius: 6,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* Need row */}
      <div>
        <Flex justify="between" mb="1">
          <Flex align="center" gap="2">
            <span
              style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "var(--amber-9)", display: "inline-block" }}
              aria-hidden="true"
            />
            <Text size="2" weight="medium">Needed</Text>
            <Text size="1" color="gray">({needTxns.length} transaction{needTxns.length !== 1 ? "s" : ""})</Text>
          </Flex>
          <Text size="2" weight="bold">{needHours.toFixed(1)} hrs</Text>
        </Flex>
        <div
          style={{ height: 12, backgroundColor: "var(--gray-3)", borderRadius: 6, overflow: "hidden" }}
          role="progressbar"
          aria-valuenow={Math.round(needPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Needed: ${needHours.toFixed(1)} hours`}
        >
          <div
            style={{
              width: `${needPct}%`,
              height: "100%",
              backgroundColor: "var(--amber-9)",
              borderRadius: 6,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      <Text size="1" color="gray">
        {recent.length} transaction{recent.length !== 1 ? "s" : ""} · last 30 days
      </Text>
    </div>
  );
}

export function MyTimebankTab({
  timebankData,
  timebankLoading,
}: MyTimebankTabProps) {
  return (
    <Box>
      <Heading size="5" mb="4">
        TimeBank Transaction Logs
      </Heading>
      {timebankLoading ? (
        <Text size="2" color="gray" className="text-center py-8">
          Loading transaction logs...
        </Text>
      ) : timebankData && timebankData.transactions.length > 0 ? (
        <div className="space-y-4">
          {/* Offer / Need chart */}
          <Card size="2">
            <Heading size="3" mb="3">
              Offer / Need — Last 30 Days
            </Heading>
            <OfferNeedChart transactions={timebankData.transactions} />
          </Card>

          {/* Transaction list */}
          <div className="space-y-3">
            {timebankData.transactions.map((transaction: TimeBankTransaction) => (
              <Card key={transaction.id} className="p-3">
                <Flex justify="between" align="center">
                  <div className="flex-1 flex flex-col gap-2">
                    {transaction.service_id ? (
                      <Link
                        to={`/service/${transaction.service_id}`}
                        className="text-sm font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {transaction.description}
                      </Link>
                    ) : (
                      <Text size="2" weight="medium" className="block mb-1">
                        {transaction.description}
                      </Text>
                    )}
                    <Text size="1" color="gray">
                      {new Date(transaction.created_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </Text>
                  </div>
                  <Badge
                    color={transaction.amount > 0 ? "green" : "red"}
                    size="2"
                  >
                    {transaction.amount > 0 ? "+" : ""}
                    {transaction.amount.toFixed(1)} hours
                  </Badge>
                </Flex>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Text size="2" color="gray" className="text-center py-8">
          No TimeBank transactions yet. Complete services to see transaction
          logs.
        </Text>
      )}
    </Box>
  );
}
