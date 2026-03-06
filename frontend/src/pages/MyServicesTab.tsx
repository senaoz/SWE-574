import { Card, Text, Flex, Badge, Button, Heading } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { Service, Transaction, Rating } from "@/types";
import { ApplicantsList } from "@/components/ui/ApplicantsList";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RatingForm, RatingStars } from "@/components/ui/RatingStars";
import {
  ConfirmCompletionModal,
  tagToLabel,
  type ConfirmCompletionRatingData,
} from "@/components/ui/ConfirmCompletionModal";
import { InterestChip } from "@/components/ui/InterestChip";
import { ratingsApi } from "@/services/api";
import {
  ClockIcon,
  CheckCircledIcon,
  ArrowRightIcon,
  TrashIcon,
  CrossCircledIcon,
} from "@radix-ui/react-icons";
import { useNavigate } from "react-router-dom";

interface MyServicesTabProps {
  services: Service[];
  serviceTransactions: Record<string, Transaction[]>;
  currentUserId: string | null;
  requiresNeedCreation?: boolean;
  onSetServiceInProgress: (serviceId: string) => Promise<void>;
  onMarkServiceComplete: (serviceId: string) => Promise<void>;
  onDeleteService: (serviceId: string) => Promise<void>;
  onCancelService: (serviceId: string) => Promise<void>;
  onStartChat: (transactionId: string) => Promise<void>;
  onCancelTransaction: (transactionId: string) => Promise<void>;
  onConfirmTransactionCompletion: (
    transactionId: string,
    ratingData?: {
      ratedUserId: string;
      score: number;
      comment?: string;
      tags: string[];
    },
  ) => Promise<void>;
  onRequestUpdate: () => void;
  formatDate: (dateString: string) => string;
  /** When set (from URL ?status=), scroll to this section and highlight the filter button. */
  statusFilter?: string;
}

export function MyServicesTab({
  services,
  serviceTransactions,
  currentUserId,
  requiresNeedCreation = false,
  onSetServiceInProgress,
  onMarkServiceComplete,
  onDeleteService,
  onCancelService,
  onStartChat,
  onCancelTransaction,
  onConfirmTransactionCompletion,
  onRequestUpdate,
  formatDate,
  statusFilter,
}: MyServicesTabProps) {
  const navigate = useNavigate();
  const [transactionRatings, setTransactionRatings] = useState<
    Record<string, Rating[]>
  >({});
  const [ratingLoading, setRatingLoading] = useState<string | null>(null);
  const [confirmModalTransaction, setConfirmModalTransaction] =
    useState<Transaction | null>(null);

  // Fetch ratings for transactions where the current user has confirmed or both confirmed.
  useEffect(() => {
    const allTransactions = Object.values(serviceTransactions).flat();
    const rateable = allTransactions.filter((t) => {
      const bothConfirmed = t.provider_confirmed && t.requester_confirmed;
      const isProvider = String(t.provider_id) === String(currentUserId);
      const isRequester = String(t.requester_id) === String(currentUserId);
      const myConfirmed =
        (isProvider && t.provider_confirmed) ||
        (isRequester && t.requester_confirmed);
      return bothConfirmed || myConfirmed;
    });
    const toFetch = rateable.filter(
      (t) => transactionRatings[String(t._id)] === undefined,
    );
    toFetch.forEach(async (t) => {
      try {
        const id = String(t._id);
        const res = await ratingsApi.getTransactionRatings(id);
        setTransactionRatings((prev) => ({ ...prev, [id]: res.data }));
      } catch {
        // ratings not available yet
      }
    });
  }, [serviceTransactions, transactionRatings, currentUserId]);

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
    } catch (error: any) {
      const message = error.response?.data?.detail ?? "Failed to submit rating";
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

  const handleConfirmWithRating = async (data: ConfirmCompletionRatingData) => {
    if (!confirmModalTransaction || !currentUserId) return;
    const tx = confirmModalTransaction;
    const otherUserId =
      String(tx.provider_id) === String(currentUserId)
        ? tx.requester_id
        : tx.provider_id;

    await onConfirmTransactionCompletion(tx._id, {
      ratedUserId: otherUserId,
      score: data.score,
      comment: data.comment || undefined,
      tags: data.tags,
    });

    try {
      const res = await ratingsApi.getTransactionRatings(tx._id);
      setTransactionRatings((prev) => ({ ...prev, [tx._id]: res.data }));
    } catch {
      // ignore refetch error
    }
  };

  useEffect(() => {
    if (!statusFilter) return;
    const el = document.getElementById(statusFilter.toLowerCase());
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [statusFilter]);

  const getServiceTypeLabel = (type: string) => {
    return type === "offer" ? "Offer" : "Need";
  };

  const getServiceTypeColor = (type: string) => {
    return type === "offer" ? "blue" : "green";
  };

  if (services.length === 0) {
    return (
      <Card className="p-8">
        <Text size="3" color="gray" className="text-center">
          You haven't created any services yet.
        </Text>
      </Card>
    );
  }

  // Group services by status
  const groupedServices = services.reduce(
    (acc, service) => {
      const status = service.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(service);
      return acc;
    },
    {} as Record<string, Service[]>,
  );

  // Define status order for display
  const statusOrder = [
    "in_progress",
    "active",
    "completed",
    "cancelled",
    "expired",
  ];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "expired":
        return "Expired";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-row gap-2">
        <Button
          variant={!statusFilter ? "solid" : "soft"}
          color="gray"
          size="2"
          onClick={() => navigate("/profile?tab=services")}
        >
          All
        </Button>
        <Button
          variant={statusFilter === "active" ? "solid" : "soft"}
          color="gray"
          size="2"
          onClick={() => navigate("/profile?tab=services&status=active")}
          disabled={
            !groupedServices.active || groupedServices.active.length === 0
          }
        >
          Active
        </Button>
        <Button
          disabled={
            !groupedServices.in_progress ||
            groupedServices.in_progress.length === 0
          }
          variant={statusFilter === "in_progress" ? "solid" : "soft"}
          color="gray"
          size="2"
          onClick={() => navigate("/profile?tab=services&status=in_progress")}
        >
          In Progress
        </Button>
        <Button
          disabled={
            !groupedServices.completed || groupedServices.completed.length === 0
          }
          variant={statusFilter === "completed" ? "solid" : "soft"}
          color="gray"
          size="2"
          onClick={() => navigate("/profile?tab=services&status=completed")}
        >
          Completed
        </Button>
        <Button
          disabled={
            !groupedServices.cancelled || groupedServices.cancelled.length === 0
          }
          variant={statusFilter === "cancelled" ? "solid" : "soft"}
          color="gray"
          size="2"
          onClick={() => navigate("/profile?tab=services&status=cancelled")}
        >
          Cancelled
        </Button>
      </div>
      {statusOrder.map((status) => {
        const servicesInStatus = groupedServices[status] || [];
        if (servicesInStatus.length === 0) return null;

        return (
          <div key={status} className="space-y-4" id={status.toLowerCase()}>
            <Flex align="center" gap="3">
              <Heading size="4">{getStatusLabel(status)} Services</Heading>
              <Badge color="gray" size="2">
                {servicesInStatus.length}
              </Badge>
            </Flex>
            <div className="space-y-6 max-w-[calc(100vw-5rem)]">
              {servicesInStatus.map((service) => (
                <Card key={service._id} className="p-6">
                  <div className="flex flex-col gap-3">
                    <Flex direction="column" gap="1">
                      <Flex justify="between" gap="2" align="center">
                        <Text
                          size="4"
                          weight="bold"
                          className="cursor-pointer hover:text-lime-500 transition-colors duration-200"
                          onClick={() => navigate(`/service/${service._id}`)}
                        >
                          {getServiceTypeLabel(service.service_type)}:{" "}
                          {service.title}
                        </Text>
                        <Flex justify="end" gap="2" align="center">
                          <StatusBadge status={service.status} />

                          {/* Action buttons for service owner */}
                          {String(service.user_id) ===
                            String(currentUserId) && (
                            <>
                              {/* Set to In Progress button for active services */}
                              {service.status === "active" && (
                                <Button
                                  size="2"
                                  color="blue"
                                  onClick={() =>
                                    onSetServiceInProgress(service._id)
                                  }
                                  disabled={
                                    !service.matched_user_ids ||
                                    service.matched_user_ids.length === 0
                                  }
                                >
                                  <ArrowRightIcon className="w-4 h-4 mr-2" />
                                  Start Service
                                </Button>
                              )}

                              <Button
                                disabled={
                                  service.status === "completed" ||
                                  service.status === "cancelled" ||
                                  service.status === "expired"
                                }
                                size="2"
                                variant="soft"
                                color="orange"
                                onClick={() => onCancelService(service._id)}
                              >
                                <CrossCircledIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                disabled={service.status !== "active"}
                                size="2"
                                variant="soft"
                                color="red"
                                onClick={() => onDeleteService(service._id)}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </Flex>
                      </Flex>
                    </Flex>

                    {/* Service details */}
                    <Flex gap="4" wrap="wrap">
                      <Flex align="center" gap="1">
                        <ClockIcon className="w-3 h-3" />
                        <Text size="2">{service.estimated_duration}h</Text>
                      </Flex>
                      <Flex align="center" gap="1">
                        <Text size="2" weight="medium">
                          Created:
                        </Text>
                        <Text size="2">{formatDate(service.created_at)}</Text>
                      </Flex>
                    </Flex>
                    {/* Matched users info */}
                    {service.matched_user_ids &&
                      service.matched_user_ids.length > 0 &&
                      service.status === "in_progress" && (
                        <Flex align="center" gap="2">
                          <CheckCircledIcon className="w-4 h-4" color="green" />
                          <Text size="2" weight="medium">
                            Matched with {service.matched_user_ids.length}{" "}
                            user(s) - Service in progress
                          </Text>
                        </Flex>
                      )}

                    {/* Mark as completed (provider only); TimeBank and related transactions updated */}
                    {(service.status === "in_progress" ||
                      service.status === "completed") &&
                      serviceTransactions[service._id] &&
                      serviceTransactions[service._id].length > 0 && (
                        <div className="p-4 rounded-lg bg-[var(--accent-a2)] transition-colors duration-200">
                          <Flex direction="column" gap="3">
                            <Flex
                              justify="between"
                              align="center"
                              wrap="wrap"
                              gap="2"
                            >
                              <div className="grid">
                                <Text size="3" weight="bold">
                                  Mark as completed
                                </Text>
                                <Text size="2" color="gray" className="mt-1">
                                  As the service owner, you can mark the service
                                  as completed. TimeBank will be updated and
                                  related exchanges marked completed.
                                </Text>
                              </div>

                              {service.status === "in_progress" &&
                                currentUserId &&
                                String(service.user_id) === currentUserId && (
                                  <Button
                                    size="2"
                                    color="green"
                                    disabled={requiresNeedCreation}
                                    title={
                                      requiresNeedCreation
                                        ? "Create a Need before you can give help"
                                        : undefined
                                    }
                                    onClick={() =>
                                      onMarkServiceComplete(service._id)
                                    }
                                  >
                                    <CheckCircledIcon className="w-4 h-4 mr-2" />
                                    Mark as completed
                                  </Button>
                                )}
                            </Flex>

                            <div className="space-y-3">
                              {serviceTransactions[service._id].map(
                                (transaction, index) => {
                                  const txId = String(transaction._id);
                                  const ratings =
                                    transactionRatings[txId] || [];

                                  const myRating = ratings.find(
                                    (r) =>
                                      String(r.rater_id) ===
                                        String(currentUserId) ||
                                      (r.rater as any)?.id === currentUserId,
                                  );

                                  const otherUserId =
                                    transaction.provider_id === currentUserId
                                      ? transaction.requester_id
                                      : transaction.provider_id;

                                  return (
                                    <Flex
                                      direction="column"
                                      gap="2"
                                      key={txId}
                                      className={`${index !== serviceTransactions[service._id].length - 1 && "mb-2 pb-3 border-b border-gray-3"}`}
                                    >
                                      <Flex
                                        justify="start"
                                        align="center"
                                        gap="2"
                                      >
                                        <Text size="2" weight="medium">
                                          You (Provider) ↔{" "}
                                          {transaction.requester?.full_name ||
                                            transaction.requester?.username ||
                                            "Requester"}
                                        </Text>
                                        <Text
                                          size="1"
                                          color={
                                            transaction.provider_confirmed &&
                                            transaction.requester_confirmed
                                              ? "green"
                                              : transaction.provider_confirmed
                                                ? "yellow"
                                                : transaction.requester_confirmed
                                                  ? "yellow"
                                                  : "red"
                                          }
                                        >
                                          {transaction.provider_confirmed &&
                                          transaction.requester_confirmed
                                            ? "✓ Exchange completed"
                                            : transaction.provider_confirmed
                                              ? "✓ You confirmed but requester not confirmed - Exchange not completed"
                                              : transaction.requester_confirmed
                                                ? "✓ Requester confirmed but you not confirmed - Exchange not completed"
                                                : "✗ Both you and requester not confirmed - Exchange not completed"}{" "}
                                          for {transaction.timebank_hours}{" "}
                                          hour(s)
                                        </Text>
                                      </Flex>

                                      {/* Rating display: show when user has confirmed */}
                                      {myRating && (
                                        <Flex direction="column" gap="1">
                                          <RatingStars
                                            value={myRating.score}
                                            readonly
                                            size={16}
                                          />
                                          {myRating.tags &&
                                            myRating.tags.length > 0 && (
                                              <Flex
                                                wrap="wrap"
                                                gap="1"
                                                className="mt-1"
                                              >
                                                {myRating.tags.map((tag) => (
                                                  <InterestChip
                                                    key={tag}
                                                    name={tagToLabel(tag)}
                                                    selected
                                                    size="sm"
                                                    showIcon={false}
                                                  />
                                                ))}
                                              </Flex>
                                            )}
                                          {myRating.comment && (
                                            <Text
                                              size="1"
                                              color="gray"
                                              className="block mt-1"
                                            >
                                              "{myRating.comment}"
                                            </Text>
                                          )}
                                        </Flex>
                                      )}

                                      {/* Inline rating form: fallback for old confirmations without rating */}
                                      {!myRating &&
                                        transaction.provider_confirmed &&
                                        transaction.requester_confirmed && (
                                          <RatingForm
                                            onSubmit={(score, comment) =>
                                              handleRatingSubmit(
                                                txId,
                                                otherUserId,
                                                score,
                                                comment,
                                              )
                                            }
                                            loading={ratingLoading === txId}
                                          />
                                        )}

                                      {/* Confirm Completion buttons */}
                                      {currentUserId &&
                                        transaction.status !== "completed" && (
                                          <>
                                            {String(
                                              transaction.provider_id,
                                            ) === String(currentUserId) &&
                                              !transaction.provider_confirmed && (
                                                <Button
                                                  size="2"
                                                  color="green"
                                                  onClick={() =>
                                                    setConfirmModalTransaction(
                                                      transaction,
                                                    )
                                                  }
                                                >
                                                  <CheckCircledIcon className="w-4 h-4 mr-2" />
                                                  Confirm Completion
                                                </Button>
                                              )}
                                            {String(
                                              transaction.requester_id,
                                            ) === String(currentUserId) &&
                                              !transaction.requester_confirmed && (
                                                <Button
                                                  size="2"
                                                  color="green"
                                                  onClick={() =>
                                                    setConfirmModalTransaction(
                                                      transaction,
                                                    )
                                                  }
                                                >
                                                  <CheckCircledIcon className="w-4 h-4 mr-2" />
                                                  Confirm Completion
                                                </Button>
                                              )}
                                          </>
                                        )}
                                      {transaction.status === "pending" && (
                                        <Flex gap="2">
                                          <Button
                                            size="1"
                                            color="blue"
                                            variant="outline"
                                            onClick={() =>
                                              onStartChat(transaction._id)
                                            }
                                          >
                                            Start Chat
                                          </Button>
                                          <Button
                                            size="1"
                                            color="red"
                                            variant="outline"
                                            disabled={
                                              transaction.provider_confirmed &&
                                              transaction.requester_confirmed
                                            }
                                            onClick={() =>
                                              onCancelTransaction(
                                                transaction._id,
                                              )
                                            }
                                          >
                                            Cancel
                                          </Button>
                                        </Flex>
                                      )}
                                    </Flex>
                                  );
                                },
                              )}
                            </div>
                          </Flex>
                        </div>
                      )}

                    {/* Applicants section */}
                    <div>
                      <ApplicantsList
                        serviceId={service._id}
                        onRequestUpdate={onRequestUpdate}
                        disableApprove={
                          service.service_type === "offer" &&
                          requiresNeedCreation
                        }
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {confirmModalTransaction && currentUserId && (
        <ConfirmCompletionModal
          open={!!confirmModalTransaction}
          onOpenChange={(open) => {
            if (!open) setConfirmModalTransaction(null);
          }}
          transaction={confirmModalTransaction}
          currentUserId={currentUserId}
          onSubmit={handleConfirmWithRating}
        />
      )}
    </div>
  );
}
