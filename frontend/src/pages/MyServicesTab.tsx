import {
  Card,
  Text,
  Flex,
  Badge,
  Button,
  Heading,
  Tooltip,
} from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { Service, Transaction, Rating } from "@/types";
import { ApplicantsList } from "@/components/ui/ApplicantsList";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RatingStars } from "@/components/ui/RatingStars";
import {
  ConfirmCompletionModal,
  tagToLabel,
  type ConfirmCompletionRatingData,
} from "@/components/ui/ConfirmCompletionModal";
import { InterestChip } from "@/components/ui/InterestChip";
import { EditServiceDialog } from "@/components/forms/EditServiceDialog";
import { ratingsApi } from "@/services/api";
import { ImageGallery } from "@/components/ui/ImageGallery";
import {
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircledIcon,
  ArrowRightIcon,
  TrashIcon,
  CrossCircledIcon,
  Pencil1Icon,
  ChatBubbleIcon,
} from "@radix-ui/react-icons";
import { useNavigate } from "react-router-dom";

interface MyServicesTabProps {
  services: Service[];
  serviceTransactions: Record<string, Transaction[]>;
  currentUserId: string | null;
  requiresNeedCreation?: boolean;
  onSetServiceInProgress: (serviceId: string) => Promise<void>;
  onDeleteService: (serviceId: string) => Promise<void>;
  onCancelService: (serviceId: string) => Promise<void>;
  onStartChat: (transactionId: string) => Promise<void>;
  onCreateGroupChat: (serviceId: string) => Promise<void>;
  onCancelTransaction: (transactionId: string) => Promise<void>;
  onConfirmTransactionCompletion: (
    transactionId: string,
    ratingData?: {
      ratedUserId: string;
      score: number;
      comment?: string;
      tags: string[];
      image_urls?: string[];
    },
  ) => Promise<void>;
  onRequestUpdate: () => void;
  formatDate: (dateString: string) => string;
  /** When set (from URL ?status=), scroll to this section and highlight the filter button. */
  statusFilter?: string;
  /** When set, scroll to and highlight the service card with this ID. */
  highlightServiceId?: string;
}

export function MyServicesTab({
  services,
  serviceTransactions,
  currentUserId,
  requiresNeedCreation = false,
  onSetServiceInProgress,
  onDeleteService,
  onCancelService,
  onCreateGroupChat,
  onCancelTransaction,
  onConfirmTransactionCompletion,
  onRequestUpdate,
  formatDate,
  statusFilter,
  highlightServiceId,
}: MyServicesTabProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionRatings, setTransactionRatings] = useState<
    Record<string, Rating[]>
  >({});
  const [confirmModalTransaction, setConfirmModalTransaction] =
    useState<Transaction | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

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
      image_urls: data.image_urls,
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

  // Scroll to and highlight a specific service card
  const [highlightActive, setHighlightActive] = useState(false);

  useEffect(() => {
    if (!highlightServiceId) return;
    // Small delay so the DOM has rendered (status filter may change visible cards)
    const timer = setTimeout(() => {
      const el = document.getElementById(`service-card-${highlightServiceId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightActive(true);
        setTimeout(() => setHighlightActive(false), 3000);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [highlightServiceId, services]);

  const getServiceTypeLabel = (type: string) => {
    return type === "offer" ? "Offer" : "Need";
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

  const q = searchQuery.toLowerCase();
  const filteredServices = q
    ? services.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.tags?.some((t) => (t.label || t.entityId)?.toLowerCase().includes(q)),
      )
    : services;

  // Group services by status
  const groupedServices = filteredServices.reduce(
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
    <div className="space-y-6">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gray-9)] w-4 h-4 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search services by title, description or tag..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[var(--gray-a5)] bg-[var(--gray-a2)] placeholder-[var(--gray-9)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-8)]"
        />
      </div>
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
      {filteredServices.length === 0 && (
        <Text size="2" color="gray" className="block text-center py-4">
          No services match your search.
        </Text>
      )}
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
                <Card
                  key={service._id}
                  id={`service-card-${service._id}`}
                  className={`p-6 transition-all duration-700 ${highlightActive && highlightServiceId === service._id ? "ring-2 ring-[var(--accent-9)] bg-[var(--accent-a2)]" : ""}`}
                >
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
                                <Tooltip
                                  content={
                                    !service.matched_user_ids ||
                                    service.matched_user_ids.length === 0
                                      ? "No matched users yet"
                                      : "Mark service as in progress"
                                  }
                                >
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
                                </Tooltip>
                              )}

                              {/* Group Chat button for active services with matched users */}
                              {service.matched_user_ids &&
                                service.matched_user_ids.length > 0 && (
                                  <Tooltip content="Create group chat with matched users">
                                    <Button
                                      size="2"
                                      color="teal"
                                      variant="soft"
                                      onClick={() =>
                                        onCreateGroupChat(service._id)
                                      }
                                    >
                                      <ChatBubbleIcon className="w-4 h-4 mr-2" />
                                      {
                                        service.matched_user_ids.length > 1 ? "Group Chat" : "Chat"
                                      }
                                    </Button>
                                  </Tooltip>
                                )}

                              <Tooltip content="Cancel service">
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
                              </Tooltip>
                              <Tooltip content="Delete service">
                                <Button
                                  disabled={service.status !== "active"}
                                  size="2"
                                  variant="soft"
                                  color="red"
                                  onClick={() => onDeleteService(service._id)}
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </Button>
                              </Tooltip>
                              <Tooltip content="Edit service">
                                <Button
                                  disabled={service.status !== "active"}
                                  size="2"
                                  variant="soft"
                                  onClick={() =>
                                    setEditingServiceId(service._id)
                                  }
                                >
                                  <Pencil1Icon className="w-4 h-4" />
                                </Button>
                              </Tooltip>
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
                                  Transaction confirmations
                                </Text>
                                <Text size="2" color="gray" className="mt-1">
                                  The service will be automatically marked as
                                  completed once all participants confirm.
                                </Text>
                              </div>
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
                                  const transactionStatus =
                                    transaction.provider_confirmed &&
                                    transaction.requester_confirmed
                                      ? "completed"
                                      : transaction.provider_confirmed
                                        ? "provider_confirmed"
                                        : transaction.requester_confirmed
                                          ? "requester_confirmed"
                                          : "pending";
                                  const transactionStatusColor =
                                    transactionStatus === "completed"
                                      ? "green"
                                      : transactionStatus ===
                                          "provider_confirmed"
                                        ? "yellow"
                                        : transactionStatus ===
                                            "requester_confirmed"
                                          ? "yellow"
                                          : "red";
                                  const transactionStatusText =
                                    transactionStatus === "completed"
                                      ? "✓ Exchange completed"
                                      : transactionStatus ===
                                          "provider_confirmed"
                                        ? "✓ You confirmed but requester not confirmed - Exchange not completed"
                                        : transactionStatus ===
                                            "requester_confirmed"
                                          ? "✓ Requester confirmed but you not confirmed - Exchange not completed"
                                          : "✗ Both you and requester not confirmed - Exchange not completed";

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
                                          color={transactionStatusColor}
                                        >
                                          {transactionStatusText} for{" "}
                                          {transaction.timebank_hours} hour(s)
                                        </Text>
                                      </Flex>

                                      {transaction.status === "pending" && (
                                          <Flex gap="2">
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
                                              Remove Confirmation
                                            </Button>
                                          </Flex>
                                      )}

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
                                          {myRating.image_urls &&
                                            myRating.image_urls.length > 0 && (
                                              <ImageGallery
                                                urls={myRating.image_urls}
                                                alt="Review photo"
                                                className="mt-1"
                                              />
                                            )}
                                        </Flex>
                                      )}

                                      {/* Confirm Completion buttons */}
                                      {currentUserId &&
                                        transaction.status !== "completed" && (
                                          <>
                                            {String(transaction.provider_id) ===
                                              String(currentUserId) &&
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

      {editingServiceId && (
        <EditServiceDialog
          open={!!editingServiceId}
          onOpenChange={(open) => {
            if (!open) setEditingServiceId(null);
          }}
          service={services.find((s) => s._id === editingServiceId)!}
          onSuccess={() => {
            setEditingServiceId(null);
            onRequestUpdate();
          }}
        />
      )}
    </div>
  );
}
