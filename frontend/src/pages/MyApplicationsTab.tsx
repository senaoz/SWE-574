import { Card, Text, Flex, Badge, Button } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { JoinRequest, Service, Transaction, Rating } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RatingForm, RatingStars } from "@/components/ui/RatingStars";
import { ratingsApi } from "@/services/api";
import { CheckCircledIcon } from "@radix-ui/react-icons";

interface MyApplicationsTabProps {
  requests: JoinRequest[];
  serviceTitles: Record<string, string>;
  services: Service[]; // Services for approved applications
  serviceTransactions: Record<string, Transaction[]>;
  currentUserId: string | null;
  onServiceClick: (id: string) => void;
  onConfirmTransactionCompletion: (transactionId: string) => Promise<void>;
  formatDate: (dateString: string) => string;
}

export function MyApplicationsTab({
  requests,
  serviceTitles,
  services,
  serviceTransactions,
  currentUserId,
  onServiceClick,
  onConfirmTransactionCompletion,
  formatDate,
}: MyApplicationsTabProps) {
  const [transactionRatings, setTransactionRatings] = useState<
    Record<string, Rating[]>
  >({});
  const [ratingLoading, setRatingLoading] = useState<string | null>(null);

  // Fetch ratings for completed transactions (where we are the requester)
  useEffect(() => {
    const applicationServiceIds = services.map((s) => s._id);
    applicationServiceIds.forEach((serviceId) => {
      const transactions = serviceTransactions[serviceId] ?? [];
      const completedAsRequester = transactions.filter(
        (t) =>
          t.status === "completed" &&
          currentUserId &&
          String(t.requester_id) === String(currentUserId),
      );
      completedAsRequester.forEach(async (t) => {
        try {
          const res = await ratingsApi.getTransactionRatings(t._id);
          setTransactionRatings((prev) => ({ ...prev, [t._id]: res.data }));
        } catch {
          // ratings not available yet
        }
      });
    });
  }, [services, serviceTransactions, currentUserId]);

  const handleRatingSubmit = async (
    transactionId: string,
    ratedUserId: string,
    score: number,
    comment: string,
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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      alert(err.response?.data?.detail || "Failed to submit rating");
    } finally {
      setRatingLoading(null);
    }
  };

  if (requests.length === 0) {
    return (
      <Card className="p-8">
        <Text size="3" color="gray" className="text-center">
          You haven't applied to any services yet.
        </Text>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request._id} className="p-4">
          <Flex direction="column" gap="4">
            <Flex
              justify="between"
              align="start"
              className="cursor-pointer"
              onClick={() => onServiceClick(request.service_id)}
            >
              <div className="flex-1 space-y-2">
                <Text size="3" weight="bold">
                  {request.service?.title ||
                    serviceTitles[request.service_id] ||
                    request.service_id ||
                    "Service"}
                </Text>
                <Text size="2" color="gray">
                  {request.service?.description}
                </Text>
                <Flex align="center" gap="2">
                  <Badge color="blue">Application</Badge>
                  <StatusBadge status={request.status} size="1" />
                </Flex>
              </div>
              <Text size="1" color="gray">
                {formatDate(request.created_at)}
              </Text>
            </Flex>

            {request.message && (
              <div>
                <Text size="2" weight="medium" className="block mb-1">
                  Your message:
                </Text>
                <Text size="2" className="italic">
                  "{request.message}"
                </Text>
              </div>
            )}

            {request.admin_message && (
              <div>
                <Text size="2" weight="medium" className="block mb-1">
                  Provider response:
                </Text>
                <Text size="2" className="italic">
                  "{request.admin_message}"
                </Text>
              </div>
            )}

            {/* Service completion section for approved applications */}
            {request.status === "approved" && (
              <>
                {(() => {
                  const service = services.find(
                    (s) => s._id === request.service_id,
                  );
                  if (!service) return null;

                  const isReceiver =
                    currentUserId &&
                    service.matched_user_ids &&
                    service.matched_user_ids.includes(currentUserId);
                  const myTransaction = (
                    serviceTransactions[service._id] ?? []
                  ).find(
                    (t) => String(t.requester_id) === String(currentUserId),
                  );
                  const hasConfirmed =
                    myTransaction && myTransaction.requester_confirmed;

                  return (
                    <>
                      {/* Completion status for in_progress / completed services */}
                      {(service.status === "in_progress" ||
                        service.status === "completed") && (
                        <div>
                          <Flex direction="column" gap="3">
                            <Flex direction="column" gap="1">
                              <Text size="1" weight="medium">
                                Receivers:
                              </Text>
                              <Badge
                                color={
                                  service.receiver_confirmed_ids &&
                                  service.matched_user_ids &&
                                  service.receiver_confirmed_ids.length ===
                                    service.matched_user_ids.length
                                    ? "green"
                                    : "gray"
                                }
                                size="1"
                              >
                                {service.receiver_confirmed_ids &&
                                service.matched_user_ids
                                  ? `${service.receiver_confirmed_ids.length}/${service.matched_user_ids.length} Confirmed`
                                  : service.matched_user_ids
                                    ? `0/${service.matched_user_ids.length} Confirmed`
                                    : "0/0 Confirmed"}
                              </Badge>
                            </Flex>
                            {/* Receiver confirms their transaction (Confirm I received) */}
                            {isReceiver &&
                              myTransaction &&
                              !myTransaction.requester_confirmed &&
                              myTransaction.status !== "completed" && (
                                <Button
                                  size="2"
                                  color="green"
                                  onClick={() =>
                                    onConfirmTransactionCompletion(
                                      myTransaction._id,
                                    )
                                  }
                                >
                                  <CheckCircledIcon className="w-4 h-4 mr-2" />
                                  Confirm I received
                                </Button>
                              )}

                            {/* Already confirmed message */}
                            {isReceiver && hasConfirmed && (
                              <Flex gap="2" align="center">
                                <CheckCircledIcon
                                  className="w-4 h-4"
                                  color="green"
                                />
                                <Text size="2" color="green" weight="medium">
                                  You have confirmed receipt of this service
                                </Text>
                              </Flex>
                            )}

                            {/* Rating section for completed services */}
                            {service.status === "completed" &&
                              isReceiver &&
                              currentUserId &&
                              (() => {
                                const transactions =
                                  serviceTransactions[service._id] ?? [];
                                const myTransaction = transactions.find(
                                  (t) =>
                                    t.status === "completed" &&
                                    String(t.requester_id) ===
                                      String(currentUserId),
                                );
                                if (!myTransaction) return null;
                                const providerId = service.user_id;
                                const ratings =
                                  transactionRatings[myTransaction._id] ?? [];
                                const myRating = ratings.find(
                                  (r) =>
                                    String(r.rater_id) ===
                                    String(currentUserId),
                                );
                                return (
                                  <div>
                                    {myRating ? (
                                      <div>
                                        <Text
                                          size="2"
                                          weight="bold"
                                          className="block mb-1"
                                        >
                                          Your rating for the provider
                                        </Text>
                                        <RatingStars
                                          value={myRating.score}
                                          readonly
                                          size={16}
                                        />
                                        {myRating.comment && (
                                          <Text
                                            size="1"
                                            color="gray"
                                            className="block mt-1"
                                          >
                                            &quot;{myRating.comment}&quot;
                                          </Text>
                                        )}
                                      </div>
                                    ) : (
                                      <RatingForm
                                        onSubmit={(score, comment) =>
                                          handleRatingSubmit(
                                            myTransaction._id,
                                            providerId,
                                            score,
                                            comment,
                                          )
                                        }
                                        loading={
                                          ratingLoading === myTransaction._id
                                        }
                                      />
                                    )}
                                  </div>
                                );
                              })()}
                          </Flex>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </Flex>
        </Card>
      ))}
    </div>
  );
}
