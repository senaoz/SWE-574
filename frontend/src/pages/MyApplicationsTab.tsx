import {
  Card,
  Text,
  Flex,
  Badge,
  Button,
  Separator,
  Box,
  Avatar,
} from "@radix-ui/themes";
import { Fragment, useEffect, useState } from "react";
import { JoinRequest, Service, Transaction, Rating } from "@/types";
import { RatingForm, RatingStars } from "@/components/ui/RatingStars";
import { ratingsApi, usersApi } from "@/services/api";
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
  const [providerNames, setProviderNames] = useState<
    Record<string, { username: string; full_name?: string }>
  >({});

  // Resolve provider IDs from services and fetch their display names
  useEffect(() => {
    const providerIds = new Set<string>();
    requests.forEach((request) => {
      const service = services.find((s) => s._id === request.service_id);
      if (service?.user_id) providerIds.add(service.user_id);
    });
    providerIds.forEach(async (userId) => {
      try {
        const res = await usersApi.getUserById(userId);
        const u = res.data;
        setProviderNames((prev) => ({
          ...prev,
          [userId]: {
            username: u.username,
            full_name: u.full_name,
          },
        }));
      } catch {
        // keep fallback
      }
    });
  }, [requests, services]);

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
    const id = String(transactionId);
    setRatingLoading(id);
    try {
      await ratingsApi.createRating({
        transaction_id: id,
        rated_user_id: ratedUserId,
        score,
        comment: comment || undefined,
      });
      const res = await ratingsApi.getTransactionRatings(id);
      setTransactionRatings((prev) => ({ ...prev, [id]: res.data }));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      const message = err.response?.data?.detail ?? "Failed to submit rating";
      const alreadyRated =
        typeof message === "string" &&
        message.toLowerCase().includes("already rated");
      if (alreadyRated) {
        try {
          const res = await ratingsApi.getTransactionRatings(id);
          setTransactionRatings((prev) => ({ ...prev, [id]: res.data }));
        } catch {
          // ignore refetch error
        }
      } else {
        alert(message);
      }
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
      {requests.map((request, index) => {
        const service = services.find((s) => s._id === request.service_id);
        const providerId = service?.user_id;
        const provider = providerId ? providerNames[providerId] : null;
        const providerLabel = provider
          ? provider.full_name || `@${provider.username}`
          : providerId
            ? "Provider"
            : "—";

        return (
          <Fragment key={request._id}>
            <Flex
              direction="column"
              gap="3"
              mb="5"
              className="my-application-item bg-[var(--accent-a2)] rounded-lg p-4"
            >
              <Flex justify="between" gap="3">
                <Flex gap="3" className="flex-1">
                  <Avatar
                    size="3"
                    color={
                      request.status === "approved"
                        ? "green"
                        : request.status === "rejected" ||
                            request.status === "cancelled"
                          ? "red"
                          : "gray"
                    }
                    fallback={
                      request.status === "approved"
                        ? "✓"
                        : request.status === "rejected" ||
                            request.status === "cancelled"
                          ? "✗"
                          : "?"
                    }
                  />
                  <Box className="flex-1">
                    <Flex
                      direction="column"
                      gap="1"
                      className="cursor-pointer"
                      onClick={() => onServiceClick(request.service_id)}
                    >
                      <Text as="div" size="3" weight="bold">
                        {request.service?.title ||
                          serviceTitles[request.service_id] ||
                          request.service_id ||
                          "Service"}
                      </Text>
                      <Text as="div" size="1" color="gray" className="mb-4">
                        by {providerLabel}
                      </Text>
                    </Flex>
                    <Text as="div" size="2" color="gray">
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
                              (t) =>
                                String(t.requester_id) ===
                                String(currentUserId),
                            );
                            const hasConfirmed =
                              myTransaction &&
                              myTransaction.requester_confirmed;

                            return (
                              <>
                                {/* Completion status for in_progress / completed services */}
                                {(service.status === "in_progress" ||
                                  service.status === "completed") && (
                                  <div>
                                    <Flex direction="column" gap="3">
                                      <Flex
                                        direction="row"
                                        gap="1"
                                        align="center"
                                      >
                                        <Text size="1" weight="medium">
                                          Provider confirmed:
                                        </Text>
                                        <Badge color="green" size="1">
                                          {myTransaction?.provider_confirmed
                                            ? "Yes"
                                            : "No"}
                                        </Badge>
                                        <Text
                                          size="1"
                                          weight="medium"
                                          className="ml-2"
                                        >
                                          Receivers:
                                        </Text>
                                        <Badge
                                          color={
                                            service.receiver_confirmed_ids &&
                                            service.matched_user_ids &&
                                            service.receiver_confirmed_ids
                                              .length ===
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
                                        myTransaction.status !==
                                          "completed" && (
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
                                          <Text
                                            size="2"
                                            color="green"
                                            weight="medium"
                                          >
                                            You have confirmed receipt of this
                                            service
                                          </Text>
                                        </Flex>
                                      )}
                                      {/* Rating section: only when both parties have confirmed */}
                                      {isReceiver &&
                                        currentUserId &&
                                        (() => {
                                          const transactions =
                                            serviceTransactions[service._id] ??
                                            [];
                                          const myTransaction =
                                            transactions.find(
                                              (t) =>
                                                t.requester_confirmed &&
                                                t.provider_confirmed &&
                                                String(t.requester_id) ===
                                                  String(currentUserId),
                                            );
                                          const myTransactionAny =
                                            transactions.find(
                                              (t) =>
                                                String(t.requester_id) ===
                                                String(currentUserId),
                                            );
                                          const cannotRateYet =
                                            myTransactionAny &&
                                            !(
                                              myTransactionAny.requester_confirmed &&
                                              myTransactionAny.provider_confirmed
                                            );

                                          if (cannotRateYet) {
                                            return (
                                              <Text
                                                size="2"
                                                color="gray"
                                                className="block mt-1"
                                              >
                                                You can rate the provider once
                                                both parties have confirmed this
                                                exchange. Check it again later.
                                              </Text>
                                            );
                                          }
                                          if (!myTransaction) return null;

                                          const providerId = service.user_id;
                                          const ratings =
                                            transactionRatings[
                                              myTransaction._id
                                            ] ?? [];
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
                                                      &quot;{myRating.comment}
                                                      &quot;
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
                                                    ratingLoading ===
                                                    myTransaction._id
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
                    </Text>
                  </Box>
                </Flex>

                <Text size="2" color="gray" className="text-right">
                  {formatDate(request.created_at)}
                </Text>
              </Flex>
            </Flex>

            {index < requests.length - 1 && (
              <Flex direction="column">
                <Box>
                  <Separator size="4" />
                </Box>
              </Flex>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
