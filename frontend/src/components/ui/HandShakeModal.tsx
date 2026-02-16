import { useState } from "react";
import { Service } from "@/types";
import { Button, Dialog, Flex, Text, Card, TextArea } from "@radix-ui/themes";
import { joinRequestsApi } from "@/services/api";

// @ts-ignore
import handshakeIcon from "../../assets/handshakeIcon.png";

interface HandShakeModalProps {
  service: Service;
  onJoin?: () => void;
}

export function HandShakeModal({ service, onJoin }: HandShakeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [joinStatus, setJoinStatus] = useState<
    "pending" | "accepted" | "rejected" | null
  >(null);
  const formatDuration = (hours: number) => {
    return `${hours}h`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleJoin = async () => {
    setIsSubmitting(true);

    try {
      // Call the actual backend API
      await joinRequestsApi.createJoinRequest({
        service_id: service._id,
        message: message.trim() || undefined,
      });

      setJoinStatus("pending");
      onJoin?.();
    } catch (error) {
      console.error("Error creating join request:", error);
      // You could add error handling here (show error message)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setMessage("");
    setJoinStatus(null);
  };

  const getStatusMessage = () => {
    switch (joinStatus) {
      case "accepted":
        return {
          title: "Your offer has been accepted!",
          message:
            "The provider has accepted your request. You can now start collaborating.",
          color: "lime" as const,
        };
      case "rejected":
        return {
          title: "Request declined",
          message:
            "The provider has declined your request. You can try other opportunities.",
          color: "red" as const,
        };
      case "pending":
        return {
          title: "Request pending",
          message: "Your request is waiting for approval from the provider.",
          color: "gray" as const,
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusMessage();

  if (!service?.service_type) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger>
        <Button size="3">
          {service.service_type === "offer" ? "Join Offer" : "Provide Help"}
        </Button>
      </Dialog.Trigger>
      <Dialog.Content className="max-w-md mx-auto">
        {statusInfo ? (
          // Status message
          <Flex direction="column" align="center" gap="4">
            <div className="text-center">
              <Text
                size="6"
                weight="medium"
                color={statusInfo.color}
                className="block mb-2"
              >
                {statusInfo.title}
              </Text>
              <Text size="2" color="gray">
                {statusInfo.message}
              </Text>
            </div>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </Flex>
        ) : (
          // Join form
          <>
            {/* Header with handshake icon */}
            <Flex direction="column" align="center" gap="2" className="mb-6">
              <img src={handshakeIcon} alt="Handshake" className="w-32" />
              <h1 className="text-2xl font-bold text-center">
                {service.service_type === "offer"
                  ? "Join This Offer"
                  : "Help with This Need"}
              </h1>
              <p className="text-center">
                {service.service_type === "offer"
                  ? "Confirm that you want to join this service offer"
                  : "Confirm that you want to help with this need"}
              </p>
            </Flex>

            {/* Service Details Card */}
            <Card className="mb-6">
              <Flex direction="column" gap="2">
                <Text size="4" weight="bold" className="flex-1">
                  {service.title}
                </Text>
                <Text size="2">{service.description}</Text>

                <Flex direction="column" gap="2">
                  <Flex justify="between">
                    <Text size="2" weight="medium">
                      Category:
                    </Text>
                    <Text size="2">{service.category}</Text>
                  </Flex>

                  <Flex justify="between">
                    <Text size="2" weight="medium">
                      Duration:
                    </Text>
                    <Text size="2">
                      {formatDuration(service.estimated_duration)}
                    </Text>
                  </Flex>

                  {service.deadline && (
                    <Flex justify="between">
                      <Text size="2" weight="medium">
                        Deadline:
                      </Text>
                      <Text size="2">{formatDate(service.deadline)}</Text>
                    </Flex>
                  )}
                </Flex>
              </Flex>
            </Card>

            {/* Optional message */}
            <div className="mb-6">
              <Text size="2" weight="medium" className="mb-2 block">
                Optional message to provider:
              </Text>
              <TextArea
                placeholder="Share your experience, availability, or any questions..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <Flex gap="3" justify="end">
              <Button variant="soft" color="gray" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleJoin} disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Confirm"}
              </Button>
            </Flex>
          </>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
