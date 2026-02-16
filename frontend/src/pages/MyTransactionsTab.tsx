import { Card, Text, Flex, Badge, Button } from "@radix-ui/themes";
import { Transaction } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CheckCircledIcon } from "@radix-ui/react-icons";

interface MyTransactionsTabProps {
  transactions: Transaction[];
  currentUserId: string | null;
  onConfirmTransactionCompletion: (transactionId: string) => Promise<void>;
  onCancelTransaction: (transactionId: string) => Promise<void>;
  onStartChat: (transactionId: string) => Promise<void>;
  formatDate: (dateString: string) => string;
}

export function MyTransactionsTab({
  transactions,
  currentUserId,
  onConfirmTransactionCompletion,
  onCancelTransaction,
  onStartChat,
  formatDate,
}: MyTransactionsTabProps) {
  if (transactions.length === 0) {
    return (
      <Card className="p-8">
        <Text size="3" color="gray" className="text-center">
          You don't have any transactions yet.
        </Text>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <Card key={transaction._id} className="p-4">
          <Flex direction="column" gap="3">
            <Flex justify="between" align="start">
              <div className="flex-1">
                <Text size="3" weight="bold" className="block mb-2">
                  {transaction.description || "Service Exchange"}
                </Text>
                <Text size="2" color="gray" className="block mb-2">
                  {formatDate(transaction.created_at)}
                </Text>
                <Flex align="center" gap="2">
                  <Badge color="blue">{transaction.timebank_hours} hours</Badge>
                  <StatusBadge status={transaction.status} size="1" />
                </Flex>
              </div>
            </Flex>

            {/* Transaction completion confirmation */}
            {transaction.status === "pending" && (
              <Card
                className="p-3"
                style={{ backgroundColor: "var(--yellow-2)" }}
              >
                <Flex direction="column" gap="3">
                  <Text size="2" weight="bold">
                    Transaction Completion Confirmation
                  </Text>
                  <Text size="1" color="gray">
                    Both parties must confirm completion before TimeBank logs
                    are created.
                  </Text>
                  <Flex gap="4" wrap="wrap">
                    <Flex direction="column" gap="1">
                      <Text size="1" weight="medium">
                        Provider Confirmation:
                      </Text>
                      <Badge
                        color={
                          transaction.provider_confirmed ? "green" : "gray"
                        }
                        size="1"
                      >
                        {transaction.provider_confirmed
                          ? "Confirmed"
                          : "Pending"}
                      </Badge>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="1" weight="medium">
                        Requester Confirmation:
                      </Text>
                      <Badge
                        color={
                          transaction.requester_confirmed ? "green" : "gray"
                        }
                        size="1"
                      >
                        {transaction.requester_confirmed
                          ? "Confirmed"
                          : "Pending"}
                      </Badge>
                    </Flex>
                  </Flex>
                  {(transaction.provider_id === currentUserId &&
                    !transaction.provider_confirmed) ||
                  (transaction.requester_id === currentUserId &&
                    !transaction.requester_confirmed) ? (
                    <Flex gap="2" justify="end">
                      <Button
                        size="1"
                        color="green"
                        onClick={() =>
                          onConfirmTransactionCompletion(transaction._id)
                        }
                      >
                        <CheckCircledIcon className="w-3 h-3 mr-1" />
                        Confirm Completion
                      </Button>
                    </Flex>
                  ) : (
                    <Text size="1" color="gray">
                      Waiting for the other party to confirm...
                    </Text>
                  )}
                </Flex>
              </Card>
            )}

            {transaction.completion_notes && (
              <div>
                <Text size="2" weight="medium" className="block mb-1">
                  Completion Notes:
                </Text>
                <Text size="2" className="italic">
                  "{transaction.completion_notes}"
                </Text>
              </div>
            )}

            {transaction.status === "completed" && (
              <Card
                className="p-3"
                style={{ backgroundColor: "var(--green-2)" }}
              >
                <Flex align="center" gap="2">
                  <CheckCircledIcon className="w-4 h-4" color="green" />
                  <Text size="2" weight="medium">
                    Transaction completed! Both parties confirmed. TimeBank logs
                    have been created.
                  </Text>
                </Flex>
              </Card>
            )}

            {transaction.status === "pending" && (
              <Flex gap="2">
                <Button
                  size="1"
                  color="blue"
                  variant="outline"
                  onClick={() => onStartChat(transaction._id)}
                >
                  Start Chat
                </Button>
                <Button
                  size="1"
                  color="red"
                  variant="outline"
                  onClick={() => onCancelTransaction(transaction._id)}
                >
                  Cancel
                </Button>
              </Flex>
            )}
          </Flex>
        </Card>
      ))}
    </div>
  );
}
