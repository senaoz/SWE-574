import { useState, useEffect } from "react";
import {
  Card,
  Text,
  Flex,
  Avatar,
  Button,
  Badge,
  TextArea,
} from "@radix-ui/themes";
import { JoinRequest } from "@/types";
import { joinRequestsApi } from "@/services/api";
import {
  CheckCircledIcon,
  CrossCircledIcon,
  ClockIcon,
} from "@radix-ui/react-icons";

interface ApplicantsListProps {
  serviceId: string;
  onRequestUpdate?: () => void;
  /** When true, Approve button is disabled (e.g. provider must create a Need first) */
  disableApprove?: boolean;
}

export function ApplicantsList({
  serviceId,
  onRequestUpdate,
  disableApprove = false,
}: ApplicantsListProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingRequest, setUpdatingRequest] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState<{ [key: string]: string }>(
    {}
  );

  useEffect(() => {
    fetchRequests();
  }, [serviceId]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await joinRequestsApi.getServiceRequests(serviceId);
      setRequests(response.data.requests);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setUpdatingRequest(requestId);
    try {
      const response = await joinRequestsApi.updateRequestStatus(requestId, {
        status: "approved",
        admin_message: adminMessage[requestId] || undefined,
      });

      // Optimistically update the local state with the response
      setRequests((prevRequests) =>
        prevRequests.map((req) => (req._id === requestId ? response.data : req))
      );

      // Clear the admin message for this request
      setAdminMessage((prev) => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });

      // Fetch fresh data to ensure consistency
      await fetchRequests();
      onRequestUpdate?.();
    } catch (error) {
      console.error("Error approving request:", error);
      // On error, refresh to get the correct state
      await fetchRequests();
    } finally {
      setUpdatingRequest(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setUpdatingRequest(requestId);
    try {
      const response = await joinRequestsApi.updateRequestStatus(requestId, {
        status: "rejected",
        admin_message: adminMessage[requestId] || undefined,
      });

      // Optimistically update the local state with the response
      setRequests((prevRequests) =>
        prevRequests.map((req) => (req._id === requestId ? response.data : req))
      );

      // Clear the admin message for this request
      setAdminMessage((prev) => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });

      // Fetch fresh data to ensure consistency
      await fetchRequests();
      onRequestUpdate?.();
    } catch (error) {
      console.error("Error rejecting request:", error);
      // On error, refresh to get the correct state
      await fetchRequests();
    } finally {
      setUpdatingRequest(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge color="yellow">
            <ClockIcon className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge color="green">
            <CheckCircledIcon className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge color="red">
            <CrossCircledIcon className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge color="gray">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <>
        <Text size="2" color="gray" className="text-center py-8">
          Loading applicants...
        </Text>
      </>
    );
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <>
      <Flex align="center" justify="between" className="mb-2">
        <Flex align="center" gap="2">
          <Text size="4" weight="bold">
            Applicants History
          </Text>
          {pendingCount > 0 && (
            <Badge color="yellow" size="2">
              <ClockIcon className="w-3 h-3 mr-1" />
              {pendingCount} Pending
            </Badge>
          )}
        </Flex>
        {pendingCount > 0 && (
          <Text size="2" color="gray">
            Review and approve pending requests below
          </Text>
        )}
      </Flex>

      {requests.length === 0 ? (
        <Text size="2" color="gray" className="text-center py-8">
          No applications yet.
        </Text>
      ) : (
        <div className="space-y-4">
          {/* Show pending requests first */}
          {requests
            .filter((r) => r.status === "pending")
            .map((request) => (
              <Card
                key={request._id}
                className="p-4"
                style={{
                  border: "2px solid var(--yellow-9)",
                  backgroundColor: "var(--yellow-2)",
                }}
              >
                <Flex direction="column" gap="3">
                  {/* User info */}
                  <Flex align="center" gap="3">
                    <Avatar
                      fallback={
                        request.user?.full_name?.[0] ||
                        request.user?.username?.[0] ||
                        "?"
                      }
                      size="3"
                    />
                    <div className="flex-1 flex flex-col">
                      <Text size="3" weight="bold">
                        {request.user?.full_name ||
                          request.user?.username ||
                          "Unknown User"}
                      </Text>
                      <Text size="2" color="gray">
                        @{request.user?.username}
                      </Text>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                      <Text size="1" color="gray">
                        {formatDate(request.created_at)}
                      </Text>
                    </div>
                  </Flex>

                  {/* User bio */}
                  {request.user?.bio && (
                    <Text size="2" color="gray">
                      {request.user.bio}
                    </Text>
                  )}

                  {/* Request message */}
                  {request.message && (
                    <div>
                      <Text size="2" weight="medium" className="block mb-1">
                        Message:
                      </Text>
                      <Text size="2" className="italic">
                        "{request.message}"
                      </Text>
                    </div>
                  )}

                  {/* Admin message */}
                  {request.admin_message && (
                    <div>
                      <Text size="2" weight="medium" className="block mb-1">
                        Your response:
                      </Text>
                      <Text size="2" className="italic">
                        "{request.admin_message}"
                      </Text>
                    </div>
                  )}

                  {/* Actions for pending requests */}
                  {request.status === "pending" && (
                    <div className="space-y-3">
                      <div>
                        <Text size="2" weight="medium" className="block mb-2">
                          Optional response message:
                        </Text>
                        <TextArea
                          placeholder="Add a message for the applicant..."
                          value={adminMessage[request._id] || ""}
                          onChange={(e) =>
                            setAdminMessage((prev) => ({
                              ...prev,
                              [request._id]: e.target.value,
                            }))
                          }
                          rows={2}
                        />
                      </div>
                      <Flex gap="2" justify="end">
                        <Button
                          color="red"
                          variant="soft"
                          onClick={() => handleReject(request._id)}
                          disabled={updatingRequest === request._id}
                        >
                          <CrossCircledIcon className="w-4 h-4 mr-2" />
                          {updatingRequest === request._id
                            ? "Rejecting..."
                            : "Reject"}
                        </Button>
                        <Button
                          color="green"
                          onClick={() => handleApprove(request._id)}
                          disabled={
                            updatingRequest === request._id || disableApprove
                          }
                          title={
                            disableApprove
                              ? "Create a Need before you can give help"
                              : undefined
                          }
                        >
                          <CheckCircledIcon className="w-4 h-4 mr-2" />
                          {updatingRequest === request._id
                            ? "Approving..."
                            : "Approve Request"}
                        </Button>
                      </Flex>
                    </div>
                  )}
                </Flex>
              </Card>
            ))}

          {/* Show other requests (approved/rejected) */}
          {requests
            .filter((r) => r.status !== "pending")
            .map((request) => (
              <Card key={request._id} className="p-4">
                <Flex direction="column" gap="3">
                  {/* User info */}
                  <Flex align="center" gap="3">
                    <Avatar
                      fallback={
                        request.user?.full_name?.[0] ||
                        request.user?.username?.[0] ||
                        "?"
                      }
                      size="3"
                    />
                    <div className="flex-1 flex flex-col">
                      <Text size="3" weight="bold">
                        {request.user?.full_name ||
                          request.user?.username ||
                          "Unknown User"}
                      </Text>
                      <Text size="2" color="gray">
                        @{request.user?.username}
                      </Text>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                      <Text size="1" color="gray">
                        {formatDate(request.created_at)}
                      </Text>
                    </div>
                  </Flex>

                  {/* User bio */}
                  {request.user?.bio && (
                    <Text size="2" color="gray">
                      {request.user.bio}
                    </Text>
                  )}

                  {/* Request message */}
                  {request.message && (
                    <div>
                      <Text size="2" weight="medium" className="block mb-1">
                        Message:
                      </Text>
                      <Text size="2" className="italic">
                        "{request.message}"
                      </Text>
                    </div>
                  )}

                  {/* Admin message */}
                  {request.admin_message && (
                    <div>
                      <Text size="2" weight="medium" className="block mb-1">
                        Your response:
                      </Text>
                      <Text size="2" className="italic">
                        "{request.admin_message}"
                      </Text>
                    </div>
                  )}
                </Flex>
              </Card>
            ))}
        </div>
      )}
    </>
  );
}
