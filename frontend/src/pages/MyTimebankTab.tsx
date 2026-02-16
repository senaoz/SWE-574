import { Card, Text, Flex, Badge, Box, Heading } from "@radix-ui/themes";
import { TimeBankTransaction, TimeBankResponse } from "@/types";

interface MyTimebankTabProps {
  timebankData: TimeBankResponse | null;
  timebankLoading: boolean;
}

export function MyTimebankTab({
  timebankData,
  timebankLoading,
}: MyTimebankTabProps) {
  return (
    <Box className="col-span-2">
      <Card size="4" className="p-6">
        <Heading size="5" mb="4">
          TimeBank Transaction Logs
        </Heading>
        {timebankLoading ? (
          <Text size="2" color="gray" className="text-center py-8">
            Loading transaction logs...
          </Text>
        ) : timebankData && timebankData.transactions.length > 0 ? (
          <div className="space-y-3">
            {timebankData.transactions.map(
              (transaction: TimeBankTransaction) => (
                <Card key={transaction.id} className="p-3">
                  <Flex justify="between" align="center">
                    <div className="flex-1">
                      <Text size="2" weight="medium" className="block mb-1">
                        {transaction.description}
                      </Text>
                      <Text size="1" color="gray">
                        {new Date(transaction.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
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
              )
            )}
          </div>
        ) : (
          <Text size="2" color="gray" className="text-center py-8">
            No TimeBank transactions yet. Complete services to see transaction
            logs.
          </Text>
        )}
      </Card>
    </Box>
  );
}
