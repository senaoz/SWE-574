import { Card, Text, Flex, Badge, Button } from "@radix-ui/themes";
import { JoinRequest, Service } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CheckCircledIcon } from "@radix-ui/react-icons";

interface MyApplicationsTabProps {
  requests: JoinRequest[];
  serviceTitles: Record<string, string>;
  services: Service[]; // Services for approved applications
  currentUserId: string | null;
  onServiceClick: (id: string) => void;
  onConfirmServiceCompletion: (serviceId: string) => Promise<void>;
  formatDate: (dateString: string) => string;
}

export function MyApplicationsTab({
  requests,
  serviceTitles,
  services,
  currentUserId,
  onServiceClick,
  onConfirmServiceCompletion,
  formatDate,
}: MyApplicationsTabProps) {
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
          <Flex direction="column" gap="3">
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
                    (s) => s._id === request.service_id
                  );
                  if (!service) return null;

                  const isReceiver =
                    currentUserId &&
                    service.matched_user_ids &&
                    service.matched_user_ids.includes(currentUserId);
                  const hasConfirmed =
                    currentUserId &&
                    service.receiver_confirmed_ids &&
                    service.receiver_confirmed_ids.includes(currentUserId);

                  return (
                    <>
                      {/* Service Completion Status for in_progress services */}
                      {(service.status === "in_progress" || service.status === "completed") && (
                        <Card
                          className="p-3"
                        >
                          <Flex direction="column" gap="3">
                            <Text size="2" weight="bold">
                              Service Completion Status
                            </Text>
                            <Flex gap="4" wrap="wrap">
                              <Flex direction="column" gap="1">
                                <Text size="1" weight="medium">
                                  Provider:
                                </Text>
                                <Badge
                                  color={
                                    service.provider_confirmed
                                      ? "green"
                                      : "gray"
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
                                  {service.receiver_confirmed_ids &&
                                  service.matched_user_ids
                                    ? `${service.receiver_confirmed_ids.length}/${service.matched_user_ids.length} Confirmed`
                                    : service.matched_user_ids
                                    ? `0/${service.matched_user_ids.length} Confirmed`
                                    : "0/0 Confirmed"}
                                </Badge>
                              </Flex>
                            </Flex>
                            {/* Receiver confirmation button */}
                            {isReceiver &&
                              !hasConfirmed &&
                              currentUserId &&
                              service.matched_user_ids &&
                              String(service.user_id) !==
                                String(currentUserId) && (
                                <Flex gap="2" justify="end">
                                  <Button
                                    size="2"
                                    color="green"
                                    onClick={() =>
                                      onConfirmServiceCompletion(service._id)
                                    }
                                  >
                                    <CheckCircledIcon className="w-4 h-4 mr-2" />
                                    Confirm I Received This Service
                                  </Button>
                                </Flex>
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
                          </Flex>
                        </Card>
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
