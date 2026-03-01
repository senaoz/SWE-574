import { Card, Text, Flex, Badge, Button, Heading } from "@radix-ui/themes";
import { Service, Transaction } from "@/types";
import { ApplicantsList } from "@/components/ui/ApplicantsList";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
  onMarkServiceAsDone: (serviceId: string) => Promise<void>;
  onConfirmServiceCompletion: (serviceId: string) => Promise<void>;
  onConfirmTransactionCompletion: (transactionId: string) => Promise<void>;
  onDeleteService: (serviceId: string) => Promise<void>;
  onCancelService: (serviceId: string) => Promise<void>;
  onRequestUpdate: () => void;
  formatDate: (dateString: string) => string;
}

export function MyServicesTab({
  services,
  serviceTransactions,
  currentUserId,
  requiresNeedCreation = false,
  onSetServiceInProgress,
  onMarkServiceAsDone,
  onConfirmTransactionCompletion,
  onDeleteService,
  onCancelService,
  onRequestUpdate,
  formatDate,
}: MyServicesTabProps) {
  const navigate = useNavigate();
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
    "active",
    "in_progress",
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
      {statusOrder.map((status) => {
        const servicesInStatus = groupedServices[status] || [];
        if (servicesInStatus.length === 0) return null;

        return (
          <div key={status} className="space-y-4">
            <Flex align="center" gap="3">
              <Heading size="4">{getStatusLabel(status)} Services</Heading>
              <Badge color="gray" size="2">
                {servicesInStatus.length}
              </Badge>
            </Flex>
            <div className="space-y-6">
              {servicesInStatus.map((service) => (
                <Card key={service._id} className="p-6">
                  <div className="flex flex-col gap-3">
                    {/* Service header */}
                    <Flex justify="between" align="start">
                      <div className="flex-1 flex flex-col">
                        <Flex align="center" gap="2">
                          <StatusBadge status={service.status} />
                          <Badge
                            color={getServiceTypeColor(service.service_type)}
                          >
                            {getServiceTypeLabel(service.service_type)}
                          </Badge>
                        </Flex>
                      </div>

                      {/* Action buttons for service owner */}
                      {String(service.user_id) === String(currentUserId) && (
                        <Flex gap="2" justify="end">
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
                          {/* Mark as Done button for active or in_progress services */}
                          {(service.status === "active" ||
                            service.status === "in_progress") &&
                            !service.provider_confirmed && (
                              <Button
                                disabled={
                                  !service.matched_user_ids ||
                                  service.matched_user_ids.length === 0 ||
                                  (service.service_type === "offer" &&
                                    requiresNeedCreation)
                                }
                                size="2"
                                color="green"
                                onClick={() => onMarkServiceAsDone(service._id)}
                                title={
                                  service.service_type === "offer" &&
                                  requiresNeedCreation
                                    ? "Create a Need before you can give help"
                                    : undefined
                                }
                              >
                                <CheckCircledIcon className="w-4 h-4 mr-2" />
                                Mark as Done
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
                        </Flex>
                      )}
                    </Flex>
                    <Flex
                      direction="column"
                      gap="1"
                      className="cursor-pointer hover:text-lime-500 transition-colors duration-200"
                      onClick={() => navigate(`/service/${service._id}`)}
                    >
                      <Text size="4" weight="bold">
                        {service.title}
                      </Text>
                      <Text size="2" color="gray">
                        {service.description}
                      </Text>
                    </Flex>

                    {/* Service details */}
                    <Flex gap="4" wrap="wrap">
                      <Flex align="center" gap="1">
                        <Text size="2" weight="medium">
                          Category:
                        </Text>
                        <Text size="2">{service.category}</Text>
                      </Flex>
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

                    {/* Service Completion Status for in_progress services */}
                    {service.status === "in_progress" &&
                      service.matched_user_ids &&
                      service.matched_user_ids.length > 0 && (
                        <Flex direction="column" gap="2">
                          <Text size="2" weight="bold">
                            Completion Status
                          </Text>
                          <Flex gap="4" wrap="wrap">
                            <Flex direction="column" gap="1">
                              <Text size="1" weight="medium">
                                Provider:
                              </Text>
                              <Badge
                                color={
                                  service.provider_confirmed ? "green" : "gray"
                                }
                                size="1"
                              >
                                {service.provider_confirmed
                                  ? "Confirmed"
                                  : "Pending"}
                              </Badge>
                            </Flex>
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
                                {service.receiver_confirmed_ids
                                  ? `${service.receiver_confirmed_ids.length}/${service.matched_user_ids.length} Confirmed`
                                  : `0/${service.matched_user_ids.length} Confirmed`}
                              </Badge>
                            </Flex>
                          </Flex>
                        </Flex>
                      )}

                    {/* Matched users info */}
                    {service.matched_user_ids &&
                      service.matched_user_ids.length > 0 && (
                        <Card
                          className="p-3"
                          style={{ backgroundColor: "var(--lime-3)" }}
                        >
                          <Flex align="center" gap="2">
                            <CheckCircledIcon
                              className="w-4 h-4"
                              color="green"
                            />
                            <Text size="2" weight="medium">
                              Matched with {service.matched_user_ids.length}{" "}
                              user(s) - Service in progress
                            </Text>
                          </Flex>
                        </Card>
                      )}

                    {/* Service Completion Confirmation */}
                    {(service.status === "in_progress" ||
                      service.status === "completed") &&
                      serviceTransactions[service._id] &&
                      serviceTransactions[service._id].length > 0 && (
                        <Card
                          className="p-4"
                          style={{ backgroundColor: "var(--yellow-3)" }}
                        >
                          <Flex direction="column" gap="3">
                            <Flex justify="between" align="center">
                              <div className="grid">
                                <Text size="3" weight="bold">
                                  Service Completion Confirmation
                                </Text>
                                <Text size="2" color="gray" className="mt-1">
                                  Each transaction requires both parties to
                                  confirm completion before TimeBank logs are
                                  created.
                                </Text>
                              </div>

                              {serviceTransactions[service._id].some(
                                (transaction) =>
                                  transaction.status === "pending" &&
                                  ((transaction.provider_id === currentUserId &&
                                    !transaction.provider_confirmed) ||
                                    (transaction.requester_id ===
                                      currentUserId &&
                                      !transaction.requester_confirmed)),
                              ) && (
                                <Button
                                  size="2"
                                  color="green"
                                  disabled={
                                    requiresNeedCreation &&
                                    serviceTransactions[service._id].some(
                                      (t) =>
                                        t.status === "pending" &&
                                        t.provider_id === currentUserId &&
                                        !t.provider_confirmed,
                                    )
                                  }
                                  title={
                                    requiresNeedCreation
                                      ? "Create a Need before you can give help"
                                      : undefined
                                  }
                                  onClick={() => {
                                    const pendingTransactions =
                                      serviceTransactions[service._id].filter(
                                        (transaction) =>
                                          transaction.status === "pending" &&
                                          ((transaction.provider_id ===
                                            currentUserId &&
                                            !transaction.provider_confirmed) ||
                                            (transaction.requester_id ===
                                              currentUserId &&
                                              !transaction.requester_confirmed)),
                                      );
                                    if (pendingTransactions.length > 0) {
                                      const confirmed = window.confirm(
                                        `Confirm completion for ${pendingTransactions.length} transaction(s)?`,
                                      );
                                      if (confirmed) {
                                        pendingTransactions.forEach(
                                          (transaction) => {
                                            onConfirmTransactionCompletion(
                                              transaction._id,
                                            );
                                          },
                                        );
                                      }
                                    }
                                  }}
                                >
                                  <CheckCircledIcon className="w-4 h-4 mr-2" />
                                  Confirm All Pending
                                </Button>
                              )}
                            </Flex>

                            <div className="space-y-3">
                              {serviceTransactions[service._id].map(
                                (transaction) => (
                                  <Card key={transaction._id} className="p-3">
                                    <Flex direction="column" gap="2">
                                      <Flex justify="between" align="center">
                                        <Text size="2" weight="medium">
                                          {transaction.provider?.full_name ||
                                            transaction.provider?.username ||
                                            "Provider"}{" "}
                                          ↔{" "}
                                          {transaction.requester?.full_name ||
                                            transaction.requester?.username ||
                                            "Requester"}
                                        </Text>
                                        <Badge color="blue" size="1">
                                          {transaction.timebank_hours}h
                                        </Badge>
                                      </Flex>
                                      <Flex gap="4" wrap="wrap">
                                        <Flex
                                          direction="row"
                                          gap="1"
                                          align="center"
                                        >
                                          <Text size="1" weight="medium">
                                            Provider:
                                          </Text>
                                          <Badge
                                            color={
                                              transaction.provider_confirmed
                                                ? "green"
                                                : "gray"
                                            }
                                            size="1"
                                          >
                                            {transaction.provider_confirmed
                                              ? "Confirmed"
                                              : "Pending"}
                                          </Badge>
                                        </Flex>
                                        <Flex
                                          direction="row"
                                          gap="1"
                                          align="center"
                                        >
                                          <Text size="1" weight="medium">
                                            Requester:
                                          </Text>
                                          <Badge
                                            color={
                                              transaction.requester_confirmed
                                                ? "green"
                                                : "gray"
                                            }
                                            size="1"
                                          >
                                            {transaction.requester_confirmed
                                              ? "Confirmed"
                                              : "Pending"}
                                          </Badge>
                                        </Flex>
                                      </Flex>
                                      {transaction.status === "completed" ? (
                                        <Text
                                          size="1"
                                          color="green"
                                          weight="medium"
                                        >
                                          ✓ Transaction completed
                                        </Text>
                                      ) : (
                                        <Button
                                          size="1"
                                          color="green"
                                          disabled={
                                            requiresNeedCreation &&
                                            transaction.provider_id ===
                                              currentUserId
                                          }
                                          title={
                                            requiresNeedCreation &&
                                            transaction.provider_id ===
                                              currentUserId
                                              ? "Create a Need before you can give help"
                                              : undefined
                                          }
                                          onClick={() =>
                                            onConfirmTransactionCompletion(
                                              transaction._id,
                                            )
                                          }
                                        >
                                          <CheckCircledIcon className="w-3 h-3 mr-1" />
                                          Confirm Completion
                                        </Button>
                                      )}
                                    </Flex>
                                  </Card>
                                ),
                              )}
                            </div>
                          </Flex>
                        </Card>
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
    </div>
  );
}
