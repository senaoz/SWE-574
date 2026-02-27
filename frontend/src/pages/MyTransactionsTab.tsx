import { useState, useEffect } from "react";
import { Card, Text, Flex, Badge, Button } from "@radix-ui/themes";
import { Transaction, Rating } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CheckCircledIcon } from "@radix-ui/react-icons";
import { RatingForm, RatingStars } from "@/components/ui/RatingStars";
import { ratingsApi } from "@/services/api";

interface MyTransactionsTabProps {
  transactions: Transaction[];
  currentUserId: string | null;
  requiresNeedCreation?: boolean;
  onConfirmTransactionCompletion: (transactionId: string) => Promise<void>;
  onCancelTransaction: (transactionId: string) => Promise<void>;
  onStartChat: (transactionId: string) => Promise<void>;
  formatDate: (dateString: string) => string;
}

export function MyTransactionsTab({
  transactions,
  currentUserId,
  requiresNeedCreation = false,
  onConfirmTransactionCompletion,
  onCancelTransaction,
  onStartChat,
  formatDate,
}: MyTransactionsTabProps) {
  const [transactionRatings, setTransactionRatings] = useState<Record<string, Rating[]>>({});
  const [ratingLoading, setRatingLoading] = useState<string | null>(null);

  useEffect(() => {
    const completedTxns = transactions.filter((t) => t.status === "completed");
    completedTxns.forEach(async (t) => {
      try {
        const res = await ratingsApi.getTransactionRatings(t._id);
        setTransactionRatings((prev) => ({ ...prev, [t._id]: res.data }));
      } catch {
        // ratings not available yet
      }
    });
  }, [transactions]);

  const handleRatingSubmit = async (
    transactionId: string,
    ratedUserId: string,
    score: number,
    comment: string
  ) => {
    setRatingLoading(transactionId);
    try {
      await ratingsApi.createRating({
        transaction_id: transactionId,
        rated_user_id: ratedUserId,
        score,
        comment: comment || undefined,
      });
      const res = await ratingsApi.getTransactionRatings(transactionId);
      setTransactionRatings((prev) => ({ ...prev, [transactionId]: res.data }));
    } catch (error: any) {
      alert(error.response?.data?.detail || "Failed to submit rating");
    } finally {
      setRatingLoading(null);
    }
  };

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
      {transactions.map((transaction) => {
        const ratings = transactionRatings[transaction._id] || [];
        const myRating = ratings.find(
          (r) => r.rater_id === currentUserId || (r.rater as any)?.id === currentUserId
        );
        const otherUserId =
          transaction.provider_id === currentUserId
            ? transaction.requester_id
            : transaction.provider_id;

        return (
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
                    <Badge color="blue">
                      {transaction.timebank_hours} hours
                    </Badge>
                    <StatusBadge status={transaction.status} size="1" />
                  </Flex>
                </div>
              </Flex>

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
                          disabled={
                            requiresNeedCreation &&
                            transaction.provider_id === currentUserId
                          }
                          title={
                            requiresNeedCreation &&
                            transaction.provider_id === currentUserId
                              ? "Create a Need before you can give help"
                              : undefined
                          }
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
                      Transaction completed! Both parties confirmed. TimeBank
                      logs have been created.
                    </Text>
                  </Flex>
                </Card>
              )}

              {transaction.status === "completed" && (
                <Card className="p-3">
                  {myRating ? (
                    <div>
                      <Text size="2" weight="bold" className="block mb-1">
                        Your Rating
                      </Text>
                      <RatingStars value={myRating.score} readonly size={16} />
                      {myRating.comment && (
                        <Text size="1" color="gray" className="block mt-1">
                          "{myRating.comment}"
                        </Text>
                      )}
                    </div>
                  ) : (
                    <RatingForm
                      onSubmit={(score, comment) =>
                        handleRatingSubmit(
                          transaction._id,
                          otherUserId,
                          score,
                          comment
                        )
                      }
                      loading={ratingLoading === transaction._id}
                    />
                  )}
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
        );
      })}
    </div>
  );
}
